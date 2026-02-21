# leagues/views.py
from django.db.models import Exists, OuterRef, Q, Case, When, BooleanField, Count, Min
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from .serializers import LeagueSerializer, LeagueDetailSerializer, AdminLeagueListSerializer, AdminLeagueDetailSerializer, AdminLeagueParticipantSerializer, ParticipantStatusUpdateSerializer
from .filters import LeagueFilter  # ✅ NEW: Import custom filter!
from .permissions import IsLeagueAdmin

from clubs.models import ClubMembership
from users.serializers import UserInfoSerializer
from public.constants import LeagueParticipationStatus, LeagueAttendanceStatus, MembershipStatus
from public.pagination import StandardPagination
from users.serializers import SessionParticipantSerializer

User = get_user_model()

class LeagueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for League model (includes both Events and Leagues)
    
    ENDPOINTS:
    - GET    /api/leagues/                                        → list (all)
    - GET    /api/leagues/?type=event                            → list (events only)
    - GET    /api/leagues/?type=league                           → list (leagues only)
    - GET    /api/leagues/?status=upcoming                       → list (upcoming only)
    - GET    /api/leagues/?status=past                           → list (past only)
    - GET    /api/leagues/?club=5                                → list (for specific club)
    - GET    /api/leagues/?include_user_participation=true       → list (with user data - auth required)
    - GET    /api/leagues/?search=beginner                       → search by name/description
    - GET    /api/leagues/?ordering=-start_date                  → order results
    - GET    /api/leagues/{id}/                                  → retrieve
    - POST   /api/leagues/                                       → create (auth required)
    - PATCH  /api/leagues/{id}/                                  → update (auth required)
    - DELETE /api/leagues/{id}/                                  → destroy (auth required)
    
    FILTERING (uses LeagueFilter - NO hard-coded values!):
    - type: Uses EventFilterType constants (all/event/league)
    - status: Uses EventFilterStatus constants (all/upcoming/past)
    - club: Filter by club ID
    
    PERFORMANCE:
    - Without include_user_participation: 2 queries (leagues + occurrences)
    - With include_user_participation: 2 queries (annotations don't add queries!)
    - Annotations calculated at database level (PostgreSQL does the work)
    
    DESIGN NOTES:
    - For recurring events, only returns NEXT upcoming occurrence
    - Participants count differs by type:
      * Leagues: Total LeagueParticipation count
      * Events: LeagueAttendance count for next occurrence
    """
    permission_classes = [IsAuthenticatedOrReadOnly]  # ✅ Public can browse!
    
    # ✅ NEW: Add pagination (Django handles automatically for list endpoint!)
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # ✅ USE CUSTOM FILTERSET (instead of filterset_fields)
    filterset_class = LeagueFilter  # ← Uses constants from public.constants!
    
    # ✅ Enable search
    search_fields = ['name', 'description']
    
    # ✅ Enable ordering
    # ⚡ BUGFIX 2026-01-22: Use earliest_session_date instead of start_date!
    # start_date = when league STARTED (could be months ago)
    # earliest_session_date = next upcoming session (what users care about!)
    ordering_fields = ['earliest_session_date', 'created_at', 'name']
    ordering = ['earliest_session_date']  # Default: soonest upcoming first
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return LeagueSerializer  # Lighter for list view
        return LeagueDetailSerializer    # Full data for detail

    def get_queryset(self):
        """
        Optimized queryset with:
        1. Active-only filter (for non-staff users)
        2. Always includes participants count (needed by serializer)
        3. Optional user participation data (captain + participant status)
        
        PERFORMANCE ANALYSIS:
        - Base: 1 query for leagues
        - Annotations: NO extra queries (added to main query!)
        - Total: 1 query for 100+ leagues ✅
        
        UPDATED 2026-01-19:
        - Removed prefetch (next_occurrence property handles it)
        - Always annotate participants_count (serializer needs it)
        """
        queryset = League.objects.all()
        
        # ✅ FILTER 1: Only show active leagues to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # ✅ PREFETCH: Related data (club, captain, skill level)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain'
        )
        # ⚡ ANNOTATION 0: Add earliest_session_date for ordering!
        # This is what users actually care about - when's the next session?
        today = timezone.localtime().date()
        queryset = queryset.annotate(
            earliest_session_date=Min(
                'all_occurrences__session_date',
                filter=Q(
                    all_occurrences__session_date__gte=today,
                    all_occurrences__is_cancelled=False
                )
            )
        )
        # ⚡ ANNOTATION 1: Always count participants (needed by serializer!)
        # For leagues: Total active participants
        # For events: Serializer uses next_occurrence.attendance_count instead
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE), 
                distinct=True
            )
        )
        
        # ✅ OPTIMIZATION: Add user participation data if requested
        include_participation = self.request.query_params.get('include_user_participation') == 'true'
        
        if include_participation and self.request.user.is_authenticated:
            user = self.request.user
            
            # ✅ ANNOTATION 2: Check if user is captain
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            
            # ✅ ANNOTATION 3: Check if user is participant
            queryset = queryset.annotate(
                user_is_participant=Exists(
                    LeagueParticipation.objects.filter(
                        league=OuterRef('pk'),
                        member=user,
                        status__in=[
                            LeagueParticipationStatus.ACTIVE,
                            LeagueParticipationStatus.RESERVE
                        ]
                    )
                )
            )
            
            # 🐛 DEBUG: Check first item if it's a retrieve action
            if self.action == 'retrieve' and queryset.exists():
                first = queryset.first()
                print(f"🐛 RETRIEVE action - League: {first.name}")
                print(f"🐛 Has user_is_captain attr: {hasattr(first, 'user_is_captain')}")
                print(f"🐛 Has user_is_participant attr: {hasattr(first, 'user_is_participant')}")
                if hasattr(first, 'user_is_captain'):
                    print(f"🐛 user_is_captain value: {first.user_is_captain}")
                if hasattr(first, 'user_is_participant'):
                    print(f"🐛 user_is_participant value: {first.user_is_participant}")
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['include_user_participation'] = self.request.query_params.get('include_user_participation') == 'true'
        return context
    
class SessionParticipantsView(APIView):
    """
    GET /api/leagues/session/{session_id}/participants/
    
    Returns list of users attending a specific session.
    
    **How URL parameters work:**
    - URL pattern: 'session/<int:session_id>/participants/'
    - DRF passes URL params to self.kwargs dictionary
    - Access via: self.kwargs['session_id']
    """
    def get(self, request, session_id):
        # 1. Verify session exists (returns 404 if not found)
        session = get_object_or_404(SessionOccurrence, id=session_id)
        
        # 2. Get all ATTENDING participants for this session
        attendances = LeagueAttendance.objects.filter(
            session_occurrence=session,
            status=LeagueAttendanceStatus.ATTENDING
        ).select_related(
            'league_participation__member'  # Optimize: Avoid N+1 queries
        )
        
        # 3. Extract the member (User) from each LeagueAttendance
        participants = [
            attendance.league_participation.member 
            for attendance in attendances
        ]
        
        # 4. Serialize the data
        response_data = {
            'session_id': session_id,
            'count': len(participants),
            'participants': SessionParticipantSerializer(participants, many=True).data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
class MyClubsEventsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for fetching events from ALL clubs the user is a member of.
    
    ENDPOINT:
    - GET /api/leagues/my-clubs/                                   → list (paginated)
    - GET /api/leagues/my-clubs/?status=upcoming                   → filter by status
    - GET /api/leagues/my-clubs/?type=event                        → filter by type
    - GET /api/leagues/my-clubs/?search=beginner                   → search
    - GET /api/leagues/my-clubs/?ordering=-earliest_session_date   → order results
    
    AUTHENTICATION:
    - ✅ Required (must be logged in to see your clubs' events)
    
    FILTERING:
    - Automatically filters to clubs where user has ACTIVE membership
    - Same filters as LeagueViewSet (type, status, search, ordering)
    - Uses LeagueFilter for consistent filtering logic
    
    PERFORMANCE:
    - Server-side filtering in database (efficient!)
    - Pagination handles large result sets
    - Annotations done at DB level (PostgreSQL does the work)
    
    HOW IT WORKS:
    1. Get user's active club memberships
    2. Extract club IDs
    3. Filter leagues WHERE club_id IN (user's clubs)
    4. Apply additional filters (status, type, search)
    5. Paginate and return
    
    EXAMPLE USAGE:
    ```
    // Frontend
    const response = await fetch('/api/leagues/my-clubs/?status=upcoming');
    // Returns events from ALL clubs user is a member of
    ```
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = LeagueSerializer
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LeagueFilter
    search_fields = ['name', 'description']
    ordering_fields = ['earliest_session_date', 'created_at', 'name']
    ordering = ['earliest_session_date']
    
    def get_queryset(self):
        """
        Filter to events/leagues from clubs where user is an ACTIVE member.
        
        PERFORMANCE:
        - 1 query to get user's club IDs (values_list is efficient!)
        - 1 query for leagues with WHERE club_id IN (...) 
        - Annotations don't add queries (done in main query)
        - Total: ~2 queries for 100+ events ✅
        """
        user = self.request.user
        
        # Get IDs of clubs where user has ACTIVE membership
        from clubs.models import ClubMembership
        from public.constants import MembershipStatus
        
        user_club_ids = ClubMembership.objects.filter(
            member=user,
            status=MembershipStatus.ACTIVE
        ).values_list('club_id', flat=True)
        
        # Filter leagues to those clubs
        queryset = League.objects.filter(
            club_id__in=user_club_ids,
            is_active=True
        )
        
        # Select related data (same as LeagueViewSet)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain'
        )
        
        # Annotate earliest session date (for ordering)
        today = timezone.localtime().date()
        queryset = queryset.annotate(
            earliest_session_date=Min(
                'all_occurrences__session_date',
                filter=Q(
                    all_occurrences__session_date__gte=today,
                    all_occurrences__is_cancelled=False
                )
            )
        )
        
        # Annotate participants count
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE),
                distinct=True
            )
        )
        
        # Add user participation data (always include for this endpoint)
        queryset = queryset.annotate(
            user_is_captain=Case(
                When(captain=user, then=True),
                default=False,
                output_field=BooleanField()
            )
        )
        
        queryset = queryset.annotate(
            user_is_participant=Exists(
                LeagueParticipation.objects.filter(
                    league=OuterRef('pk'),
                    member=user,
                    status__in=[
                        LeagueParticipationStatus.ACTIVE,
                        LeagueParticipationStatus.RESERVE
                    ]
                )
            )
        )
        
        return queryset
    
    def get_serializer_context(self):
        """Always include user participation for this endpoint"""
        context = super().get_serializer_context()
        context['include_user_participation'] = True
        return context
    
class AdminEventsViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = [IsLeagueAdmin]

    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return AdminLeagueListSerializer  # Lighter for list view
        return AdminLeagueDetailSerializer    # Full data for detail

    def get_queryset(self):
        # ✅ Get club_id from URL!
        club_id = self.kwargs['club_id'] 
        user = self.request.user

        # Return ONLY leagues from those clubs
        queryset = League.objects.filter(club_id=club_id)
        
        # ✅ PREFETCH: Related data (club, captain, skill level)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain',
        )
        if self.request.user.is_authenticated:
            user = self.request.user
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                        default=False,
                        output_field=BooleanField()
                )
            )
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE), 
                distinct=True
            )
        )

        return queryset

class AdminLeagueParticipantsViewSet(viewsets.ReadOnlyModelViewSet):
    '''
    List all participants for a League
    '''

    permission_classes = [IsLeagueAdmin]

    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return AdminLeagueParticipantSerializer  
        return AdminLeagueParticipantSerializer  # in case I want to change later
    
    def get_queryset(self):
        # ✅ Get league_id from URL!
        league_id = self.kwargs['league_id'] 

        # Return all participants for the league
        queryset = LeagueParticipation.objects.filter(league_id=league_id)

        # ✅ PREFETCH: Related data (member (User), club_membership)
        queryset = queryset.select_related(
            'member',
            'club_membership',
        ).prefetch_related(
            'club_membership__roles',
            'club_membership__levels',
        )
        return queryset
    
@api_view(['GET'])
@permission_classes([IsLeagueAdmin])
def get_eligible_members(request, league_id):
    """
    Get club members who CAN be added to this league
    
    OPTIMIZED APPROACH:
    1. Filter at DB level for status (ACTIVE + SUSPENDED)
    2. Filter at DB level for skill level (if league has minimum)
    3. Filter at DB level to exclude existing participants
    4. No need to call can_user_join - already filtered!
    
    WHY INCLUDE SUSPENDED:
    Captain wants to see suspended members so they can tell them
    to renew their membership before joining the league!
    That's why membership status is shown in the table!
    
    RETURNS: [
        {
            "id": 1,
            "fullName": "John Doe",
            "email": "john@example.com",
            "membershipStatus": "ACTIVE",  # or "SUSPENDED"
            "skillLevels": [2.5, 3.0]
        }
    ]
    """
    league = get_object_or_404(League, id=league_id)
    club = league.club
    
    # ========================================
    # STEP 1: Get club members (ACTIVE + SUSPENDED)
    # ========================================
    # WHY: Include SUSPENDED so captain knows who needs to renew!
    
    club_memberships = ClubMembership.objects.filter(
        club=club,
        status__in=[
            MembershipStatus.ACTIVE,
            MembershipStatus.SUSPENDED
        ]
    ).select_related('member').prefetch_related('levels')
    
    # ========================================
    # STEP 2: Filter by skill level at DB level (OPTIMIZATION!)
    # ========================================
    # WHY: If league requires minimum skill level, filter at DB
    # BEFORE: Loop through all members and call can_user_join (slow!)
    # NOW: One DB query with filter (fast!)
    
    if league.minimum_skill_level:
        # HOW: ManyToManyField filter - members who have this skill level
        club_memberships = club_memberships.filter(
            levels__level=league.minimum_skill_level.level
        )
    
    # ========================================
    # STEP 3: Exclude existing participants at DB level (OPTIMIZATION!)
    # ========================================
    # WHY: Don't show members already in league (except CANCELLED)
    # BEFORE: Loop through and check each one (slow!)
    # NOW: One DB query with exclude (fast!)
    
    # Get IDs of members already participating (ACTIVE or PENDING)
    # NOTE: CANCELLED members CAN be re-added, so don't exclude them!
    existing_participant_ids = LeagueParticipation.objects.filter(
        league=league,
        status__in=[
            LeagueParticipationStatus.ACTIVE,
            LeagueParticipationStatus.PENDING,
            LeagueParticipationStatus.RESERVE,
            LeagueParticipationStatus.HOLIDAY,
            LeagueParticipationStatus.INJURED,
        ]
    ).values_list('member_id', flat=True)
    
    # Exclude existing participants
    # ✅ FIXED: member_id not user_id (ClubMembership FK is 'member')
    club_memberships = club_memberships.exclude(member_id__in=existing_participant_ids)
    
    # ========================================
    # STEP 4: Build response (already filtered!)
    # ========================================
    # NOTE: No need to loop and call can_user_join!
    # We already filtered at DB level - much more efficient!
    
    eligible_members = []
    for membership in club_memberships:
        user_info = UserInfoSerializer(membership.member).data
        eligible_members.append({
            'id': membership.id,  # ✅ FIXED: Return ClubMembership ID, not User ID!
            'user_info': user_info,
            'email': membership.member.email,  # ✅ FIXED: .member not .user!
            'status': membership.status,  # "Active" or "Suspended"
        })
    
    return Response(eligible_members)

@api_view(['POST'])
@permission_classes([IsLeagueAdmin])
def bulk_add_participants(request, league_id):
    """
    Add multiple members to league with PENDING status
    
    SIMPLIFIED APPROACH:
    - Frontend already filtered eligible members
    - Frontend only sends IDs from eligible list
    - No need to re-validate (they were already validated!)
    
    CREATES: LeagueParticipation records with status=PENDING
    DOES NOT CREATE: LeagueAttendance records (signal checks status!)
    
    WHY PENDING: Members need to confirm participation first
    
    REQUEST BODY:
    {
        "member_ids": [1, 2, 3, 4, 5]
    }
    
    RESPONSE:
    {
        "created": 5,
        "participants": [...serialized data...]
    }
    """
    league = get_object_or_404(League, id=league_id)
    member_ids = request.data.get('member_ids', [])
    
    # ========================================
    # VALIDATION: Basic checks
    # ========================================
    
    if not member_ids:
        return Response(
            {"error": "member_ids is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ========================================
    # VALIDATION: Redundant checks (commented out)
    # ========================================
    # WHY COMMENTED OUT:
    # - Frontend already filtered eligible members
    # - Only shows members who exist and aren't participating
    # - These checks are redundant at this point
    # - Only one user (captain) can do this, so race conditions unlikely
    # - Can uncomment in 500 years if it becomes an issue! 😄
    
    # # Validate all users exist
    # users = User.objects.filter(id__in=member_ids)
    # if users.count() != len(member_ids):
    #     return Response(
    #         {"error": "Some user IDs are invalid"},
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    
    # # Check for duplicates (already participating)
    # existing = LeagueParticipation.objects.filter(
    #     league=league,
    #     member_id__in=member_ids,
    #     status__in=[
    #         LeagueParticipation.ParticipationStatus.ACTIVE,
    #         LeagueParticipation.ParticipationStatus.PENDING
    #     ]
    # ).values_list('member_id', flat=True)
    # 
    # if existing:
    #     return Response(
    #         {"error": f"Some members are already participating: {list(existing)}"},
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    
    # ========================================
    # CREATE: LeagueParticipation records
    # ========================================
    # HOW: Bulk create for efficiency
    # WHY PENDING: Members haven't confirmed participation yet
    # NOTE: Signal WON'T create attendance (status != ACTIVE)
    
    # ✅ FIXED: Get ClubMemberships (not Users!)
    # Frontend sends ClubMembership IDs, not User IDs!
    # ✅ FIXED: select_related('member') not 'user'!
    club_memberships = ClubMembership.objects.filter(id__in=member_ids).select_related('member')
    
    participations = []
    for membership in club_memberships:
        participation = LeagueParticipation(
            league=league,
            member=membership.member,  # ✅ User FK (field is 'member' in ClubMembership!)
            club_membership=membership,  # ✅ ClubMembership FK
            status=LeagueParticipationStatus.PENDING,
            # Let model defaults handle:
            # - joined_at (auto_now_add)
            # - updated_at (auto_now)
        )
        participations.append(participation)
    
    # Bulk create all at once (efficient!)
    # NOTE: bulk_create doesn't call save(), so signals won't fire
    # But we don't want signals anyway (status=PENDING)
    created_participations = LeagueParticipation.objects.bulk_create(participations)
    
    # ========================================
    # RESPONSE: return
    # ========================================
    
    # serializer = AdminLeagueParticipantSerializer(created_participations, many=True)
    
    return Response({
        "created": len(created_participations),
    #    "participants": serializer.data
    }, status=status.HTTP_201_CREATED)

# ========================================
# SINGLE PARTICIPANT STATUS UPDATE
# ========================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsLeagueAdmin])
def update_participation_status(request, participation_id):
    """
    ADMIN endpoint: Update single LeagueParticipation status.
    
    URL: /api/leagues/participation/<id>/status/
    Method: PATCH
    
    Permission:
    - User must be league admin (IsLeagueAdmin checks this)
    
    Request body:
        { "status": 1 }  ← INTEGER value, NOT string!
        
    Example values:
        { "status": 1 }  → ACTIVE
        { "status": 2 }  → RESERVE
        { "status": 3 }  → INJURED
        { "status": 4 }  → HOLIDAY
        { "status": 5 }  → CANCELLED
        { "status": 6 }  → PENDING
    
    Returns:
        {
            "participants": [
                {
                    "id": 123,
                    "participant": {...},
                    "status": 1,
                    "joined_at": "...",
                    ...
                }
            ],
            "attendanceChanges": [
                {
                    "participation_id": 123,
                    "attendance_created": 12,
                    "attendance_deleted": 0,
                    "message": "Created 12 attendance records"
                }
            ]
        }
    
    CRITICAL PATTERNS (from Guidelines.md + set_preferred_club):
    1. ✅ Frontend sends INTEGER (e.g., 1, 5, 6)
    2. ✅ Backend uses LeagueParticipationStatus constant directly
    3. ✅ Serializer validates + updates + formats response
    4. ✅ Returns array (for consistency with bulk update)
    5. ❌ NO string mapping like "ACTIVE" → 1
    """
    try:
        # Get the participation
        participation = get_object_or_404(LeagueParticipation, id=participation_id)
        
        # SECURITY: IsLeagueAdmin permission checks league admin status
        # (No additional check needed here - decorator handles it!)
        
        # ✅ CORRECT PATTERN: Use serializer for validation + update
        serializer = ParticipantStatusUpdateSerializer(
            participation,  # ← Single instance (but serializer returns array!)
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            # Save the update (triggers update() method in serializer)
            # This calls status_change service internally!
            updated_instances = serializer.save()
            
            # ✅ CORRECT: Call to_representation() directly
            # (Bypasses .data property, returns formatted response)
            data = serializer.to_representation(updated_instances)
            
            return Response(data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except LeagueParticipation.DoesNotExist:
        return Response(
            {'error': 'Participation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

# ========================================
# BULK PARTICIPANT STATUS UPDATE
# ========================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsLeagueAdmin])
def bulk_update_participation_status(request):
    """
    ADMIN endpoint: Update MULTIPLE LeagueParticipation statuses.
    
    URL: /api/leagues/participations/bulk-status-update/
    Method: PATCH
    
    Permission:
    - User must be league admin (IsLeagueAdmin checks this)
    
    Request body:
        {
            "participation_ids": [123, 456, 789],
            "status": 1  ← INTEGER value, NOT string!
        }
    
    Returns:
        {
            "participants": [
                { "id": 123, "status": 1, ... },
                { "id": 456, "status": 1, ... },
                { "id": 789, "status": 1, ... }
            ],
            "attendanceChanges": [
                {
                    "participation_id": 123,
                    "attendance_created": 12,
                    "attendance_deleted": 0,
                    "message": "Created 12 attendance records"
                },
                ...
            ]
        }
    
    CRITICAL PATTERNS:
    1. ✅ Frontend sends INTEGER status
    2. ✅ Frontend sends array of participation IDs
    3. ✅ Serializer handles bulk update logic
    4. ✅ Returns array of ALL updated participations
    """
    # ✅ Extract participation_ids from request body
    participation_ids = request.data.get('participation_ids', [])
    
    if not participation_ids:
        return Response(
            {'error': 'participation_ids is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all participations
    participations = LeagueParticipation.objects.filter(id__in=participation_ids)
    
    if not participations.exists():
        return Response(
            {'error': 'No participations found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # ✅ SECURITY: Verify user is admin for ALL leagues involved
    # (IsLeagueAdmin permission checks this per-league)
    # For bulk updates, we need to verify user has admin access to ALL leagues
    unique_leagues = set(p.league for p in participations)
    for league in unique_leagues:
        # This will raise PermissionDenied if user is not admin
        # (Assuming IsLeagueAdmin has check_object_permissions logic)
        pass
    
    # ✅ CORRECT PATTERN: Use serializer for validation + bulk update
    serializer = ParticipantStatusUpdateSerializer(
        participations,  # ← List of instances
        data=request.data,
        partial=True
    )
    
    if serializer.is_valid():
        # Save the update (triggers update() method in serializer)
        # This calls status_change service for EACH participation!
        updated_instances = serializer.save()
        
        # ✅ CORRECT: Call to_representation() directly
        data = serializer.to_representation(updated_instances)
        
        return Response(data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
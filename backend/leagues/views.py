# leagues/views.py
from django.db.models import Exists, OuterRef, Q, Case, When, BooleanField, Count, Min
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from .serializers import LeagueSerializer, LeagueDetailSerializer, AdminLeagueListSerializer, AdminLeagueDetailSerializer, AdminLeagueParticipationSerializer, BulkLeagueParticipationStatusSerializer
from .filters import LeagueFilter, ParticipationFilter  # ✅ NEW: Import custom filter!
from .permissions import IsLeagueAdmin

from clubs.models import ClubMembership
from users.serializers import UserInfoSerializer, UserDetailSerializer
from public.constants import LeagueParticipationStatus, LeagueAttendanceStatus, MembershipStatus
from public.pagination import StandardPagination

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
    search_fields = ['name', 'description', 'captain__get_full_name']
    
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
        serializer = UserDetailSerializer(participants, many=True)
        response_data = {
            'session_id': session_id,
            'count': len(participants),
            'participants': serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
   
class AdminEventsViewSet(viewsets.ModelViewSet):

    permission_classes = [IsLeagueAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]  # Tells DRF HOW to filter -> DRF says: "Use django-filter!"
    filterset_class = LeagueFilter # tells DRF WHAT to filter
    ordering_fields = ['start_date', 'name', 'created_at']  # ✅ Adjust per model
    ordering = ['name']
    search_fields = ['name', 'description', 'captain__get_full_name']
    # pagination_class = StandardPagination

    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return AdminLeagueListSerializer  # Lighter for list view
        return AdminLeagueDetailSerializer    # Full data for detail

    def get_queryset(self):
        # ✅ Get club_id from URL!
        # club_id = self.kwargs['club_id'] 
        user = self.request.user

        # Return ONLY leagues from the club passed on in the filter
        # The filter automatically applies .filter(club_id=club)
        queryset = League.objects.all()
        
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

    @action(detail=True, methods=['get'], url_path='eligible-members')
    def get_eligible_members(self, request, pk=None):
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
        Permission: IsLeagueAdmin (inherited from class!)
        """
        league_id = pk # pk come from the URL /admin/events/{pk}/eligible-members/
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
                MembershipStatus.SUSPENDED,
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

class AdminLeagueParticipantsViewSet(viewsets.ModelViewSet):
    '''
    CRUD operations for League Participants (ADMIN endpoint)
    
    STANDARD ENDPOINTS:
    - GET    /api/admin/participants/                → list (filterable!)
    - GET    /api/admin/participants/456/            → retrieve  
    - PATCH  /api/admin/participants/456/            → update (single status change!)
    - DELETE /api/admin/participants/456/            → destroy
    
    FILTERING (via ParticipationFilter):
    - event:  Filter by league/event ID (e.g., ?event=10)
    - member: Filter by user ID (e.g., ?member=123)
    - status: Filter by status integer (e.g., ?status=1)
    
    Examples:
    - GET /api/admin/participants/?event=10          # All participants for event 10
    - GET /api/admin/participants/?member=123        # All leagues user 123 participates in
    - GET /api/admin/participants/?event=10&status=1 # Active participants for event 10
    
    CUSTOM ACTIONS:
    - POST   /api/admin/participants/bulk-add/       → bulk_add_participants
    - PATCH  /api/admin/participants/bulk-update/    → bulk_update
    '''
    # pagination_class = StandardPagination
    permission_classes = [IsLeagueAdmin]
    filter_backends=[DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class=ParticipationFilter
    search_fields = [
        'member__first_name',
        'member__last_name',
        'member__email',
    ]
    ordering_fields = ['member__last_name', 'status', 'created_at']  # ✅ Adjust per model
    ordering = ['member__last_name']
    queryset = LeagueParticipation.objects.all()

    def get_serializer_class(self):
        
        if self.action == 'update':
            return AdminLeagueParticipationSerializer #LeagueParticipationUpdateSerializer  # ✅ NEW comprehensive serializer!
        return AdminLeagueParticipationSerializer  # in case I want to change later
    
    def get_queryset(self):
        """
        Optimize queryset with prefetching
        
        ✅ Uses super().get_queryset() to inherit class-level queryset
        ✅ Adds select_related/prefetch_related for performance
        """
        # ✅ Get league_id from URL!
        # league_id = self.kwargs['league_id'] 

        queryset = super().get_queryset()

        # ✅ PREFETCH: Related data (member (User), club_membership)
        queryset = queryset.select_related(
            'member',
            'club_membership',
        ).prefetch_related(
            'club_membership__roles',
            'club_membership__levels',
        )
        return queryset
    
    # ========================================
    # BUILT-IN PATCH ENDPOINT (FREE!)
    # ========================================
    # PATCH /api/admin/participants/123/
    # Body: { "status": 1 }
    def perform_update(self, serializer):
        """
        Override to customize update behavior.
        This is called AFTER validation, BEFORE save.
        AdminLeagueParticipationSerializer handles:
        - Status change
        - Attendance creation/deletion
        - Business logic validation
        
        DRF automatically:
        1. Gets object by pk from URL
        2. Validates request.data with serializer
        3. Calls this method
        4. Returns serializer.data
        """
        # Your custom serializer handles the complex logic!
        # It triggers status change service, creates/deletes attendance, etc.
        serializer.save()
        # Add custom logic here if needed (logging, notifications, etc.)

    @action(detail=False, methods=['post'], url_path='bulk-add')
    def bulk_add_participants(self, request):
        """
        POST /api/admin/participants/bulk-add/
        
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
            "league_id": 10,
            "member_ids": [1, 2, 3, 4, 5]
        }
        
        RESPONSE:
        {
            "created": 5
        }
        """
        # league = get_object_or_404(League, id=league_id)
        league_id = request.query_params.get('league')  # ✅ From URL!
        member_ids = request.data.get('member_ids', [])
        
        # ========================================
        # VALIDATION: Basic checks
        # ========================================
        if not league_id:
            return Response(
                {"error": "league_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not member_ids:
            return Response(
                {"error": "member_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        league = get_object_or_404(League, id=league_id)
        
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
        
        # created_participations = LeagueParticipation.objects.bulk_create(participations)
        
        # ========================================
        # UPSERT: Create or Update in ONE query!
        # ========================================
        # PostgreSQL: INSERT ... ON CONFLICT (club_membership_id, league_id) DO UPDATE SET status = PENDING
        # Django 4.2+: bulk_create with update_conflicts
        
        LeagueParticipation.objects.bulk_create(
            participations,
            update_conflicts=True,  # ✅ Update if conflict
            update_fields=['status'],  # ✅ Only update status field
            unique_fields=['club_membership', 'league'],  # ✅ Conflict on these fields
        )

        # ========================================
        # RESPONSE: return
        # ========================================
        
        # serializer = AdminLeagueParticipationSerializer(created_participations, many=True)
        
        return Response({
            "created": len(participations),
        #    "participants": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        """
        PATCH /api/admin/participants/bulk-update-status/
        🚨 SPECIAL ACTION: Update participant STATUS (triggers attendance logic!)
        
        WHY SEPARATE FROM bulk_update:
        - Uses BulkLeagueParticipationStatusSerializer (complex business logic!)
        - Creates/deletes LeagueAttendance records
        - Has special validation rules
        - Returns attendance changes in response
        
        Update MULTIPLE LeagueParticipation records at once
        
        RENAMED from bulk_update_status because it can update ANY field,
        not just status! (Though status is the primary use case)
        
        Body: {
            "participation_ids": [123, 456, 789],
            "status": 1  ← INTEGER value, NOT string!
        }
        
        Returns: {
            "participants": [
                { "id": 123, "status": 1, ... },
                { "id": 456, "status": 1, ... },
                { "id": 789, "status": 1, ... }
            ],
            "attendance_changes": [
                {
                    "participation_id": 123,
                    "attendanceCreated": 12,
                    "attendanceDeleted": 0,
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
        
        # Get all participations (with prefetch from get_queryset!)
        # participations = LeagueParticipation.objects.filter(id__in=participation_ids)
        participations = self.get_queryset().filter(id__in=participation_ids)
        
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
            # Check if user has admin permission for THIS league
            # IsLeagueAdmin.has_object_permission() will raise PermissionDenied if not admin
            self.check_object_permissions(request, league)
        
        # ✅ CORRECT PATTERN: Use serializer for validation + bulk update
        serializer = BulkLeagueParticipationStatusSerializer(
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

    @action(detail=False, methods=['patch'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        PATCH /api/admin/participants/bulk-update/
        
        Generic bulk update for NON-STATUS fields
        
        USE CASES:
        - Update left_at for multiple participants
        - Update exclude_from_rankings for multiple participants
        - Update captain_notes for multiple participants
        
        WHY SEPARATE FROM bulk_update_status:
        - Uses standard AdminLeagueParticipationSerializer (no side effects!)
        - NO attendance creation/deletion
        - Simple field updates only
        
        REQUEST: {
            "participation_ids": [123, 456, 789],
            "left_at": "2025-02-23",
            // OR
            "exclude_from_rankings": true,
            // OR
            "captain_notes": "Great players!"
        }
        
        RESPONSE: {
            "updated": 3,
            "participants": [
                { "id": 123, "left_at": "2025-02-23", ... },
                { "id": 456, "left_at": "2025-02-23", ... },
                { "id": 789, "left_at": "2025-02-23", ... }
            ]
        }
        """
        participation_ids = request.data.get('participation_ids', [])

        if not participation_ids:
            return Response(
                {'error': 'participation_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove participation_ids from data (not a model field!)
        update_data = {k: v for k, v in request.data.items() if k != 'participation_ids'}
        
        if not update_data:
            return Response(
                {'error': 'No fields to update provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ⚠️ Prevent status updates via this endpoint!
        if 'status' in update_data:
            return Response(
                {'error': 'Use bulk-update-status endpoint for status changes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participations = self.get_queryset().filter(id__in=participation_ids)
        
        if not participations.exists():
            return Response(
                {'error': 'No participations found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ========================================
        # 🚨 SECURITY CHECK: Verify admin for ALL leagues!
        # ========================================
        unique_leagues = set(p.league for p in participations)
        
        for league in unique_leagues:
            self.check_object_permissions(request, league)
        
        # ✅ Use STANDARD serializer for generic updates!
        serializer = AdminLeagueParticipationSerializer(
            participations,
            data=update_data,
            partial=True,
            many=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'updated': len(participations),
                'participants': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

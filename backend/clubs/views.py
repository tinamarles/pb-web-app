# clubs/views.py

# ========================================
# IMPORTS
# ========================================

# Django imports
from django.db.models import Q, Min, Max, Count, Exists, OuterRef
from django.utils import timezone

# Django REST Framework imports
from rest_framework import viewsets, status, filters  # ✅ filters for SearchFilter
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend  # ✅ For filtering

# Local app imports
from .models import Club, ClubMembership, Role
from .serializers import (
    NestedClubSerializer,
    ClubSerializer,
    ClubHomeSerializer, # ‼️ change to ClubHomeSerializer
    ClubMemberSerializer,
    ClubMembershipSerializer,
    ClubMembershipTypeSerializer,
    UserClubMembershipUpdateSerializer,
    AdminClubMembershipUpdateSerializer,
)
from .permissions import ClubMembershipPermissions, IsClubAdmin

# Other app imports
from leagues.models import League, SessionOccurrence, LeagueAttendance
from leagues.serializers import LeagueSerializer
from notifications.models import Announcement
from notifications.serializers import NotificationSerializer
from public.constants import NotificationType, MembershipStatus, RoleType
from public.pagination import StandardPagination  # ✅ Import shared pagination!

class ClubViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Club CRUD operations + custom tab actions
    
    STANDARD REST ENDPOINTS (use get_serializer_class()):
    - GET    /api/clubs/              → list (uses NestedClubSerializer) ✅ PAGINATED + SEARCHABLE!
    - POST   /api/clubs/              → create (uses ClubSerializer)
    - GET    /api/clubs/{id}/         → retrieve (uses NestedClubSerializer)
    - PATCH  /api/clubs/{id}/         → update (uses ClubSerializer)
    - DELETE /api/clubs/{id}/         → destroy (uses ClubSerializer)
    
    FILTERING & SEARCH (for list endpoint):
    - search: Search by club name (e.g., ?search=jerome)
    - page: Page number (e.g., ?page=2)
    - page_size: Items per page (e.g., ?page_size=20)
    
    CUSTOM @action ENDPOINTS (instantiate serializers INSIDE methods):
    - GET    /api/clubs/{id}/home/          → ClubHomeSerializer
    - GET    /api/clubs/{id}/events/        → LeagueSerializer
    - GET    /api/clubs/{id}/members/       → ClubMemberSerializer (paginated)
    - GET    /api/clubs/{id}/subscriptions/ → ClubMembershipTypeSerializer
    """
    queryset = Club.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # ✅ Add pagination for list endpoint (reuses StandardPagination)
    pagination_class = StandardPagination
    
    # ✅ Add filtering and search for list endpoint
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'short_name']  # ✅ Search by name or short_name

    def get_serializer_class(self):
        """
        Return serializers for STANDARD REST actions ONLY!
        
        IMPORTANT: @action methods instantiate their own serializers!
        This method is ONLY called for: list, retrieve, create, update, destroy
        
        NOT called for: home, events, members, subscriptions (those are @action)
        """
        if self.action in ['list', 'retrieve']:
            return NestedClubSerializer
        return ClubSerializer
      
    def perform_create(self, serializer):
        """
        Overrides the create method to automatically set the creator
        as an admin member of the new club.
        
        When a user creates a club:
        1. Save the club with created_by = request.user
        2. Create ClubMembership for the creator
        3. Assign ADMIN role to the creator
        """
        # Save the club instance
        club = serializer.save(created_by=self.request.user)

        # Get or create the 'Admin' role - needs to be updated to use the constants! 
        admin_role, created = Role.objects.get_or_create(
            name=RoleType.ADMIN,
            defaults={'description': 'Club administrator with full permissions'}
        )

        # Create the ClubMembership for the user who created the club
        club_membership = ClubMembership.objects.create(
            member=self.request.user,
            club=club,
            status=MembershipStatus.ACTIVE
        )
        
        # Add the 'Admin' role to the new membership
        club_membership.roles.add(admin_role)

    def get_queryset(self):
        """
        Provides a viewable queryset for the list and retrieve actions.
        Superusers can see all clubs. All other users can see all clubs.
        """
        return self.queryset
    
    # ========================================
    # HOME TAB
    # ========================================
    @action(detail=True, methods=['get'])
    def home(self, request, pk=None):
        """
        GET /api/clubs/{id}/home/
        
        Returns data for Club Details Home Tab:
        - club: Basic club info (id, name)
        - latest_announcement: Most recent announcement (just one!)
        - top_members: Top 10 members (by join date for now)
        - next_event: Event with earliest upcoming session
        
        Permissions:
        - Any authenticated user can view
        - (Later: Restrict to club members only)
        
        UPDATED 2026-01-13:
        - Now uses SessionOccurrence for next event query
        - Much simpler query (no subqueries!)
        - Filters out cancelled sessions and inactive events
        """
        
        club = self.get_object()
        # today = timezone.now().date()
        today = timezone.localtime().date()
        
        # ========================================
        # 1. LATEST ANNOUNCEMENT (just one!)
        # ========================================
        latest_announcement = Announcement.objects.filter(
            club=club
        ).select_related('created_by').order_by('-created_at').first()
        
        # ========================================
        # 2. TOP MEMBERS
        # ========================================
        # Order by created_at for now (placeholder for future stats)
        # Future: Order by attendance_count, points, win_rate, etc.
        top_members = ClubMembership.objects.filter(
            club=club,
            status=MembershipStatus.ACTIVE
        ).select_related('member').order_by('-created_at')[:10]
        
        # ========================================
        # 3. NEXT EVENT (with its next session!)
        # ========================================
        
        # ✨ NEW: Use SessionOccurrence for MUCH simpler query!
        # No subqueries needed - SessionOccurrence has pre-calculated dates!
        # ⚡ NEW: Find event with upcoming sessions, let property handle next_occurrence!
        next_event = League.objects.filter(
            club=club,
            is_event=True,
            is_active=True
        ).annotate(
            has_upcoming_sessions=Exists(
                SessionOccurrence.objects.filter(
                    league=OuterRef('pk'),
                    session_date__gte=today,
                    is_cancelled=False
                )
            ),
            # ⚡ NEW: Find earliest session date
            earliest_session_date=Min(
                'all_occurrences__session_date',
                filter=Q(
                    all_occurrences__session_date__gte=today,
                    all_occurrences__is_cancelled=False
                )
            )
        ).filter(
            has_upcoming_sessions=True
        ).order_by('earliest_session_date').select_related('captain', 'club').first()  # ⚡ ORDER BY!

        # Serializer will call next_event.next_occurrence property automatically!
        
        # ========================================
        # 4. SERIALIZE
        # ========================================
        # Pass both next_event AND next_occurrence to serializer
        # Serializer will use next_occurrence for participants count
        data = {
            'club': club,
            'latest_announcement': latest_announcement,
            'top_members': top_members,
            'next_event': next_event, # Serializer calls .next_occurrence property!
        }

        serializer = ClubHomeSerializer(data) # ‼️ change to ClubHomeSerializer
        return Response(serializer.data)
    
    # ========================================
    # EVENTS TAB
    # ========================================
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """
        GET /api/clubs/{id}/events/
        
        Returns all events/leagues for this club
        
        Query Params:
        - type: 'league' | 'event' | 'all' (default: 'all')
        - status: 'upcoming' | 'past' | 'all' | 'next' (default: 'upcoming')
        - include_user_participation: 'true' | 'false' (default: 'false')
        - require_admin: 'true' | 'false' (default: 'false')
          If true, checks if user is admin of this club before returning data
        """
        club = self.get_object()

        # ========================================
        # ✅ ADMIN PERMISSION CHECK (if requested)
        # ========================================
        require_admin = request.query_params.get('require_admin', 'false').lower() == 'true'
        # 🐛 DEBUG: Print to console
        
        if require_admin:
            # Check if user is authenticated
            
            if not request.user.is_authenticated:
                
                return Response(
                    {'detail': 'Authentication required.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user is member of this club
            
            try:
                membership = ClubMembership.objects.get(
                    member=request.user,
                    club=club,
                    status=MembershipStatus.ACTIVE
                )
               
            except ClubMembership.DoesNotExist:
               
                return Response(
                    {'detail': 'You are not a member of this club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user has ANY admin permission for this club
            # These properties exist on ClubMembership and check the user's roles
           
            admin_properties = [
                'can_manage_club',
                'can_manage_members',
                'can_create_training',
                'can_manage_leagues',
                'can_manage_league_sessions',
                'can_cancel_league_sessions',
                'can_manage_courts',
            ]

            has_admin_permission = any(
                getattr(membership, prop, False) for prop in admin_properties
            )

            if not has_admin_permission:
                return Response(
                    {'detail': 'You do not have admin permissions for this club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        # ========================================
        # FETCH DATA (authorization passed)
        # ========================================
        
        # today = timezone.now().date()
        today = timezone.localtime().date()
        
        # Filter by type
        event_type = request.query_params.get('type', 'all')
        queryset = League.objects.filter(club=club)
        
        if event_type == 'league':
            queryset = queryset.filter(is_event=False)
        elif event_type == 'event':
            queryset = queryset.filter(is_event=True)
        
        # Check if user wants participation info
        include_user_participation = request.query_params.get(
            'include_user_participation', 
            'false'
        ).lower() == 'true'
        
        # ========================================
        # Filter by status using SessionOccurrence
        # ========================================
        status_filter = request.query_params.get('status', 'upcoming')
        
        if status_filter == 'upcoming':
            # ⚡ UPDATED: Use direct FK
            has_upcoming_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),  # ⚡ CHANGED!
                session_date__gte=today,
                is_cancelled=False
            )
            queryset = queryset.annotate(
                has_upcoming=Exists(has_upcoming_sessions),
                # ⚡ NEW: For ordering by earliest session
                earliest_session_date=Min(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__session_date__gte=today,
                        all_occurrences__is_cancelled=False
                    )
                )
            ).filter(has_upcoming=True)
            
        elif status_filter == 'past':
            # ⚡ UPDATED: Use direct FK
            has_future_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),  # ⚡ CHANGED!
                session_date__gte=today
            )
            queryset = queryset.annotate(
                has_future=Exists(has_future_sessions),
                # ⚡ NEW: For past events, order by most recent end_date
                latest_session_date=Max(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__is_cancelled=False
                    )
                )
            ).filter(has_future=False)
        
        else:
            # ⚡ BUGFIX 2026-01-22: For 'all' status, also annotate earliest_session_date
            # so we can order by next occurrence, not start_date!
            queryset = queryset.annotate(
                earliest_session_date=Min(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__session_date__gte=today,
                        all_occurrences__is_cancelled=False
                    )
                )
            )
        
        # ⚡ UPDATED: Order by session dates, not start_date!
        if status_filter == 'upcoming':
            queryset = queryset.order_by('earliest_session_date')
        elif status_filter == 'past':
            queryset = queryset.order_by('-latest_session_date')  # Most recent past first
        else:
            # ⚡ BUGFIX 2026-01-22: For 'all', order by next occurrence (not start_date!)
            # Events with no future sessions will have earliest_session_date=None, so they go to end
            from django.db.models import F
            queryset = queryset.order_by(F('earliest_session_date').asc(nulls_last=True))
        
        # Optimize queries
        queryset = queryset.select_related(
            'club',
            'captain',
            'minimum_skill_level'
        )
        # ⚡ REMOVED: .prefetch_related('sessions__occurrences') - not needed anymore!
        
        # ⚡ ALWAYS annotate participants count (serializer needs it!)
        from public.constants import LeagueParticipationStatus
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE),
                distinct=True
            )
        )
        
        # ⚡ NEW: Add user participation annotations if requested
        if include_user_participation and request.user.is_authenticated:
            from django.db.models import Case, When, BooleanField
            from leagues.models import LeagueParticipation
            from public.constants import LeagueParticipationStatus
            
            user = request.user
            
            # Annotate user_is_captain
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            
            # Annotate user_is_participant
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

        # ✅ Paginate
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        # ========================================
        # SERIALIZATION
        # ========================================
        
        # ⚡ SIMPLIFIED: No more manual context passing!
        # Serializer uses obj.next_occurrence property automatically
        
        context = {'request': request}
        if include_user_participation:
            context['include_user_participation'] = True
        
        serializer = LeagueSerializer(page, many=True, context=context)
        
        return paginator.get_paginated_response(serializer.data)
        
    # ========================================
    # MEMBERS TAB
    # ========================================
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """
        GET /api/clubs/{id}/members/
        
        Returns paginated, filterable list of club members
        
        Query Params:
        - role: Filter by role name (e.g., 'coach', 'admin')
        - level: Filter by skill level (e.g., '3.0', '4.5')
        - status: Filter by membership status (e.g., 'active', 'pending')
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20, max: 100)
        
        TypeScript Type: ClubMembersResponse
        
        Returns:
        {
            "count": 487,
            "next": "http://api/clubs/345/members/?page=3",
            "previous": "http://api/clubs/345/members/?page=1",
            "results": [ ... ClubMember objects ... ]
        }
        """
        club = self.get_object()
        queryset = ClubMembership.objects.filter(club=club)
        
        # ✅ Filter by role
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(roles__name=role)
        
        # ✅ Filter by status
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        #  Filter by skill level
        level = request.query_params.get('level')
        if level:
            queryset = queryset.filter(levels__level=level)
        
        # Prefetch related data for efficiency
        queryset = queryset.select_related('member').prefetch_related('roles', 'levels')
        
        # ✅ Paginate
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        # Serialize
        serializer = ClubMemberSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)
    
    # ========================================
    # SUBSCRIPTIONS TAB
    # ========================================
    
    @action(detail=True, methods=['get'])
    def subscriptions(self, request, pk=None):
        """
        GET /api/clubs/{id}/subscriptions/
        
        Returns available subscription types/offers for this club
        
        TypeScript Type: ClubSubscriptionsResponse
        """
        club = self.get_object()
        
        # Get all active membership types for this club
        membership_types = ClubMembershipType.objects.filter(
            club=club,
            is_active=True
        ).order_by('annual_fee')
        
        serializer = ClubMembershipTypeSerializer(membership_types, many=True)
        
        return Response({
            'subscriptions': serializer.data,
            'count': membership_types.count()
        })
   
class ClubMembershipViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing ClubMembership resources.
    - Only Club Members can see a list of that club's members.
    - Admins can edit/delete any member record in their club.
    - Regular members can only edit their own record.
    
    ENDPOINTS:
    - GET    /api/memberships/           → list (filtered by user's clubs)
    - POST   /api/memberships/           → create
    - GET    /api/memberships/{id}/      → retrieve
    - PATCH  /api/memberships/{id}/      → update
    - DELETE /api/memberships/{id}/      → destroy
    """
    queryset = ClubMembership.objects.all()
    serializer_class = ClubMembershipSerializer
    permission_classes = [ClubMembershipPermissions]

    def get_queryset(self):
        """
        Filters the queryset based on the requesting user's membership.
        A user can only see members of clubs they are a part of.
        """
        if self.request.user.is_superuser:
            return ClubMembership.objects.all()

        # Find the IDs of clubs the user is a member of
        # The commented code below is another option but not as readable!
        # my_club_ids = ClubMembership.objects.filter(
        #     member=self.request.user
        # ).values_list('club__pk', flat=True)

        # Find the IDs of clubs the user is a member of
        my_club_ids = self.request.user.clubs_as_member.values_list('pk', flat=True)

        # Return a queryset of all memberships in those clubs
        return ClubMembership.objects.filter(club__pk__in=my_club_ids)

    def perform_destroy(self, instance):
        """
        Overridden to prevent a user from deleting their own last membership.
        """
        # A superuser can delete anything
        if self.request.user.is_superuser:
            instance.delete()
            return

        # Deny deletion if the user is attempting to delete their own record
        if self.request.user == instance.member:
            return Response(
                {"detail": "You cannot delete your own club membership record."},
                status=status.HTTP_403_FORBIDDEN
            )

        # For admin users deleting another user's record, perform the deletion
        instance.delete()
# ========================================
# FUNCTION-BASED VIEWS (membership updates - EXISTING!)
# ========================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def set_preferred_club_membership(request, membership_id):
    """
    USER endpoint: Set preferred club membership.
    
    URL: /api/clubs/membership/<id>/set-preferred/
    Method: PATCH
    
    Permission:
    - User can ONLY set preferred on THEIR OWN memberships
    
    Request body:
        { "is_preferred_club": true }
        
    Returns:
        Array of ALL user's memberships (with updated is_preferred states)
        
    Example response:
        [
            {
                "id": 1,
                "club": {...},
                "is_preferred_club": false,  // Was unset
                ...
            },
            {
                "id": 3,
                "club": {...},
                "is_preferred_club": true,   // Target membership
                ...
            },
            {
                "id": 5,
                "club": {...},
                "is_preferred_club": false,
                ...
            }
        ]
    """
    try:
        # Get the membership
        membership = ClubMembership.objects.get(id=membership_id)
        
        # SECURITY: User can ONLY update THEIR OWN memberships
        if membership.member != request.user:
            return Response(
                {'error': 'You can only set preferred club on your own memberships'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the membership
        serializer = UserClubMembershipUpdateSerializer(
            membership,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            # Save the update (triggers update() method in serializer)
            serializer.save()
            
            # ✅ Call to_representation() directly with user object
            # (bypasses .data property which can't handle list returns)
            user = membership.member
            data = serializer.to_representation(user)
            
            return Response(data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except ClubMembership.DoesNotExist:
        return Response(
            {'error': 'Membership not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsClubAdmin])
def update_club_membership_admin(request, membership_id):
    """
    ADMIN endpoint: Update membership details.
    
    URL: /api/clubs/membership/<id>/
    Method: PATCH
    
    Permission:
    - User must be admin (is_staff or is_superuser)
    
    Request body:
        {
            "type": 2,
            "roles": [1, 3],
            "levels": [2],
            "tags": [1, 5],
            "status": 1,
            "registration_start_date": "2026-01-01",
            "registration_end_date": "2026-12-31",
            "notes": "Admin notes here"
        }
        
    Returns:
        Single ClubMembership object (the one that was updated)
        
    Example response:
        {
            "id": 3,
            "club": {...},
            "member": {...},
            "type": {...},
            "roles": [...],
            "levels": [...],
            "tags": [...],
            "status": 1,
            "registration_start_date": "2026-01-01",
            "registration_end_date": "2026-12-31",
            "notes": "Admin notes here",
            "is_preferred_club": true,  // Cannot be changed by admin!
            ...
        }
    """
    try:
        # Get the membership
        membership = ClubMembership.objects.get(id=membership_id)
        
        # Permission already checked by IsAdminUser
        
        # Update the membership
        serializer = AdminClubMembershipUpdateSerializer(
            membership,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Returns ONLY that membership (no need for all)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except ClubMembership.DoesNotExist:
        return Response(
            {'error': 'Membership not found'},
            status=status.HTTP_404_NOT_FOUND
        )
# clubs/views.py

# ========================================
# IMPORTS 
# ========================================

# Django imports
from django.db.models import Q, Min, Exists, OuterRef
from django.utils import timezone
from django.contrib.auth import get_user_model

# Django REST Framework imports
from rest_framework import viewsets, status, filters  # ✅ filters for SearchFilter
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend  # ✅ For filtering

# Local app imports
from .models import Club, ClubMembership, Role, ClubMembershipType
from .serializers import (
    ClubDetailSerializer,
    ClubSerializer,
    ClubHomeSerializer, 
    ClubMembershipTypeSerializer,
    UserClubMembershipUpdateSerializer,
    UserClubMembershipSerializer,
    AdminClubMembershipSerializer,
)
from .permissions import IsClubAdmin, IsClubMember
from .filters import ClubMembershipFilter, AdminClubMembershipFilter, ClubFilter

# Other app imports
from leagues.models import League, SessionOccurrence
from notifications.models import Announcement
from public.constants import MembershipStatus, RoleType
from public.pagination import StandardPagination  # ✅ Import shared pagination!

User = get_user_model

class ClubViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Club CRUD operations + custom tab actions
    
    STANDARD REST ENDPOINTS (use get_serializer_class()):
    - GET    /api/clubs/              → list (uses ClubDetailSerializer) ✅ PAGINATED + SEARCHABLE!
    - POST   /api/clubs/              → create (uses ClubSerializer)
    - GET    /api/clubs/{id}/         → retrieve (uses ClubDetailSerializer)
    - PATCH  /api/clubs/{id}/         → update (uses ClubSerializer)
    - DELETE /api/clubs/{id}/         → destroy (uses ClubSerializer)
    
    FILTERING & SEARCH (for list endpoint):
    - search: Search by club name (e.g., ?search=jerome)
    - page: Page number (e.g., ?page=2)
    - page_size: Items per page (e.g., ?page_size=20)
    
    CUSTOM @action ENDPOINTS (instantiate serializers INSIDE methods):
    - GET    /api/clubs/{id}/home/          → ClubHomeSerializer
    - GET    /api/clubs/{id}/subscriptions/ → ClubMembershipTypeSerializer
    """
    queryset = Club.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # ✅ Add pagination for list endpoint (reuses StandardPagination)
    pagination_class = StandardPagination
    
    # ✅ Add filtering and search for list endpoint
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filter_class=ClubFilter
    search_fields = ['name', 'short_name', 'description']  # ✅ Search by name or short_name
    ordering_fields = ['name', 'short_name' 'created_at'] 
    ordering = ['name']
    
    def get_permissions(self):
        """
        - List/Retrieve: Public (or auth for details)
        - Create: Any authenticated user
        - Update/Delete: Only club admins
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsClubAdmin]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return serializers for STANDARD REST actions ONLY!
        
        IMPORTANT: @action methods instantiate their own serializers!
        This method is ONLY called for: list, retrieve, create, update, destroy
        
        NOT called for: home, events, members, subscriptions (those are @action)
        """

        '''
        For list (all records) and retrieve (individual record requiring {id})
        Method: GET -> use ClubDetailSerializer

        For all other methods: ClubSerializer
        create (POST)
        update (PUT)
        partial_update (PATCH)
        destroy (DELETE)
        '''
        if self.action in ['list', 'retrieve']:
            return ClubDetailSerializer
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

        # other ClubMembership fields??
        '''
        Required fields:
        - type -> ClubMembershipType model ?
        - membership_number (unique=True) -> Club.short_name - ClubMembership.id
        '''

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
    # -> replaced by endpoint 'leagues' (LeaguesViewSet)

    # ========================================
    # MEMBERS TAB
    # ========================================
    # -> replaced by endpoint 'memberships' (ClubMembershipViewSet)
    
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
   
class ClubMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A READ-ONLY ViewSet for Club Member ClubMembership resources.
    
    TWO USE CASES:
    
    1. Dashboard Members (?club=X):
       - Returns ALL members of club X
       - Frontend ensures user is member of club X (via dashboard access)
       - No backend re-validation needed
    
    2. Messaging Recipients (no filter):
       - Returns members from user's clubs
       - Future: + Users with allow_public_profile=True
    
    Endpoints:
    - GET /api/memberships/?club=5 → Dashboard members for club 5
    - GET /api/memberships/ → All potential message recipients
    - GET /api/memberships/{id}/ → Single member details
    
    Permission: IsClubMember (user must be active member of at least one club)
    
    Data Exposure:
    ✅ Shows: Basic member info, roles, skill levels, status
    ❌ Hides: Admin-only fields (notes, tags, dates), other members' is_preferred_club
    """
    queryset = ClubMembership.objects.all()
    serializer_class = UserClubMembershipSerializer
    permission_classes = [IsClubMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['member__last_name', 'member__first_name', 'created_at'] 
    ordering = ['member__last_name']
    search_fields = [
        'member__first_name',
        'member__last_name',
        'member__email',
        'club__name'
    ]
    filterset_class = ClubMembershipFilter
    pagination_class = StandardPagination

    def get_queryset(self):
        """
        Two behaviors based on query params:
        
        1. If ?club=X provided (Dashboard Members):
           - Return ALL memberships (DjangoFilterBackend will apply ?club filter)
           - Trust frontend validation (user has dashboard = is member)
        
        2. If no club filter (Messaging Recipients):
           - Return members from user's clubs
           - Future: + Users with allow_public_profile=True
        """
        # Check if club filter is provided
        club_id = self.request.query_params.get('club')
    
        if club_id:
            # ✅ USE CASE 1: Dashboard Members
            # Frontend already validated user is member of this club
            # Return ALL memberships - DjangoFilterBackend will apply ?club=X filter
            # (This also allows combining with other filters like ?status=1)
            return ClubMembership.objects.all().select_related(
                'club',
                'member',
                'type'
            ).prefetch_related(
                'roles',
                'levels'
            ).order_by('member__last_name', 'member__first_name')
        
        else:
            # ✅ USE CASE 2: Messaging Recipients
            # Return members from user's clubs
            user_club_ids = ClubMembership.objects.filter(
                member=self.request.user
            ).values_list('club_id', flat=True)
            
            # TODO (Future): Add Users with allow_public_profile=True
            # Will need:
            # 1. Get all ClubMemberships from user's clubs
            # 2. Get all Users with allow_public_profile=True
            # 3. Union/distinct to avoid duplicates
            # 4. Return combined queryset
            
            return ClubMembership.objects.filter(
                club_id__in=user_club_ids
            ).select_related(
                'club',
                'member',
                'type'
            ).prefetch_related(
                'roles',
                'levels'
            ).order_by('member__last_name', 'member__first_name')

class AdminClubMembershipViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for club admins to manage members.
    
    Endpoints:
    - GET /api/admin/memberships/ → list() - All members in admin's clubs
    - GET /api/admin/memberships/{id}/ → retrieve() - Single member details
    - POST /api/admin/memberships/ → create() - Add new member
    - PATCH /api/admin/memberships/{id}/ → partial_update() - Update member
    - DELETE /api/admin/memberships/{id}/ → destroy() - Remove member
    
    Permission: IsClubAdmin (has 'can_manage_members' permission)
    
    Data Exposure:
    ✅ Shows: ALL fields including admin-only (notes, tags, dates)
    ❌ Does NOT show: is_preferred_club (user-only field, not relevant for admins)
    
    Update Logic:
    ✅ Admin updating OWN membership → can change ALL fields
    ✅ Admin updating OTHER's membership → can change ALL fields EXCEPT is_preferred_club
    """
    queryset = ClubMembership.objects.all()
    serializer_class = AdminClubMembershipSerializer 
    permission_classes = [IsAuthenticated, IsClubAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]  # ✅ CRITICAL! Required for filterset_class to work!
    ordering_fields = ['member__last_name', 'member__first_name', 'status', 'created_at'] 
    ordering = ['member__last_name']
    search_fields = [
        'member__first_name',
        'member__last_name',
        'member__email',
        'club__name',
        'membership_number'
    ]
    filterset_class = AdminClubMembershipFilter
    pagination_class = StandardPagination

    def get_queryset(self):
        """
        Admin can only see/manage members of clubs they administer.
        
        IMPORTANT: Frontend sends ?club=5 filter!
        This method validates the user is admin of the requested club.
        ClubMembershipFilter then applies the actual ?club=5 filtering.
        
        Flow:
        1. Frontend sends: GET /api/admin/memberships/?club=5
        2. This method: Validates user is admin of club 5 (if club filter provided)
        3. ClubMembershipFilter: Applies ?club=5 to filter the queryset
        4. Result: Only members from club 5 (validated user is admin)
        
        If no club filter provided:
        - Return memberships ONLY from clubs user is admin of
        - Prevents data leakage from non-admin clubs
        """
        from rest_framework.exceptions import PermissionDenied

        # Check if frontend is filtering by specific club
        club_id = self.request.query_params.get('club')
        
        if club_id:
            # Frontend is requesting a specific club
            # Validate user is admin of THIS club
            is_admin_of_requested_club = ClubMembership.objects.filter(
                member=self.request.user,
                club_id=club_id,
                roles__can_manage_club=True
            ).exists() or ClubMembership.objects.filter(
                member=self.request.user,
                club_id=club_id,
                roles__can_manage_members=True
            ).exists()
            
            if not is_admin_of_requested_club:
                # User is NOT admin of requested club
                raise PermissionDenied(
                    "You do not have admin permissions for this club."
                )
            
            # User IS admin of requested club
            # Return ALL memberships (ClubMembershipFilter will apply ?club=X)
            return ClubMembership.objects.select_related(
                'club',
                'member',
                'type'
            ).prefetch_related(
                'roles',
                'levels',
                'tags'
            ).order_by('member__last_name', 'member__first_name')
        else:
            # No club filter provided
            # Return memberships ONLY from clubs user is admin of
            # (prevents data leakage from non-admin clubs)
            
            # Get all club IDs where user has admin permissions
            admin_club_ids = ClubMembership.objects.filter(
                member=self.request.user,
                roles__can_manage_club=True
            ).values_list('club_id', flat=True).distinct()
            
            # Also get clubs where user can manage members
            manage_members_club_ids = ClubMembership.objects.filter(
                member=self.request.user,
                roles__can_manage_members=True
            ).values_list('club_id', flat=True).distinct()
            
            # Combine both querysets
            all_admin_club_ids = set(admin_club_ids) | set(manage_members_club_ids)
            
            # Return memberships from those clubs with optimized queries
            return ClubMembership.objects.filter(
                club_id__in=all_admin_club_ids
            ).select_related(
                'club',
                'member',
                'type'
            ).prefetch_related(
                'roles',
                'levels',
                'tags'
            ).order_by('member__last_name', 'member__first_name')
        
    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/admin/memberships/{id}/
        
        Permission Logic:
        ┌─────────────────────┬──────────────────────┬───────────────────────────┐
        │ Admin Action        │ Updating OWN         │ Updating OTHER's          │
        ├─────────────────────┼──────────────────────┼───────────────────────────┤
        │ Can update          │ ALL fields           │ ALL EXCEPT is_preferred   │
        └─────────────────────┴──────────────────────┴───────────────────────────┘
        
        Rationale:
        - Admin can manage their own is_preferred_club via admin endpoint
        - Admin CANNOT change is_preferred_club for others (user privacy!)
        - Users change their own is_preferred via set_preferred_club_membership()
        """
        membership = self.get_object()
        
        # ========================================
        # CASE 1: Admin updating THEIR OWN membership
        # ========================================
        if membership.member == request.user:
            # Admin can update ALL fields on own membership
            # (including is_preferred_club, status, type, roles, notes, tags)
            return super().partial_update(request, *args, **kwargs)
        
        # ========================================
        # CASE 2: Admin updating OTHER member's membership
        # ========================================
        else:
            # Admin CANNOT change is_preferred_club for other members
            if 'is_preferred_club' in request.data:
                return Response({
                    "detail": "You cannot change is_preferred_club for other members. "
                              "Members must set their own preferred club."
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Admin CAN update all other fields
            return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/admin/memberships/{id}/
        
        Remove member from club (soft delete by setting status to INACTIVE).
        
        NOTE: This does NOT delete the ClubMembership record!
        It sets status to INACTIVE to preserve history.
        """
        membership = self.get_object()
        
        # Soft delete - set status to CANCELLED instead of hard delete
        membership.status = MembershipStatus.CANCELLED  # MembershipStatus.CANCELLED
        membership.save()
        
        return Response({
            "detail": f"Membership for {membership.member.get_full_name()} "
                     f"has been set to cancelled."
        }, status=status.HTTP_200_OK)  
    
# ========================================
# FUNCTION-BASED VIEWS (membership updates - EXISTING!)
# ========================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsClubMember])
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


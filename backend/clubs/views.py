# pickleball/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.utils import timezone
from .models import Club, ClubMembership, Role
from .serializers import (
    NestedClubSerializer, 
    ClubSerializer,
    ClubDetailHomeSerializer,
    ClubMemberSerializer, 
    ClubMembershipSerializer, 
    UserClubMembershipUpdateSerializer, 
    AdminClubMembershipUpdateSerializer,
)
from leagues.models import League
from leagues.serializers import LeagueSerializer
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from .permissions import IsClubAdmin, ClubMembershipPermissions # Import the custom permission
from public.constants import RoleType, MembershipStatus

class ClubMembersPagination(PageNumberPagination):
    """Pagination for club members list"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ClubViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Club CRUD operations + custom tab actions
    
    STANDARD REST ENDPOINTS (use get_serializer_class()):
    - GET    /api/clubs/              → list (uses NestedClubSerializer)
    - POST   /api/clubs/              → create (uses ClubSerializer)
    - GET    /api/clubs/{id}/         → retrieve (uses NestedClubSerializer)
    - PATCH  /api/clubs/{id}/         → update (uses ClubSerializer)
    - DELETE /api/clubs/{id}/         → destroy (uses ClubSerializer)
    
    CUSTOM @action ENDPOINTS (instantiate serializers INSIDE methods):
    - GET    /api/clubs/{id}/home/          → ClubDetailHomeSerializer
    - GET    /api/clubs/{id}/events/        → LeagueSerializer
    - GET    /api/clubs/{id}/members/       → ClubMemberSerializer (paginated)
    - GET    /api/clubs/{id}/subscriptions/ → ClubMembershipTypeSerializer
    """
    queryset = Club.objects.all()
    # serializer_class = ClubSerializer
    permission_classes = [IsClubAdmin] # Use the custom permission

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
        ✅ THE VIEW FETCHES ALL THE DATA!
        Then passes it as a DICTIONARY to the serializer
        """
        from notifications.models import Notification
        from leagues.models import League
        from public.constants import NotificationType, MembershipStatus
        from django.utils import timezone
        
        club = self.get_object()
        
        # ========================================
        # FETCH ALL HOME TAB DATA
        # ========================================
        
        # Get latest announcement
        latest_announcement = Notification.objects.filter(
            club=club,
            notification_type=NotificationType.CLUB_ANNOUNCEMENT
        ).order_by('-created_at').first()
        
        # Get all announcements
        all_announcements = Notification.objects.filter(
            club=club,
            notification_type=NotificationType.CLUB_ANNOUNCEMENT
        ).order_by('-created_at')
        
        # Get next event
        next_event = League.objects.filter(
            club=club,
            is_event=True,
            start_date__gte=timezone.now()
        ).order_by('start_date').first()
        
        # Get top members
        top_members = ClubMembership.objects.filter(
            club=club,
            status=MembershipStatus.ACTIVE
        ).select_related('member').prefetch_related('roles', 'levels').order_by('-joined_at')[:10]
        
        # ========================================
        # PASS AS DICTIONARY TO SERIALIZER
        # ========================================
        
        # ✅ Create a dictionary with club + all the data
        data = {
            'club': club,  # ← Club model instance
            'latest_announcement': latest_announcement,  # ← Notification instance or None
            'all_announcements': all_announcements,  # ← QuerySet
            'top_members': top_members,  # ← QuerySet
            'next_event': next_event,  # ← League instance or None
        }
        
        # ✅ Pass the DICTIONARY to serializer (not just the club!)
        serializer = ClubDetailHomeSerializer(data)
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
        - status: 'upcoming' | 'past' | 'all' (default: 'upcoming')
        
        TypeScript Type: ClubEventsResponse
        """
        club = self.get_object()
        
        # Filter by type
        event_type = request.query_params.get('type', 'all')
        queryset = League.objects.filter(club=club)
        
        if event_type == 'league':
            queryset = queryset.filter(is_event=False)
        elif event_type == 'event':
            queryset = queryset.filter(is_event=True)
        
        # Filter by status
        status_filter = request.query_params.get('status', 'upcoming')
        if status_filter == 'upcoming':
            queryset = queryset.filter(start_date__gte=timezone.now())
        elif status_filter == 'past':
            queryset = queryset.filter(end_date__lt=timezone.now())
        
        queryset = queryset.order_by('-start_date')
        
        # Serialize
        serializer = LeagueSerializer(queryset, many=True)
        
        return Response({
            'events': serializer.data,
            'count': queryset.count()
        })
    
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
        
        # ✅ Filter by skill level
        level = request.query_params.get('level')
        if level:
            queryset = queryset.filter(levels__level=level)
        
        # Prefetch related data for efficiency
        queryset = queryset.select_related('member').prefetch_related('roles', 'levels')
        
        # ✅ Paginate
        paginator = ClubMembersPagination()
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
# clubs/permissions.py
from rest_framework import permissions
from .models import ClubMembership
from public.constants import MembershipStatus

class IsClubMember(permissions.BasePermission):
    """
    Permission to check if user is an ACTIVE member of at least one club.
    
    Usage:
    - View-level (list): Check if user is a member of ANY club
    - Object-level (detail): Check if user is a member of THIS specific club
    
    UPDATED: 2026-02-23 - Added has_permission for list views
    """
    
    def has_permission(self, request, view):
        """
        View-level permission: Check if user is a member of ANY club.
        
        This allows the user to access the list/create endpoints.
        Data filtering happens in get_queryset().
        """
        if not request.user.is_authenticated:
            return False
        
        # User must be a member of at least ONE club
        return ClubMembership.objects.filter(
            member=request.user,
            status=MembershipStatus.ACTIVE
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        """
        Object-level permission: Check if user is a member of THIS club.
        
        obj is the Club instance.
        """
        if not request.user.is_authenticated:
            return False
        
        # Check if user has an active membership to this club
        return ClubMembership.objects.filter(
            member=request.user,
            club=obj,
            status=MembershipStatus.ACTIVE
        ).exists()

class IsClubAdmin(permissions.BasePermission):
    """
    Custom permission to only allow club admins to edit/delete a club.
    Superusers are allowed to do anything.
    
    A user is considered a club admin if they have a ClubMembership with a role that has:
    - can_manage_club = True, OR
    - can_manage_members = True
    
    UPDATED: 2026-02-23
    """
    def has_object_permission(self, request, view, obj):
        '''
        NOTE: has_object_permission() is ONLY called for detail views but NOT list views
              For list views with filters, you MUST check permissions in get_queryset()!
        '''
        # A superuser should always have permission
        if request.user and request.user.is_superuser:
            return True

        # Read permissions are allowed to any user who is a member of the club
        if request.method in permissions.SAFE_METHODS:
            return obj.club_memberships.filter(member=request.user).exists()

        # Write permissions: User must have a role with can_manage_club OR can_manage_members
        return obj.club_memberships.filter(
            member=request.user,
            roles__can_manage_club=True
        ).exists() or obj.club_memberships.filter(
            member=request.user,
            roles__can_manage_members=True
        ).exists()

    def has_permission(self, request, view):
        # A superuser can access any view
        if request.user and request.user.is_superuser:
            return True
        
        # Allow read-only access for all authenticated users on the list view
        if view.action == 'list' and request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Explicitly grant permission to create a club for any authenticated user
        if view.action == 'create' and request.method == 'POST':
            return request.user and request.user.is_authenticated

        # For other actions (retrieve, update, destroy), has_object_permission will handle it
        return request.user and request.user.is_authenticated
        
class ClubMembershipPermissions(permissions.BasePermission):
    """
    Custom permissions for ClubMembershipViewSet (OLD - DEPRECATED).
    
    NOTE: This permission class is NO LONGER USED!
    We now use TWO separate ViewSets:
    - ClubMembershipViewSet (read-only, uses IsAuthenticated)
    - AdminClubMembershipViewSet (full CRUD, uses IsClubAdmin)
    
    Keeping this for reference only.
    
    DEPRECATED: 2026-02-23
    """
    def has_permission(self, request, view):
        # A superuser can do anything
        if request.user.is_superuser:
            return True

        # Unauthenticated users cannot do anything
        if not request.user.is_authenticated:
            return False

        # All authenticated users can list memberships
        # The queryset will be filtered in the viewset itself.
        if view.action in ['list', 'retrieve']:
            return True

        # For create, update, and delete, check if user is a club admin
        # This will be handled by has_object_permission
        return True

    def has_object_permission(self, request, view, obj):
        # A superuser can do anything
        if request.user.is_superuser:
            return True

        # Check if the user is a member of the club the object belongs to
        if request.user != obj.member and not obj.club.club_memberships.filter(member=request.user).exists():
             return False

        # Check if user has admin permissions (can_manage_club OR can_manage_members)
        is_admin = obj.club.club_memberships.filter(
            member=request.user,
            roles__can_manage_club=True
        ).exists() or obj.club.club_memberships.filter(
            member=request.user,
            roles__can_manage_members=True
        ).exists()

        if is_admin:
            return True

        # Regular members can only view and edit their own record
        if request.user == obj.member:
            return request.method in ['GET', 'PUT', 'PATCH']

        # Deny all other requests
        return False
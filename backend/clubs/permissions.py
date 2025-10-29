# pickleball/permissions.py
from rest_framework import permissions
from .models import ClubMembership

class IsClubAdmin(permissions.BasePermission):
    """
    Custom permission to only allow club admins to edit/delete a club.
    Superusers are allowed to do anything.
    """
    def has_object_permission(self, request, view, obj):
        # A superuser should always have permission
        if request.user and request.user.is_superuser:
            return True

        # Read permissions are allowed to any user who is a member of the club
        if request.method in permissions.SAFE_METHODS:
            return obj.members.filter(member=request.user).exists()

        # Write permissions are only allowed to the club admin
        return obj.club_admins.filter(member=request.user).exists()

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

        # The rest of the checks are handled by has_object_permission
        return False
        
class ClubMembershipPermissions(permissions.BasePermission):
    """
    Custom permissions for ClubMembershipViewSet.
    - Club members can only view members of their own club.
    - Club admins can edit any member in their club.
    - Regular club members can only edit themselves.
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

        # For create, update, and delete, the user must be a club member.
        # This check is a preliminary step; has_object_permission will handle specifics.
        return True

    def has_object_permission(self, request, view, obj):
        # A superuser can do anything
        if request.user.is_superuser:
            return True

        # Check if the user is a member of the club the object belongs to
        if request.user != obj.member and not obj.club.members.filter(id=request.user.id).exists():
             return False

        # Admins can edit/delete any member record in their club
        is_admin = obj.club.club_memberships.filter(
            member=request.user,
            roles__name='Admin'
        ).exists()

        if is_admin:
            return True

        # Regular members can only view and edit their own record
        if request.user == obj.member:
            return request.method in ['GET', 'PUT', 'PATCH']

        # Deny all other requests
        return False
# leagues/permissions.py
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, NotAuthenticated
from clubs.models import ClubMembership
from public.constants import MembershipStatus, RoleType

class IsLeagueAdmin(permissions.BasePermission):
    """
    Permission class for Admin Events Module access.
    
    WHO CAN ACCESS:
    - Django superusers (is_superuser=True)
    - Users with ADMIN role in club
    - Users with ORGANIZER role in club
    - Users with CAPTAIN role in club
    
    IMPORTANT:
    - A user CANNOT be League.captain without having one of these roles!
    - The League.captain field just points to WHO captains that specific league
    - But that user will ALWAYS have ADMIN, ORGANIZER, or CAPTAIN role
    
    INSIDE THE MODULE:
    - Specific actions check can_* flags (can_manage_leagues, etc.)
    - Example: Only captains of THIS event can do certain actions
    - Example: Only organizers with can_manage_leagues can do other actions
    
    ERROR MESSAGES:
    - 401: "Authentication required." → Not logged in
    - 403: "You must have Admin, Organizer, or Captain role..." → Wrong role
    - 403: "You are not a member of this club." → Not member of event's club
    
    CREATED: 2026-02-17
    """
    
    def has_permission(self, request, view):
        """
        Check if user has ADMIN, ORGANIZER, or CAPTAIN role in ANY club.
        """
        # Check 1: Must be authenticated
        if not request.user.is_authenticated:
            raise NotAuthenticated(detail='Authentication required.')
        
        # Superusers can do anything
        if request.user.is_superuser:
            return True
        # Check 2: Get club_id from URL
        club_id = view.kwargs.get('club_id')
        
        if not club_id:
            raise PermissionDenied(detail='Club ID required.')
        

        # Check 3: User has admin role in THIS club
        has_admin_role = ClubMembership.objects.filter(
            member=request.user,
            club_id=club_id,  # ← THIS club only!
            status=MembershipStatus.ACTIVE,
            roles__name__in=[RoleType.ADMIN, RoleType.ORGANIZER, RoleType.CAPTAIN]
        ).exists()
        
        if not has_admin_role:
            raise PermissionDenied(
                detail='You must have Admin, Organizer, or Captain role in this club.'
            )
        
        return True
    
        """
        Check if user has ADMIN, ORGANIZER, or CAPTAIN role in THIS event's club.
        obj is a League instance.
        """
        # Superusers can do anything
        if request.user.is_superuser:
            return True
        
        # Check if user is a member of THIS club
        try:
            membership = ClubMembership.objects.get(
                member=request.user,
                club=obj.club,
                status=MembershipStatus.ACTIVE
            )
        except ClubMembership.DoesNotExist:
            raise PermissionDenied(
                detail=f'You are not a member of {obj.club.name}.'
            )
        
        # Check if they have one of the required roles
        has_admin_role = membership.roles.filter(
            name__in=[RoleType.ADMIN, RoleType.ORGANIZER, RoleType.CAPTAIN]
        ).exists()
        
        if not has_admin_role:
            raise PermissionDenied(
                detail=f'You must have Admin, Organizer, or Captain role in {obj.club.name} to access this event.'
            )
        
        return True
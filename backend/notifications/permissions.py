from rest_framework import permissions


class IsNotificationRecipient(permissions.BasePermission):
    """
    Custom permission to ensure users can only access their own notifications.
    
    SAFE METHODS (GET, HEAD, OPTIONS):
    - User must be the notification recipient
    
    UNSAFE METHODS (POST, PUT, PATCH, DELETE):
    - User must be the notification recipient
    
    USE CASES:
    - GET /api/notifications/123/     → Only if user is recipient
    - PATCH /api/notifications/123/   → Only if user is recipient
    - DELETE /api/notifications/123/  → Only if user is recipient
    """
    
    message = "You do not have permission to access this notification."
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is the notification recipient.
        
        obj = Notification instance
        """
        # User must be the recipient
        return obj.recipient == request.user


class IsAnnouncementClubMember(permissions.BasePermission):
    """
    Custom permission to ensure users can only access announcements from their clubs.
    
    SAFE METHODS (GET, HEAD, OPTIONS):
    - User must be an ACTIVE member of the announcement's club
    
    UNSAFE METHODS (POST, PUT, PATCH, DELETE):
    - User must be a club ADMIN or CAPTAIN (for creating/editing announcements)
    
    USE CASES:
    - GET /api/announcements/123/     → User is active club member
    - POST /api/announcements/        → User is club admin/captain
    - PATCH /api/announcements/123/   → User is club admin/captain
    - DELETE /api/announcements/123/  → User is club admin/captain
    """
    
    message = "You do not have permission to access this announcement."
    
    def has_object_permission(self, request, view, obj):
        """
        Check announcement access permissions.
        
        obj = Announcement instance
        """
        from clubs.models import ClubMembership
        from public.constants import MembershipStatus, RoleType
        
        user = request.user
        announcement_club = obj.club
        
        # Get user's membership in this club
        try:
            membership = ClubMembership.objects.get(
                member=user,
                club=announcement_club
            )
        except ClubMembership.DoesNotExist:
            return False  # Not a member of this club!
        
        # For SAFE methods (GET, HEAD, OPTIONS) - just need to be active member
        if request.method in permissions.SAFE_METHODS:
            return membership.status == MembershipStatus.ACTIVE
        
        # For UNSAFE methods (POST, PUT, PATCH, DELETE) - need to be admin/captain
        # Check if user is club admin or captain
        return membership.role in [RoleType.ADMIN, RoleType.CAPTAIN]


class CanCreateAnnouncement(permissions.BasePermission):
    """
    Permission for creating announcements.
    
    User must be:
    - Club admin OR captain
    - For the club specified in the request data
    
    USE CASE:
    - POST /api/announcements/ with { "club": 5, ... }
    """
    
    message = "You must be a club admin or captain to create announcements."
    
    def has_permission(self, request, view):
        """
        Check if user can create announcements.
        
        This runs BEFORE object creation (no obj yet!)
        """
        from clubs.models import ClubMembership
        from public.constants import MembershipStatus, RoleType
        
        # Only check for POST (creation)
        if request.method != 'POST':
            return True
        
        # Get club_id from request data
        club_id = request.data.get('club')
        if not club_id:
            return False  # Must specify a club!
        
        user = request.user
        
        # Check if user is admin/captain of this club
        try:
            membership = ClubMembership.objects.get(
                member=user,
                club_id=club_id,
                status=MembershipStatus.ACTIVE
            )
            return membership.role in [RoleType.ADMIN, RoleType.CAPTAIN]
        except ClubMembership.DoesNotExist:
            return False
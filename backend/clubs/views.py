# pickleball/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Club, ClubMembership, Role
from .serializers import ClubSerializer, ClubMembershipSerializer, UserClubMembershipUpdateSerializer, AdminClubMembershipUpdateSerializer
from .permissions import IsClubAdmin, ClubMembershipPermissions # Import the custom permission
from public.constants import RoleType

class ClubViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing Club resources.
    - Superusers can do anything.
    - Authenticated users can create and view clubs.
    - Only club admins can edit or delete a club.
    """
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [IsClubAdmin] # Use the custom permission

    def perform_create(self, serializer):
        """
        Overrides the create method to automatically set the creator
        as an admin member of the new club.
        """
        # Save the club instance
        club = serializer.save(created_by=self.request.user)

        # Get or create the 'Admin' role - needs to be updated to use the constants! 
        admin_role, created = Role.objects.get_or_create(name=RoleType.ADMIN)

        # Create the ClubMembership for the user who created the club
        club_membership = ClubMembership.objects.create(
            member=self.request.user,
            club=club
        )
        
        # Add the 'Admin' role to the new membership
        club_membership.roles.add(admin_role)

    def get_queryset(self):
        """
        Provides a viewable queryset for the list and retrieve actions.
        Superusers can see all clubs. All other users can see all clubs.
        """
        return self.queryset
    
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
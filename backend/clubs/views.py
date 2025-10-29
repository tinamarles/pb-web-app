# pickleball/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Club, ClubMembership, Role
from .serializers import ClubSerializer, ClubMembershipSerializer
from .permissions import IsClubAdmin, ClubMembershipPermissions # Import the custom permission

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
        club = serializer.save()

        # Get or create the 'Admin' role
        admin_role, created = Role.objects.get_or_create(name='Admin')

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
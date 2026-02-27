"""
Signal handlers for the clubs app.

Auto-creates default roles when a new club is created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Club, Role
from public.constants import RoleType, ClubType


@receiver(post_save, sender=Club)
def create_default_roles(sender, instance, created, **kwargs):
    """
    Auto-create 5 default roles when a new club is created.
    
    Default permissions differ based on club type:
    - Personal clubs: Collaborative (members can manage events)
    - Official clubs: Strict (only admins/organizers can manage events)
    """
    if not created:
        return  # Only for new clubs
    
    club = instance
    is_personal = club.club_type == ClubType.PERSONAL
    
    # Create ADMIN role (same for all clubs - god mode!)
    Role.objects.create(
        club=club,
        name=RoleType.ADMIN,
        description='Full club administration',
        can_manage_club=True,
        can_manage_members=True,
        can_create_training=True,
        can_manage_leagues=True,
        can_manage_league_sessions=True,
        can_cancel_league_sessions=True,
        can_manage_courts=True,
    )
    
    # Create ORGANIZER role
    Role.objects.create(
        club=club,
        name=RoleType.ORGANIZER,
        description='Event and league organizer',
        can_manage_club=False,
        can_manage_members=True if is_personal else False,
        can_create_training=True,
        can_manage_leagues=True,
        can_manage_league_sessions=True,
        can_cancel_league_sessions=True,
        can_manage_courts=True,
    )
    
    # Create CAPTAIN role
    Role.objects.create(
        club=club,
        name=RoleType.CAPTAIN,
        description='League captain',
        can_manage_club=False,
        can_manage_members=False,
        can_create_training=False,
        can_manage_leagues=True,
        can_manage_league_sessions=False,
        can_cancel_league_sessions=True,
        can_manage_courts=False,
    )
    
    # Create INSTRUCTOR role
    Role.objects.create(
        club=club,
        name=RoleType.INSTRUCTOR,
        description='Training instructor',
        can_manage_club=False,
        can_manage_members=False,
        can_create_training=True,
        can_manage_leagues=False,
        can_manage_league_sessions=False,
        can_cancel_league_sessions=False,
        can_manage_courts=False,
    )
    
    # Create MEMBER role
    Role.objects.create(
        club=club,
        name=RoleType.MEMBER,
        description='Club member',
        can_manage_club=False,
        can_manage_members=False,
        can_create_training=False,
        can_manage_leagues=False,
        can_manage_league_sessions=False,
        can_cancel_league_sessions=False,
        can_manage_courts=False,
    )
    
    print(f"✅ Created 5 default roles for {club.name}")
# leagues/models.py

from django.db import models
# from members.models import Member
from clubs.models import Club, ClubMembership, Role, ClubMembershipSkillLevel
from datetime import date
from public.models import Address
from django.contrib.auth import get_user_model

User = get_user_model()

def get_default_start_date():
    return date(date.today().year, 1, 1)

def get_default_end_date():
    return date(date.today().year, 12, 31)

# League model
class League(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    level = models.ManyToManyField(ClubMembershipSkillLevel, related_name='leagues_with_level')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='leagues')
    # Link the many-to-many through ClubMembership
    participants = models.ManyToManyField(
        User,
        through='LeagueParticipation',
        related_name='leagues_as_participant'
    )
    start_date = models.DateField(default=get_default_start_date)
    end_date = models.DateField(default=get_default_end_date)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.club.name})"

# Through-table for Member and League (LeagueParticipation)
class LeagueParticipation(models.Model):
    # Foreign key to Member is required by the ManyToManyField
    member = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='league_participations' # We need a unique related_name here to prevent a conflict with ClubMembership
    )
    
    # Foreign key to ClubMembership to enforce the business logic
    club_membership = models.ForeignKey(
        ClubMembership, 
        on_delete=models.CASCADE, 
        related_name='league_participations_as_club_member' # Renamed for clarity and uniqueness
    )
    
    league = models.ForeignKey(
        League, 
        on_delete=models.CASCADE, 
        related_name='league_participations'
    )
    roles = models.ManyToManyField(Role, related_name='league_participations_with_role')
    participant_number = models.IntegerField(unique=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # A single club member can only participate in a league once.
        unique_together = ('club_membership', 'league')

    def __str__(self):
        return f"{self.club_membership.user.username} - {self.league.name}"
    
# CourtLocation contains all the static information for a court location, including
# the maximum number of courts available

class CourtLocation(models.Model):
    name = models.CharField(max_length=200)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='court_location')
    max_courts = models.IntegerField(default=1)

    def __str__(self):
        return self.name

# The CourtLocationSchedule handles the court availability schedule. Using a ForeignKey
# to CourtLocation allows to specify blocked times for each court location

class CourtLocationSchedule(models.Model):

    court_location = models.ForeignKey(CourtLocation, on_delete=models.CASCADE, related_name="schedule")
    day_of_week = models.IntegerField(
        choices=[
            (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
            (4, "Friday"), (5, "Saturday"), (6, "Sunday")
        ]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    description = models.CharField(
        max_length=200,
        help_text="e.g., 'Courts blocked for Tennis club'."
    )

    def __str__(self):
        return f"{self.location.name} - {self.get_day_of_week_display()}"

# The LeagueSession represents the recurring session for a league. It links
# to the League and CourtLocation models and defines the recurrence pattern
# using a combination of a choice field and an integer field

class LeagueSession(models.Model):
    RECURRENCE_CHOICES = [
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Every other week'),
        ('monthly', 'Once a month'),
    ]

    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="sessions")
    court_location = models.ForeignKey(CourtLocation, on_delete=models.CASCADE, related_name="sessions")
    courts_used = models.IntegerField(
        help_text="The number of courts used for this session."
    )
    day_of_week = models.IntegerField(
        choices=[
            (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
            (4, "Friday"), (5, "Saturday"), (6, "Sunday")
        ]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    recurrence_type = models.CharField(max_length=20, choices=RECURRENCE_CHOICES)
    recurrence_interval = models.IntegerField(
        default=1,
        help_text="e.g., 2 for 'Every other week' or 1 for 'Once a month' on the first week."
    )

    def __str__(self):
        return f"Session for {self.league.name} on {self.get_day_of_week_display()}"    
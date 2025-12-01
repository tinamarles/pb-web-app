# leagues/models.py

from django.db import models
from django.core.exceptions import ValidationError
from clubs.models import Club, ClubMembership, ClubMembershipSkillLevel
from courts.models import CourtLocation
from datetime import date, timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

def get_default_start_date():
    """Default to next Monday."""
    today = date.today()
    days_ahead = 0 - today.weekday()  # Monday = 0
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)

def get_default_end_date():
    """Default to 12 weeks from start."""
    return get_default_start_date() + timedelta(weeks=12)

# League model
class League(models.Model):

    """
    Pickleball league.
    
    Examples:
    - "Rising Stars" - Standard league, 3.5+ skill, Mon/Wed 8-10am
      (Captain chooses format when generating matches: Round-Robin OR King-of-Court OR Manual)
    - "MLP Champions" - MLP league, open skill, Fri 12-2pm
      (Fixed 4+ player teams, MLP match format)
    - "Doubles Buddies" - Team league, 3.0+ skill, Tue/Thu 6-8pm
      (Fixed 2-player teams for entire season)
    """
    
    LEAGUE_TYPE_CHOICES = [
        ('standard', 'Standard (Rotating Partners)'),
        ('team', 'Team-Based (Fixed 2-Player Teams)'),
        ('mlp', 'MLP (Fixed 4+ Player Teams)'),
    ]
    
    MATCH_FORMAT_CHOICES = [
        ('round_robin', 'Round-Robin'),
        ('king_of_court', 'King of the Court'),
        ('manual', 'Manual Entry'),
    ]
    # Basic info
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='leagues')
    # League type (defines team structure, NOT match generation format!)
    league_type = models.CharField(
        max_length=20,
        choices=LEAGUE_TYPE_CHOICES,
        default='standard',
        help_text='Standard=rotating partners, Team=fixed pairs, MLP=fixed 4+ teams'
    )
    # Default match format (for Standard leagues only - convenience feature!)
    # This is used to pre-select the format when captain generates matches
    # Captain can override this choice for any specific session occurrence
    default_match_format = models.CharField(
        max_length=20,
        choices=MATCH_FORMAT_CHOICES,
        default='round_robin',
        blank=True,
        null=True,
        help_text='Default format for match generation. Only applies to Standard leagues. Captain can override per session.'
    )
    # Skill requirement (UPDATED from original 'level' field!)
    minimum_skill_level = models.ForeignKey(
        ClubMembershipSkillLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leagues_with_min_skill',
        help_text='Minimum skill level required (e.g., 3.5+ means 3.5, 4.0, 4.5, 5.0 allowed)'
    )
    # Captain (creator/manager)
    captain = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='leagues_as_captain',
        help_text='League captain who manages this league'
    )

    # Link the many-to-many through ClubMembership
    participants = models.ManyToManyField(
        User,
        through='LeagueParticipation',
        related_name='leagues_as_participant'
    )
    # Season dates
    start_date = models.DateField(default=get_default_start_date)
    end_date = models.DateField(default=get_default_end_date)

    # Registration
    registration_open = models.BooleanField(default=True)
    max_participants = models.IntegerField(
        blank=True,
        null=True,
        help_text='Maximum number of ACTIVE participants (leave blank for unlimited). ❗️ Additional joiners become RESERVE.'
    )
    allow_reserves = models.BooleanField(
        default=True,
        help_text='❗️ If True, users can join as reserves when league is full'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'name']

    def __str__(self):
        return f"{self.name} ({self.club.name})"
    
    def can_user_join(self, user, club_membership):
        """
        Check if user meets skill requirements to join.
        ❗️ Updated to handle reserve system when league is full.
        
        Args:
            user: User attempting to join
            club_membership: User's ClubMembership at this club
        
        Returns:
            tuple: (can_join: bool, join_as: str, reason: str)
            where join_as is 'active' or 'reserve'
        """
        # Check if league is open for registration
        if not self.registration_open:
            return (False, None, "Registration is closed")
        
        # Check if already joined
        existing = LeagueParticipation.objects.filter(
            league=self,
            member=user,
            status__in=['active', 'reserve']
        ).exists()
        if existing:
            return (False, None, "You are already in this league")
        
        # Check skill level requirement
        if not self.minimum_skill_level:
            skill_met = True
        else:
            # Get user's skill levels
            user_skill_levels = club_membership.levels.all()
            # NOTE: currently for the club St.Jerome there are only 3 levels:
            # 'open' - meaning the player can be of any level, they have not been formally assessed
            # '3.5+' - the player has been assessed and achieved a rating of 3.5+ but is not a 4.0+ yet
            # '4.0+' - the player has been assessed and achieved a level of 4.0 or higher
            
            # ❗️ FIXED: Define skill hierarchy (open = 0, means anyone!)
            skill_hierarchy = {
                'open': 0,      # ❗️ FIXED: 'open' = no restriction, anyone can join
                'beginner': 1,
                '2.0': 2,
                '2.5': 3,
                '3.0': 4,
                '3.5': 5,
                '4.0': 6,
                '4.5': 7,
                '5.0': 8,
            }
            
            min_value = skill_hierarchy.get(self.minimum_skill_level.level, 0)
            
            # Check if any of user's skills meet requirement
            skill_met = False
            for level in user_skill_levels:
                user_value = skill_hierarchy.get(level.level, 0)
                if user_value >= min_value:
                    skill_met = True
                    break
        
        if not skill_met:
            return (
                False,
                None,
                f"Requires skill level {self.minimum_skill_level.level} or higher"
            )
        
        # ❗️ Check max participants (active only, not reserves)
        if self.max_participants:
            current_count = self.participants.filter(
                leagueparticipation__status='active'
            ).count()
            
            if current_count >= self.max_participants:
                # League is full - can join as reserve?
                if self.allow_reserves:
                    return (
                        True,
                        'reserve',
                        f"League is full ({current_count}/{self.max_participants}). You will join as RESERVE."
                    )
                else:
                    return (False, None, "League is full and not accepting reserves")
        
        # Can join as active player
        return (True, 'active', "Welcome to the league!")
    
    def get_current_participants_count(self):
        """Get count of active participants."""
        return self.participants.filter(
            leagueparticipation__status='active'
        ).count()
    
    def is_full(self):
        """Check if league is at max capacity."""
        if not self.max_participants:
            return False
        return self.get_current_participants_count() >= self.max_participants
    
    def get_skill_requirement_display_text(self):
        """Get user-friendly skill requirement text."""
        if not self.minimum_skill_level:
            return "Open to all skill levels"
        
        level = self.minimum_skill_level.level
        if level == 'open':
            return "Open skill level"
        else:
            return f"Minimum skill: {level}+"
        
# Through-table for Member and League (LeagueParticipation)
class LeagueParticipation(models.Model):
    """
    User's participation in a league.
    
    Tracks:
    - When they joined
    - Current status
    - Statistics
    """
    
    STATUS_CHOICES = [
        ('active', 'Active'),                         # Currently playing in league
        ('reserve', 'Reserve - Waiting for spot'),    # ❗️ Waiting for spot when league full
        ('injured', 'Injured - Temporarily out'),     # ❗️ Temporarily unavailable (injury)
        ('holiday', 'On Holiday - Temporarily out'),  # ❗️ Temporarily unavailable (vacation)
        ('dropped', 'Dropped Out'),                   # Permanently left league
    ]
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

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # Dates
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)
    
    # Captain notes (❗️ Added for captain's private notes about player)
    captain_notes = models.TextField(
        blank=True,
        null=True,
        help_text='Private notes from captain (e.g., "Struggles with serve", "Strong backhand")'
    )
    
    # Exclude from rankings (❗️ Added for captains who play but don't want unfair advantage)
    exclude_from_rankings = models.BooleanField(
        default=False,
        help_text='Exclude this player from league statistics and rankings (e.g., captain who coaches/substitutes)'
    )

    # NOTE: For MLP leagues, team assignment is tracked in the MATCHES module
    # via MLPTeam and MLPTeamRosterVersion models (see KEY_MODULE_MATCHES-Concept.md)
    # LeagueParticipation simply tracks that a player is participating in the league
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
    # A single club member can only participate in a league once.
        unique_together = ('club_membership', 'league')
        ordering = ['league', 'member']
        # NOTE: Constraint removed - validation handled by clean() method instead
        # (Django constraints don't support joined field lookups like 'club_membership__member')
        
    def clean(self):
        """Validate that member matches club_membership.member"""
        if self.club_membership and self.member:
            if self.member != self.club_membership.member:
                raise ValidationError({
                    'member': 'Member must match the user in club_membership'
                })
        
        # Also validate that league's club matches club_membership's club
        if self.league and self.club_membership:
            if self.league.club != self.club_membership.club:
                raise ValidationError({
                    'club_membership': 'Club membership must be from the same club as the league'
                })

    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} in {self.league.name}"
    
# The LeagueSession represents the recurring session for a league. It links
# to the League and CourtLocation models and defines the recurrence pattern
# using a combination of a choice field and an integer field

class LeagueSession(models.Model):
    """
    Recurring session schedule for a league.
    
    Examples:
    - Monday 8-10am at Parc Optimiste, 4 courts
    - Wednesday 12-2pm at Parc La Source, 3 courts
    - Friday 6-8pm at Tennis 13, 2 courts
    """
    RECURRENCE_CHOICES = [
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Every other week'),
        ('monthly', 'Once a month'),
    ]

    league = models.ForeignKey(
        League, 
        on_delete=models.CASCADE, 
        related_name="sessions")
    
    court_location = models.ForeignKey(
        CourtLocation, 
        on_delete=models.CASCADE, 
        related_name="league_sessions")
    
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

    # Active period (for seasonal schedules)
    active_from = models.DateField(
        blank=True,
        null=True,
        help_text='When session schedule starts (default: league start_date)'
    )
    active_until = models.DateField(
        blank=True,
        null=True,
        help_text='When session schedule ends (default: league end_date)'
    )
    
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='league_sessions_created',
        help_text='League organizer who created this session'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['league', 'day_of_week', 'start_time']
    
    def __str__(self):
        return (
            f"Session for {self.league.name} on {self.get_day_of_week_display()}"    
            f"{self.start_time}-{self.end_time} at {self.court_location.name}"
        )
    
    def get_next_occurrence(self, from_date=None):
        """Get next occurrence of this session."""
        
        if not from_date:
            from_date = date.today()
        
        # Find next day that matches day_of_week
        current = from_date
        while current.weekday() != self.day_of_week:
            current += timedelta(days=1)
        
        # Check if within active period
        if self.active_from and current < self.active_from:
            current = self.active_from
            while current.weekday() != self.day_of_week:
                current += timedelta(days=1)
        
        if self.active_until and current > self.active_until:
            return None
        
        return current
    
    def get_schedule_display(self):
        """User-friendly schedule display."""
        return {
            'league': self.league.name,
            'day': self.get_day_of_week_display(),
            'time': f"{self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}",
            'location': self.court_location.name,
            'courts': self.courts_used,
            'recurrence': self.get_recurrence_type_display()
        }
    
class LeagueAttendance(models.Model):
    """
    Attendance tracking for league sessions.
    
    IMPORTANT DESIGN:
    - Default status: 'attending'
    - Users confirm or cancel
    - If cancelled → triggers match regeneration
    """
    
    STATUS_CHOICES = [
        ('attending', 'Attending'),
        ('cancelled', 'Cancelled'),
        ('absent', 'Absent (no-show)'),
    ]
    
    league_participation = models.ForeignKey(
        LeagueParticipation,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # Which session date
    session_date = models.DateField(
        help_text='Specific date of this session'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='attending'  # ← Default to attending!
    )
    
    # Cancellation details
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancellation_reason = models.TextField(
        blank=True,
        null=True,
        help_text='Optional reason for cancellation'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('league_participation', 'session_date')
        ordering = ['session_date', 'league_participation']
    
    def __str__(self):
        return (
            f"{self.league_participation.member.get_full_name()} - "
            f"{self.session_date} ({self.get_status_display()})"
        )
    
    def cancel(self, reason=None):
        """
        Cancel attendance.
        
        Triggers:
        - Status change to 'cancelled'
        - Match regeneration if needed
        """
        from datetime import datetime
        
        self.status = 'cancelled'
        self.cancelled_at = datetime.now()
        if reason:
            self.cancellation_reason = reason
        self.save()
        
        # Trigger match regeneration
        self._trigger_match_regeneration()
    
    def _trigger_match_regeneration(self):
        """Regenerate matches if player count changed."""
        from matches.models import Match
        from .services.round_robin import RoundRobinGenerator
        # Get all attending players for this session date
        attending = LeagueAttendance.objects.filter(
            league_participation__league=self.league_participation.league,
            session_date=self.session_date,
            status='attending'
        )
        
        # Delete existing pending matches
        Match.objects.filter(
            league=self.league_participation.league,
            match_date=self.session_date,
            match_status='pending'
        ).delete()
        
        # Generate new matches
        # (See Round-Robin Generation section below)
       
        
        session = self.league_participation.league.sessions.first()  # Get session
        if session:
            generator = RoundRobinGenerator(
                session,
                self.session_date,
                [att.league_participation.member for att in attending]
            )
            generator.generate_matches()

# Signal to auto-create attendance records
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=LeagueSession)
def create_attendance_records(sender, instance, created, **kwargs):
    """
    When a session is created, auto-create attendance records
    for all league participants with status='attending'.
    """
    if created:
        # Get next occurrence
        next_date = instance.get_next_occurrence()
        if not next_date:
            return
        
        # Get all active participants
        participants = LeagueParticipation.objects.filter(
            league=instance.league,
            status='active'
        )
        
        # Create attendance records
        for participation in participants:
            LeagueAttendance.objects.get_or_create(
                league_participation=participation,
                session_date=next_date,
                defaults={'status': 'attending'}
            )
class RoundRobinPattern(models.Model):
    """
    Predefined round-robin rotation patterns.
    
    Stores patterns like:
    - 5 courts, 22 players
    - 4 courts, 18 players
    - 3 courts, 14 players
    
    Based on real paper sheets!
    """
    
    # Pattern identification
    num_courts = models.IntegerField(
        help_text='Number of courts for this pattern'
    )
    num_players = models.IntegerField(
        help_text='Number of players for this pattern'
    )
    
    # Pattern name
    name = models.CharField(
        max_length=100,
        help_text='e.g., "5 Courts - 22 Players Standard"'
    )
    
    # Pattern data (JSON)
    pattern_data = models.JSONField(
        help_text='JSON structure of rotation pattern'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('num_courts', 'num_players')
        ordering = ['num_courts', 'num_players']
    
    def __str__(self):
        return f"{self.num_courts} courts, {self.num_players} players"

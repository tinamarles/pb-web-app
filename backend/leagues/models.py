# leagues/models.py

from django.db import models
from django.core.exceptions import ValidationError
from functools import cached_property
from clubs.models import Club, ClubMembership, ClubMembershipSkillLevel
from courts.models import CourtLocation
from public.constants import LeagueType, GenerationFormat, LeagueParticipationStatus, DayOfWeek, RecurrenceType, LeagueAttendanceStatus, MatchStatus
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
    
    # Basic info
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='leagues')
    # Differentiates events from leagues
    is_event = models.BooleanField(
        default=False,
        help_text='True = Event (per-session), False = League (season enrollment)'
    )
    # Event or League Banner Image to display on cards/details
    image_url = models.URLField(max_length=200, blank=True) 
    # Event-specific settings
    max_spots_per_session = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Max registrations per session (for events only)"
    )
    
    allow_waitlist = models.BooleanField(
        default=True,
        help_text="Allow users to join waitlist when session full"
    )

    # from nextJS/10-Future-Ideas/KEY_MODULE_LEAGUE/Events/Concept-Events.md
    registration_opens_hours_before = models.PositiveIntegerField(
        default=168,  # 1 week
        help_text="How many hours before session registration opens"
    )
    
    registration_closes_hours_before = models.PositiveIntegerField(
        default=2,  # 2 hours
        help_text="How many hours before session registration closes"
    )

    # League type (defines team structure, NOT match generation format!)
    league_type = models.IntegerField(
        choices=LeagueType,
        default=LeagueType.STANDARD,
        help_text='Standard=rotating partners, Team=fixed pairs, MLP=fixed 4+ teams'
    )
    # Default match format (for Standard leagues only - convenience feature!)
    # This is used to pre-select the format when captain generates matches
    # Captain can override this choice for any specific session occurrence
    default_generation_format = models.IntegerField(
        choices=GenerationFormat,
        default=GenerationFormat.ROUND_ROBIN,
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
            status__in=[
                LeagueParticipationStatus.ACTIVE,
                LeagueParticipationStatus.RESERVE
            ]
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
            
            # Check if any of user's skills meet requirement
            # Since ClubMembershipSkillLevel uses integer IDs (higher ID = higher skill),
            # we just compare IDs directly!
            skill_met = False
            for level in user_skill_levels:
                if level.id >= self.minimum_skill_level.id:
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
                leagueparticipation__status=LeagueParticipationStatus.ACTIVE
            ).count()
            
            if current_count >= self.max_participants:
                # League is full - can join as reserve?
                if self.allow_reserves:
                    return (
                        True,
                        LeagueParticipationStatus.RESERVE,
                        f"League is full ({current_count}/{self.max_participants}). You will join as RESERVE."
                    )
                else:
                    return (False, None, "League is full and not accepting reserves")
        
        # Can join as active player
        return (True, LeagueParticipationStatus.ACTIVE, "Welcome to the league!")
    
    def get_current_participants_count(self):
        """Get count of active participants."""
        return self.participants.filter(
            leagueparticipation__status=LeagueParticipationStatus.ACTIVE
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
        
        # Since we're using integer IDs (1='open', 2='3.5+', 3='4.0+'),
        # we display the actual level text
        return f"Minimum skill: {self.minimum_skill_level.level}"
        
# Through-table for Member and League (LeagueParticipation)
class LeagueParticipation(models.Model):
    """
    User's participation in a league.
    
    Tracks:
    - When they joined
    - Current status
    - Statistics
    """
    
    league = models.ForeignKey(
        League, 
        on_delete=models.CASCADE, 
        related_name='league_participants'
    )
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

    # Status
    status = models.IntegerField(
        choices=LeagueParticipationStatus,
        default=LeagueParticipationStatus.ACTIVE
    )
    
    # Dates
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)
    
    # Captain notes (❗️ Added for captain's private notes about player)
    captain_notes = models.TextField(
        blank=True,
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
        return f"{self.member.get_full_name()} in {self.league.name}"
    
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

    league = models.ForeignKey(
        League, 
        on_delete=models.CASCADE, 
        related_name="sessions")
    
    court_location = models.ForeignKey(
        CourtLocation, 
        on_delete=models.CASCADE, 
        related_name="league_sessions")
    
    courts_used = models.IntegerField(
        default=1,
        help_text="The number of courts used for this session."
    )
    day_of_week = models.IntegerField(
        choices=DayOfWeek
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    recurrence_type = models.IntegerField(
        choices=RecurrenceType,
        default=RecurrenceType.WEEKLY)
    
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
    
class SessionCancellation(models.Model):
    """
    Temporary cancellation of a recurring session.
    
    Use Cases:
    - Captain unavailable for specific time period
    - Holiday break (e.g., "No sessions Dec 20-31")
    - Venue unavailable temporarily
    
    Note: For permanent cancellation, set LeagueSession.is_active = False
    """
    
    session = models.ForeignKey(
        LeagueSession,
        on_delete=models.CASCADE,
        related_name='cancellations',
        help_text='Which recurring session to cancel'
    )
    
    # Cancellation period
    cancelled_from = models.DateField(
        help_text='First date of cancellation (inclusive)'
    )
    cancelled_until = models.DateField(
        help_text='Last date of cancellation (inclusive)'
    )
    
    # Optional details
    reason = models.CharField(
        max_length=500,
        blank=True,
        help_text='Why captain cancelled (personal, weather, venue closed, etc.)'
    )
    
    # Audit trail
    cancelled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='session_cancellations_made',
        help_text='Captain who created this cancellation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-cancelled_from']
        indexes = [
            models.Index(fields=['session', 'cancelled_from', 'cancelled_until']),
        ]
    
    def __str__(self):
        return (
            f"{self.session.league.name} - {self.session.get_day_of_week_display()} "
            f"cancelled {self.cancelled_from} to {self.cancelled_until}"
        )
    
    def clean(self):
        """Validate cancellation period."""
        if self.cancelled_until < self.cancelled_from:
            raise ValidationError('cancelled_until must be >= cancelled_from')
        
        # Check if overlaps with session's active period
        if self.session.active_from and self.cancelled_until < self.session.active_from:
            raise ValidationError('Cancellation ends before session starts')
        
        if self.session.active_until and self.cancelled_from > self.session.active_until:
            raise ValidationError('Cancellation starts after session ends')

class LeagueAttendance(models.Model):
    """
    Attendance tracking for league sessions.
    
    IMPORTANT DESIGN:
    - Default status: 'attending'
    - Users confirm or cancel
    - If cancelled → triggers match regeneration
    """
    
    league_participation = models.ForeignKey(
        LeagueParticipation,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # ⭐ NEW: Which recurring session (2025-12-04)
    # CRITICAL: Needed for leagues with multiple sessions on same day!
    # Example: Monday 9am session AND Monday 6pm session on 2024-12-09
    league_session = models.ForeignKey(
        LeagueSession,
        on_delete=models.CASCADE,
        related_name='session_attendances',
        help_text='Which recurring session schedule this attendance is for'
    )

    # Which session date
    session_date = models.DateField(
        help_text='Specific date of this session'
    )
    
    # Status
    status = models.IntegerField(
        choices=LeagueAttendanceStatus,
        default=LeagueAttendanceStatus.ATTENDING  # ← Default to attending!
    )
    
    # Cancellation details
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancellation_reason = models.TextField(
        blank=True,
        help_text='Optional reason for cancellation'
    )
    
    # ⭐ NEW: On-the-Fly Day-of Check-In (2025-12-04)
    # Purpose: Captain confirms ACTUAL attendance on the day
    # Use Case: People don't reliably confirm/cancel in advance
    #           Captain does check-in, marks who ACTUALLY showed up
    #           System can then re-generate matches with actual players
    checked_in = models.BooleanField(
        default=False,
        help_text='Did the player check in / show up on the day? (captain confirms)'
    )
    
    checked_in_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_in_attendances',
        help_text='Captain/co-captain who performed day-of check-in (useful for multi-captain leagues)'
    )
    
    # ⭐ NEW: Mid-Session Player Changes (2025-12-04)
    # Purpose: Handle players leaving early or arriving late during active session
    # Use Case: Player says "Gotta go - appointment!" after Round 3
    #           OR player shows up late before Round 4
    #           System regenerates future rounds with updated player count
    
    # BUSINESS LOGIC EXAMPLES:
    # 
    # Player Mike:
    #   status = 'attending' (confirmed on Sunday)
    #   checked_in = False (captain marked absent Monday 8am - no-show!)
    #   Result: Planned YES, Showed NO
    # 
    # Player Sarah:
    #   status = 'cancelled' (cancelled on Saturday)
    #   checked_in = True (captain marked present Monday 8am - surprise!)
    #   Result: Planned NO, Showed YES
    # 
    # Player John:
    #   status = 'attending' (confirmed on Sunday)
    #   checked_in = True (captain confirmed Monday 8am)
    #   Result: Planned YES, Showed YES ✅
    
    left_after_round = models.IntegerField(
        null=True,
        blank=True,
        help_text='Which round player left after (e.g., 3). NULL = did not leave early.'
    )
    
    arrived_before_round = models.IntegerField(
        null=True,
        blank=True,
        help_text='Which round player arrived before (e.g., 4). NULL = was not late.'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('league_participation', 'league_session', 'session_date')
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
        - Match regeneration ONLY if matches were round-robin generated
        """
        from datetime import datetime
        
        self.status = LeagueAttendanceStatus.CANCELLED
        self.cancelled_at = datetime.now()
        if reason:
            self.cancellation_reason = reason
        self.save()
        
        # Trigger match regeneration (only if round-robin format)
        self._trigger_match_regeneration()
    
    def _trigger_match_regeneration(self):
        """
        Regenerate matches ONLY if they were round-robin generated.
        
        Purpose: Auto-regenerate matches when players cancel/arrive/leave
        This is a CRITICAL feature for captains - removes manual rotation management!
        
        Safety: Only touches round-robin matches, never King-of-Court/Manual/MLP
        """
        from matches.models import Match
        from .services.round_robin import RoundRobinGenerator
        
        # Get existing matches for THIS specific session
        existing_matches = Match.objects.filter(
            league=self.league_participation.league,
            league_session=self.league_session,  # ← CRITICAL: specific session, not all sessions!
            match_date=self.session_date,
            match_status=MatchStatus.PENDING  # Only regenerate unplayed matches
        )
        
        # Check if matches exist and were round-robin generated
        if not existing_matches.exists():
            return  # No matches to regenerate
        
        # Check generation format (all matches for a session have same format)
        first_match = existing_matches.first()
        if first_match.generation_format != GenerationFormat.ROUND_ROBIN:
            # Don't touch King-of-Court, Manual, or MLP matches!
            return
        
        # ✅ Safe to regenerate - these are round-robin matches
        # Get currently attending players
        attending = LeagueAttendance.objects.filter(
            league_participation__league=self.league_participation.league,
            league_session=self.league_session,
            session_date=self.session_date,
            status=LeagueAttendanceStatus.ATTENDING  # ← Use constant, not string!
        )
        
        # Delete old round-robin matches
        existing_matches.delete()
        
        # Generate fresh matches with updated player list
        generator = RoundRobinGenerator(
            self.league_session,
            self.session_date,
            [att.league_participation.member for att in attending]
        )
        generator.generate_matches()

    def set_left_early(self, after_round: int):
        """
        Record that player left early after completing a specific round.
        
        Args:
            after_round: Last round the player completed before leaving
        """
        self.left_after_round = after_round
        self.save(update_fields=['left_after_round'])
    
    def set_arrived_late(self, from_round: int):
        """
        Record that player arrived late and will play from a specific round onwards.
        
        Args:
            from_round: First round the player will participate in
        
        Raises:
            ValidationError: If from_round is invalid
        """
        # Defensive check (should never happen in normal operation)
        if from_round <= self.left_after_round:
            raise ValidationError(
                f"Cannot arrive (round {from_round}) after already leaving (round {self.left_after_round})"
            )
        
        self.arrived_before_round = from_round
        self.checked_in = True
        self.save(update_fields=['arrived_before_round', 'checked_in'])
    
    def _regenerate_future_rounds(self, from_round: int):
        """
        Regenerate ONLY future rounds (not already-played rounds).
        
        Args:
            from_round: First round to regenerate (inclusive)
        
        Business Logic:
            - Get currently ACTIVE players (attending + checked_in + not left yet)
            - Delete matches for rounds >= from_round that are still pending
            - Regenerate those rounds with updated player list
        
        CRITICAL: Only works for round-robin matches!
        """
        from matches.models import Match
        from .services.round_robin import RoundRobinGenerator
        
        # Get existing matches for this session
        existing_matches = Match.objects.filter(
            league=self.league_participation.league,
            league_session=self.league_session,
            match_date=self.session_date,
            round_number__gte=from_round,  # ← Only future rounds!
            match_status=MatchStatus.PENDING  # ← Only unplayed matches!
        )
        
        # Safety check: only regenerate round-robin matches
        if not existing_matches.exists():
            return
        
        first_match = existing_matches.first()
        if first_match.generation_format != GenerationFormat.ROUND_ROBIN:
            return  # Don't touch King-of-Court, Manual, or MLP matches!
        
        # Get currently ACTIVE players for this round
        # Logic: attending AND checked_in AND (not left OR left after this round)
        active_players = []
        all_attendance = LeagueAttendance.objects.filter(
            league_participation__league=self.league_participation.league,
            league_session=self.league_session,
            session_date=self.session_date,
            status=LeagueAttendanceStatus.ATTENDING,
            checked_in=True  # ← Only checked-in players!
        )
        
        for att in all_attendance:
            # Check if player is still active for this round
            if att.left_after_round and att.left_after_round < from_round:
                continue  # Player left before this round
            
            if att.arrived_before_round and att.arrived_before_round > from_round:
                continue  # SAFETY CHECK: Should never happen in normal operation!
                         # This would mean: "We're regenerating Round X, but player arrives AFTER Round X"
                         # Example: Regenerating R4, but player arrived_before_round=6
                         # In practice, we ONLY regenerate from arrived_before_round onwards,
                         # so this condition protects against bugs in calling code.
            
            active_players.append(att.league_participation.member)
        
        # Delete old future rounds
        existing_matches.delete()
        
        # Generate fresh matches for future rounds with updated player list
        generator = RoundRobinGenerator(
            self.league_session,
            self.session_date,
            active_players,
            starting_round=from_round  # ← Start from specific round number!
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
            status=LeagueParticipationStatus.ACTIVE
        )
        
        # Create attendance records
        for participation in participants:
            LeagueAttendance.objects.get_or_create(
                league_participation=participation,
                session_date=next_date,
                league_session=instance,
                defaults={'status': LeagueAttendanceStatus.ATTENDING}
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
        ordering = ['num_players']
    
    def __str__(self):
        courts_needed = self.num_players // 4
        return f"{self.num_players} players ({courts_needed} courts)"
    
    @property
    def courts_needed(self):
        """Calculate number of courts needed for this player count."""
        return self.num_players // 4
    
    @property
    def bench_count(self):
        """Calculate number of players on bench each round."""
        return self.num_players % 4
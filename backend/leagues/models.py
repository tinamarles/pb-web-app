# leagues/models.py

from django.db import models
from django.core.exceptions import ValidationError
from functools import cached_property
from clubs.models import Club, ClubMembership, ClubMembershipSkillLevel
from courts.models import CourtLocation
from public.constants import LeagueType, GenerationFormat, LeagueParticipationStatus, DayOfWeek, RecurrenceType, LeagueAttendanceStatus, MatchStatus, SkillLevel
from datetime import date, timedelta, datetime
from django.contrib.auth import get_user_model
from django.utils import timezone

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
    Pickleball league OR event.
    
    Examples:
    - "Rising Stars" - Standard league, 3.5+ skill, Mon/Wed 8-10am
      (Captain chooses format when generating matches: Round-Robin OR King-of-Court OR Manual)
    - "MLP Champions" - MLP league, open skill, Fri 12-2pm
      (Fixed 4+ player teams, MLP match format)
    - "Doubles Buddies" - Team league, 3.0+ skill, Tue/Thu 6-8pm
      (Fixed 2-player teams for entire season)
    - "Open Play Friday" - Recurring event, drop-in, Fri 9-11am
      (Users register per-session, not for entire season)
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
    
    # Full Fee - if a user has a subscription with a discount, the actual fee will be calculated based on that
    fee = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Fee per session (events) or season enrollment (leagues). NULL = free.'
    )
    # Capacity control (dual-purpose field based on is_event flag)
    max_participants = models.IntegerField(
        blank=True,
        null=True,
        help_text=(
            'Maximum number of participants (unlimited if blank). '
            'For LEAGUES: Season enrollment cap (additional joiners become reserves). '
            'For EVENTS: Per-session cap (additional joiners join waitlist).'
        )
    )
    
    # Overflow handling (dual-purpose field based on is_event flag)
    allow_reserves = models.BooleanField(
        default=True,
        help_text=(
            'Allow overflow participants when full. '
            'For LEAGUES: Season-long RESERVE list. '
            'For EVENTS: Per-session WAITLIST.'
        )
    )
    
    # [EVENTS ONLY] Per-session registration windows
    registration_opens_hours_before = models.PositiveIntegerField(
        default=168,  # 1 week
        help_text="[EVENTS] Hours before session start that registration opens"
    )
    
    registration_closes_hours_before = models.PositiveIntegerField(
        default=2,  # 2 hours
        help_text="[EVENTS] Hours before session start that registration closes"
    )
    
    # [LEAGUES ONLY] Registration window dates
    registration_start_date = models.DateField(
        null=True,
        blank=True,
        help_text='[LEAGUES] When registration opens (NULL = open immediately)'
    )
    
    registration_end_date = models.DateField(
        null=True,
        blank=True,
        help_text='[LEAGUES] When registration closes (NULL = stays open)'
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
        help_text='Required skill Level (e.g., 3.5+ means only 3.5+ players can join. 4.0+ or Inter 1 can not join).)'
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
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'name']

    def __str__(self):
        return f"{self.name} ({self.club.name})"
    
    def clean(self):
        """
        Model-level validation.
        
        CRITICAL: Ensures every League/Event has at least 1 session!
        This validation runs when:
        - Admin form is submitted
        - serializer.is_valid() is called in API
        - instance.full_clean() is called in code
        
        NOTE: This does NOT run automatically on save()!
        You must call full_clean() before save() in your code!
        """
        super().clean()
        
        # ⚠️ ONLY validate for existing instances (not during creation)
        # Reason: Sessions are created AFTER league is saved (via inline forms)
        # So we can't check on initial creation!
        if self.pk:
            # Check if at least one session exists
            session_count = self.sessions.count()
            if session_count == 0:
                raise ValidationError(
                    "At least one session is required! "
                    "Every league/event must have a schedule."
                )
    
    @property
    def registration_open(self):
        """
        Check if registration is currently open.
        
        For LEAGUES: Check date-based windows
        For EVENTS: Handled per-session in SessionOccurrence
        """
        # For events, registration is session-specific
        # Use SessionOccurrence.registration_open instead!
        if self.is_event:
            # Return True as default - actual check is per-session
            return True
        
        # For leagues, check date-based windows
        now = timezone.localtime().date()
        
        # Check start date
        if self.registration_start_date and now < self.registration_start_date:
            return False
        
        # Check end date
        if self.registration_end_date and now > self.registration_end_date:
            return False
        
        return True  # Default: open
    
    @property
    def next_occurrence(self):
        """
        Get next upcoming SessionOccurrence.
        
        ⚡ OPTIMIZED with direct league FK - NO joins needed!
        Query is so fast (~5-10ms using indexed league_id) that caching is unnecessary!
        """
        today = timezone.localtime().date()
        
        return SessionOccurrence.objects.filter(
            league=self,  # ⚡ Direct FK instead of league_session__league!
            session_date__gte=today,
            is_cancelled=False
        ).select_related(
            'league_session__court_location__address'
        ).order_by('session_date', 'start_datetime').first()
    
    def get_display_occurrence(self, status='upcoming'):
        """
        Get the most relevant SessionOccurrence based on filter status.
        
        Logic:
        - 'upcoming': Next future occurrence (same as next_occurrence property)
        - 'past': Most recent past occurrence
        - 'all': Next future occurrence OR most recent past (fallback)
        
        Returns:
            SessionOccurrence or None
        """
        today = timezone.localtime().date()
        base_query = SessionOccurrence.objects.filter(
            league=self,
            is_cancelled=False
        ).select_related(
            'league_session__court_location__address'
        )
        
        if status == 'past':
            # Get most recent PAST occurrence
            return base_query.filter(
                session_date__lt=today
            ).order_by('-session_date', '-start_datetime').first()
        
        elif status == 'all':
            # Try to get next FUTURE occurrence first
            future = base_query.filter(
                session_date__gte=today
            ).order_by('session_date', 'start_datetime').first()
            
            if future:
                return future
            
            # Fallback: Get most recent PAST occurrence
            return base_query.filter(
                session_date__lt=today
            ).order_by('-session_date', '-start_datetime').first()
        
        else:  # 'upcoming' (default)
            # Same as next_occurrence property
            return base_query.filter(
                session_date__gte=today
            ).order_by('session_date', 'start_datetime').first()
        
    def can_user_join(self, user, club_membership, session_date=None):
        """
        Check if user can join league/event.
        
        Args:
            user: User attempting to join
            club_membership: User's ClubMembership at this club
            session_date: (REQUIRED for events!) Specific session date
        
        Returns:
            tuple: (can_join: bool, join_as: str, reason: str)
            where join_as is:
              - For leagues: LeagueParticipationStatus.ACTIVE or RESERVE
              - For events: LeagueAttendanceStatus.ATTENDING or WAITLIST
        """
        
        # ========================================
        # EVENTS: Require session_date parameter
        # ========================================
        if self.is_event and not session_date:
            raise ValueError("session_date is required for events!")
        
        # ========================================
        # CHECK: Registration open?
        # ========================================
        if self.is_event:
            # Get the specific session occurrence
            try:
                occurrence = SessionOccurrence.objects.get(
                    league_session__league=self,
                    session_date=session_date
                )
            except SessionOccurrence.DoesNotExist:
                return (False, None, "Session not found")
            
            if not occurrence.registration_open:
                return (False, None, "Registration is not open for this session")
        else:
            # League: check league-level registration
            if not self.registration_open:  # Uses @property
                return (False, None, "Registration is closed")
        
        # ========================================
        # CHECK: Already joined?
        # ========================================
        if self.is_event:
            # Events: Check if already registered for THIS specific session
            already_registered = LeagueAttendance.objects.filter(
                league_participation__league=self,
                league_participation__member=user,
                session_date=session_date,
                status__in=[
                    LeagueAttendanceStatus.ATTENDING,
                    LeagueAttendanceStatus.WAITLIST
                ]
            ).exists()
            
            if already_registered:
                return (False, None, "You are already registered for this session")
        else:
            # Leagues: Check if already enrolled in the season
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
        
        # ========================================
        # CHECK: Skill requirement
        # ========================================
        if self.minimum_skill_level:
            # Special case: OPEN leagues accept anyone
            if self.minimum_skill_level.level == SkillLevel.OPEN:
                # Anyone can join OPEN leagues!
                pass  # Continue to next check
            else:
                # User MUST have this exact level in their ClubMembership.levels[]
                user_skill_levels = club_membership.levels.all()
                
                # Check if user has the required level
                has_required_level = user_skill_levels.filter(
                    id=self.minimum_skill_level.id
                ).exists()
                
                if not has_required_level:
                    return (
                        False,
                        None,
                        f"Requires skill level: {self.minimum_skill_level.short_name}"
                    )
        
        # ========================================
        # CHECK: Capacity (same field, different meaning!)
        # ========================================
        if self.max_participants:
            if self.is_event:
                # Events: Check per-session capacity
                current_count = occurrence.current_participants_count
                
                if current_count >= self.max_participants:
                    # Session full - can join waitlist?
                    if self.allow_reserves:  # ← "reserves" = "waitlist" for events!
                        return (
                            True,
                            LeagueAttendanceStatus.WAITLIST,
                            f"Session full ({current_count}/{self.max_participants}). You will join the WAITLIST."
                        )
                    else:
                        return (False, None, "Session is full and not accepting waitlist")
            else:
                # Leagues: Check total enrollment capacity
                current_count = self.participants.filter(
                    leagueparticipation__status=LeagueParticipationStatus.ACTIVE
                ).count()
                
                if current_count >= self.max_participants:
                    # League full - can join as reserve?
                    if self.allow_reserves:  # ← "reserves" = season reserves for leagues!
                        return (
                            True,
                            LeagueParticipationStatus.RESERVE,
                            f"League is full ({current_count}/{self.max_participants}). You will join as RESERVE."
                        )
                    else:
                        return (False, None, "League is full and not accepting reserves")
        
        # Can join!
        if self.is_event:
            return (True, LeagueAttendanceStatus.ATTENDING, "Welcome to this session!")
        else:
            return (True, LeagueParticipationStatus.ACTIVE, "Welcome to the league!")
    
    def get_current_participants_count(self, session_date=None):
        """
        Get participant count.
        
        Args:
            session_date: (For events) Specific session to count
        
        Returns:
            int: Number of active/attending participants
        """
        if self.is_event:
            if not session_date:
                raise ValueError("session_date required for events!")
            
            # Count attendees for THIS session
            return LeagueAttendance.objects.filter(
                league_participation__league=self,
                session_date=session_date,
                status=LeagueAttendanceStatus.ATTENDING
            ).count()
        else:
            # Count enrolled members
            return self.participants.filter(
                leagueparticipation__status=LeagueParticipationStatus.ACTIVE
            ).count()

    def is_full(self, session_date=None):
        """
        Check if league/session is at max capacity.
        
        Args:
            session_date: (For events) Specific session to check
        """
        if not self.max_participants:
            return False
        
        if self.is_event:
            if not session_date:
                raise ValueError("session_date required for events!")
            
            return self.get_current_participants_count(session_date) >= self.max_participants
        else:
            return self.get_current_participants_count() >= self.max_participants
    
    def get_skill_requirement_display_text(self):
        """Get user-friendly skill requirement text."""
        if not self.minimum_skill_level:
            return "Open to all skill levels"
        
        # Since we're using integer IDs (1='open', 2='3.5+', 3='4.0+'),
        # we display the actual level text
        return f"Minimum skill: {self.minimum_skill_level.level}"
        
    @property
    def upcoming_occurrences(self):
        """Get next 10 upcoming SessionOccurrences"""
        today = timezone.localtime().date()
        return SessionOccurrence.objects.filter(
            league=self,
            session_date__gte=today,
            is_cancelled=False
        ).order_by('session_date', 'start_datetime')[:10]  # ← Limit to 10!
    
    @property
    def is_recurring(self) -> bool:
        """
        Determine if this league/event has any recurring sessions.
        Based on same logic as get_recurring_days() serializer method.
        Returns:
            True if any sessions have recurrence_type != ONCE
            False if all sessions are one-time only
        """
        from public.constants import RecurrenceType
        return self.sessions.exclude(recurrence_type=RecurrenceType.ONCE).exists()
    
    @property
    def one_time_session(self):
        """
        Get details of a one-time session so it can be shown on Event Card.
        Without it, there are no records in next_occurrence.
        
        ⚡ OPTIMIZED with direct league FK - NO joins needed!
        Query is so fast (~5-10ms using indexed league_id) that caching is unnecessary!
        """
        today = timezone.localtime().date()
        
        if self.is_recurring:
            return None
        
        return SessionOccurrence.objects.filter(
            league=self,  # ⚡ Direct FK instead of league_session__league!
        ).select_related(
            'league_session__court_location__address'
        ).order_by('session_date', 'start_datetime').first()
    
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
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate SessionOccurrence records.
        
        When LeagueSession is created or updated, we pre-calculate
        all session dates and create SessionOccurrence records.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Generate occurrences after saving
        if is_new or kwargs.get('regenerate_occurrences', False):
            self.generate_occurrences()
    
    def generate_occurrences(self):
        """
        Generate SessionOccurrence records for this session.
        
        Called automatically when LeagueSession is saved.
        Deletes old occurrences and creates new ones.
        
        Handles:
        - One-time events (RecurrenceType.ONCE)
        - Recurring events/leagues (WEEKLY, BI_WEEKLY, MONTHLY)
        """
        
        # Delete existing occurrences
        SessionOccurrence.objects.filter(league_session=self).delete()
        
        # Get date range
        start = self.active_from or self.league.start_date
        end = self.active_until or self.league.end_date
        
        # ========================================
        # ONE-TIME EVENT
        # ========================================
        if self.recurrence_type == RecurrenceType.ONCE:
            # Create single occurrence on league.start_date
            session_date = self.league.start_date
            
            # Combine date + time
            start_dt = timezone.make_aware(
                datetime.combine(session_date, self.start_time)
            )
            end_dt = timezone.make_aware(
                datetime.combine(session_date, self.end_time)
            )
            
            # Create the ONE occurrence
            occurrence = SessionOccurrence(
                league_session=self,
                league=self.league,
                session_date=session_date,
                start_datetime=start_dt,
                end_datetime=end_dt
            )
            
            # Calculate registration windows for events
            if self.league.is_event:
                occurrence.registration_opens_at = start_dt - timedelta(
                    hours=self.league.registration_opens_hours_before
                )
                occurrence.registration_closes_at = start_dt - timedelta(
                    hours=self.league.registration_closes_hours_before
                )
            
            occurrence.save()
            return  # Done! Only one occurrence
        
        # ========================================
        # RECURRING EVENT/LEAGUE
        # ========================================
        current_date = start
        occurrences = []
        
        # Find the first occurrence (first matching day_of_week)
        while current_date <= end and current_date.weekday() != self.day_of_week:
            current_date += timedelta(days=1)
        
        # Now generate occurrences based on recurrence_type and interval
        while current_date <= end:
            # Combine date + time
            start_dt = timezone.make_aware(
                datetime.combine(current_date, self.start_time)
            )
            end_dt = timezone.make_aware(
                datetime.combine(current_date, self.end_time)
            )
            
            # Create occurrence
            occurrence = SessionOccurrence(
                league_session=self,
                league=self.league,
                session_date=current_date,
                start_datetime=start_dt,
                end_datetime=end_dt
            )
            
            # Calculate registration windows for events
            if self.league.is_event:
                occurrence.registration_opens_at = start_dt - timedelta(
                    hours=self.league.registration_opens_hours_before
                )
                occurrence.registration_closes_at = start_dt - timedelta(
                    hours=self.league.registration_closes_hours_before
                )
            
            occurrences.append(occurrence)
            
            # Move to next occurrence based on recurrence_type
            if self.recurrence_type == RecurrenceType.WEEKLY:
                # Every week: interval * 7 days
                current_date += timedelta(weeks=self.recurrence_interval)
            elif self.recurrence_type == RecurrenceType.BI_WEEKLY:
                # Every other week: 2 weeks * interval
                current_date += timedelta(weeks=2 * self.recurrence_interval)
            elif self.recurrence_type == RecurrenceType.MONTHLY:
                # Monthly: Move to next month, find same day_of_week
                # This is tricky - need to handle varying month lengths
                # Simple approach: add ~4 weeks, then find next matching day
                current_date += timedelta(weeks=4 * self.recurrence_interval)
                # Adjust to correct day_of_week if needed
                while current_date.weekday() != self.day_of_week:
                    current_date += timedelta(days=1)
        
        # Bulk create all occurrences
        SessionOccurrence.objects.bulk_create(occurrences)
    
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
    
class SessionOccurrence(models.Model):
    """
    Pre-calculated occurrence of a recurring session.
    
    WHY THIS EXISTS:
    - Auto-generated when LeagueSession is created/updated
    - Stores ALL session dates for the league/event
    - Pre-calculates registration windows (no runtime calculation!)
    - Enables per-session participant tracking
    - Makes queries MUCH faster
    
    EXAMPLES:
    - League "Rising Stars" runs Mon/Wed 8-10am for 12 weeks
      → Creates 24 SessionOccurrence records (12 Mon + 12 Wed)
    
    - Event "Open Play Friday" runs every Friday 9-11am for 4 months
      → Creates ~17 SessionOccurrence records (one per Friday)
    """
    
    league_session = models.ForeignKey(
        LeagueSession,
        on_delete=models.CASCADE,
        related_name='occurrences'
    )
    # ⚡ NEW: Direct league FK
    league = models.ForeignKey(
        League,
        on_delete=models.CASCADE,
        related_name='all_occurrences',
        help_text='Direct link to league (denormalized for performance)'
    )
    
    # Pre-calculated date/time
    session_date = models.DateField(
        help_text='Specific date of this session'
    )
    start_datetime = models.DateTimeField(
        help_text='Exact start (date + time combined)'
    )
    end_datetime = models.DateTimeField(
        help_text='Exact end (date + time combined)'
    )
    
    # [EVENTS] Pre-calculated registration windows
    registration_opens_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When registration opens for this session (events only)'
    )
    registration_closes_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When registration closes for this session (events only)'
    )
    
    # Status
    is_cancelled = models.BooleanField(
        default=False,
        help_text='Captain cancelled this specific occurrence'
    )
    cancellation_reason = models.CharField(
        max_length=500,
        blank=True
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('league_session', 'session_date')
        ordering = ['session_date', 'league_session']
        indexes = [
            models.Index(fields=['league', 'session_date', 'is_cancelled']),
            models.Index(fields=['session_date', 'league_session']),
        ]
    
    def __str__(self):
        return f"{self.league_session.league.name} - {self.session_date}"
    
    def save(self, *args, **kwargs):
        if self.league_session.league.is_event and self.registration_opens_at is None:
            league = self.league_session.league
            self.registration_opens_at = self.start_datetime - timedelta(hours=league.registration_opens_hours_before)
            self.registration_closes_at = self.start_datetime - timedelta(hours=league.registration_closes_hours_before)
        super().save(*args, **kwargs)

    @property
    def registration_open(self):
        """Check if registration is currently open for this session."""
        # For leagues: use league-level setting
        if not self.league_session.league.is_event:
            return self.league_session.league.registration_open
        
        # For events: check session-specific windows
        if not self.registration_opens_at or not self.registration_closes_at:
            # Calculate from league settings instead of defaulting to True
            league = self.league_session.league
            registration_opens = self.start_datetime - timedelta(hours=league.registration_opens_hours_before)
            registration_closes = self.start_datetime - timedelta(hours=league.registration_closes_hours_before)
            now = timezone.localtime()
            return registration_opens <= now <= registration_closes
        now = timezone.localtime()
        return self.registration_opens_at <= now <= self.registration_closes_at
            
    @property
    def current_participants_count(self):
        """Get participant count for THIS specific session."""
        return LeagueAttendance.objects.filter(
            session_occurrence=self,  # ✅ CORRECT!
            status=LeagueAttendanceStatus.ATTENDING
        ).count()
    
    @property
    def is_full(self):
        """Check if THIS session is at max capacity."""
        league = self.league_session.league
        
        if not league.max_participants:
            return False  # Unlimited
        
        # Events: per-session limit
        if league.is_event:
            return self.current_participants_count >= league.max_participants
        
        # Leagues: total enrollment limit
        return league.get_current_participants_count() >= league.max_participants
    
    @property
    def available_spots(self):
        """Get remaining spots for this session."""
        league = self.league_session.league
        
        if not league.max_participants:
            return None  # Unlimited
        
        # Events: per-session availability
        if league.is_event:
            return max(0, league.max_participants - self.current_participants_count)
        
        # Leagues: season availability
        return max(0, league.max_participants - league.get_current_participants_count())
    
    def should_run(self):
        """
        Check if this specific session occurrence should run.
        
        Checks cancellation hierarchy:
        1. League.is_active (entire league)
        2. LeagueSession.is_active (recurring session template)
        3. SessionOccurrence.is_cancelled (this specific occurrence) ← GRANULAR!
        4. SessionCancellation (date-range cancellations)
        
        Returns:
            tuple: (should_run: bool, reason: str)
        
        Examples:
            # Check if Friday 9am Jan 23 should run
            occurrence = SessionOccurrence.objects.get(
                league_session=friday_morning_session,
                session_date=date(2026, 1, 23)
            )
            should_run, reason = occurrence.should_run()
            
            if should_run:
                generate_matches_for_occurrence(occurrence)
            else:
                print(f"Session cancelled: {reason}")
        """
        
        # 1. Check league status
        if not self.league_session.league.is_active:
            return False, "League cancelled"
        
        # 2. Check session template status
        if not self.league_session.is_active:
            return False, "Session permanently suspended"
        
        # 3. Check if THIS SPECIFIC OCCURRENCE is cancelled
        # 🎯 MOST GRANULAR - Can cancel Friday 9am Jan 23, but not Friday 2pm Jan 23!
        if self.is_cancelled:
            reason = self.cancellation_reason or "Session cancelled"
            return False, reason
        
        # 4. Check for date-range cancellations (SessionCancellation)
        # Affects all occurrences of this session within the date range
        has_range_cancellation = self.league_session.cancellations.filter(
            cancelled_from__lte=self.session_date,
            cancelled_until__gte=self.session_date
        ).exists()
        
        if has_range_cancellation:
            cancellation = self.league_session.cancellations.filter(
                cancelled_from__lte=self.session_date,
                cancelled_until__gte=self.session_date
            ).first()
            return False, f"Temporarily cancelled: {cancellation.reason}"
        
        return True, "Session active"
    
    def cancel_session(self, reason: str = "", notify_attendees: bool = True):
        """
        Cancel this specific session occurrence and optionally notify attendees.
        
        🚨 AUTO-NOTIFICATION LOGIC:
        - When cancelled, sends system notifications to ALL attending users
        - Notifications are brief: "Session cancelled: [date] [time]"
        - Captain should ALSO create a League Announcement with detailed explanation
        
        Args:
            reason: Why session is cancelled (captain's explanation)
            notify_attendees: If True, auto-send notifications to attending users
        
        Business Logic:
            1. Mark occurrence as cancelled
            2. Save cancellation reason
            3. If notify_attendees=True:
            - Get all LeagueAttendance with status=ATTENDING
            - Send system notification to each user
            - Notification type: LEAGUE_SESSION_CANCELLED (type 26)
        
        Examples:
            # Cancel Friday 9am session on Jan 23
            occurrence = SessionOccurrence.objects.get(
                league_session=friday_morning_session,
                session_date=date(2026, 1, 23)
            )
            occurrence.cancel_session(
                reason="Court maintenance - facility closed",
                notify_attendees=True  # Auto-send notifications
            )
            
            # Result:
            # 1. Occurrence marked cancelled ✅
            # 2. System notifications sent to all attending users ✅
            # 3. Captain creates announcement with detailed info (manual step)
        """
        from notifications.models import Notification
        from public.constants import NotificationType
        
        # Mark as cancelled
        self.is_cancelled = True
        self.cancellation_reason = reason
        self.save(update_fields=['is_cancelled', 'cancellation_reason', 'updated_at'])
        
        # Send notifications if requested
        if notify_attendees:
            # Get all users with ATTENDING status for THIS session
            attending = LeagueAttendance.objects.filter(
                session_occurrence=self,  # ✅ CORRECT!
                status=LeagueAttendanceStatus.ATTENDING
            ).select_related('league_participation__member')
            
            # Prepare notification data
            league_name = self.league_session.league.name
            session_day = self.session_date.strftime("%A, %B %d")  # "Friday, January 23"
            session_time = f"{self.league_session.start_time.strftime('%I:%M %p')}"  # "9:00 AM"
            
            # Create notifications for each attendee
            notifications_to_create = []
            for att in attending:
                notifications_to_create.append(
                    Notification(
                        recipient=att.league_participation.member,
                        notification_type=NotificationType.LEAGUE_SESSION_CANCELLED,
                        title=f"{league_name} - Session Cancelled",
                        message=f"Session on {session_day} at {session_time} has been cancelled.",
                        league=self.league_session.league,
                        action_url=f"/leagues/{self.league_session.league.id}",
                        action_label="View League",
                        metadata={
                            'session_date': str(self.session_date),
                            'session_time': session_time,
                            'cancellation_reason': reason or "No reason provided"
                        }
                    )
                )
            
            # Bulk create all notifications at once
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)

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
    
    # ⭐ Points to SessionOccurrence (which contains league_session + session_date!)
    # This eliminates redundant data - one source of truth!
    session_occurrence = models.ForeignKey(
        SessionOccurrence,
        on_delete=models.CASCADE,
        related_name='attendances',
        help_text='Which specific session occurrence this attendance is for'
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
        unique_together = ('league_participation', 'session_occurrence')
        ordering = ['session_occurrence', 'league_participation']
    
    def __str__(self):
        return (
            f"{self.league_participation.member.get_full_name()} - "
            f"{self.session_occurrence.session_date} ({self.get_status_display()})"
        )
    
    def cancel(self, reason=None):
        """
        Cancel attendance.
        
        Triggers:
        - Status change to 'cancelled'
        - Match regeneration ONLY if matches were round-robin generated
        """
        
        self.status = LeagueAttendanceStatus.CANCELLED
        self.cancelled_at = timezone.now()
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
        
        # Get existing matches for THIS specific session occurrence
        existing_matches = Match.objects.filter(
            league=self.league_participation.league,
            league_session=self.session_occurrence.league_session,
            match_date=self.session_occurrence.session_date,
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
            session_occurrence=self.session_occurrence,
            status=LeagueAttendanceStatus.ATTENDING
        )
        
        # Delete old round-robin matches
        existing_matches.delete()
        
        # Generate fresh matches with updated player list
        generator = RoundRobinGenerator(
            self.session_occurrence.league_session,
            self.session_occurrence.session_date,
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
            league_session=self.session_occurrence.league_session,
            match_date=self.session_occurrence.session_date,
            round_number__gte=from_round,  # ← Only future rounds!
            match_status=MatchStatus.PENDING
        )
        
        # Check if round-robin format
        if not existing_matches.exists():
            return
        
        first_match = existing_matches.first()
        if first_match.generation_format != GenerationFormat.ROUND_ROBIN:
            return  # Don't touch other formats!
        
        # Get active players (currently at session)
        active_players = LeagueAttendance.objects.filter(
            league_participation__league=self.league_participation.league,
            session_occurrence=self.session_occurrence,
            checked_in=True,  # Only checked-in players
            left_after_round__isnull=True  # Haven't left yet
        )
        
        # Delete old future rounds
        existing_matches.delete()
        
        # Regenerate with updated player list
        generator = RoundRobinGenerator(
            self.session_occurrence.league_session,
            self.session_occurrence.session_date,
            [att.league_participation.member for att in active_players],
            start_round=from_round  # Start from this round
        )
        generator.generate_matches()

# ========================================
# ROUND ROBIN PATTERN MODEL
# ========================================
class RoundRobinPattern(models.Model):
    """
    Predefined round-robin rotation patterns.
    
    Stores patterns like:
    - 5 courts, 22 players
    - 4 courts, 18 players
    - 3 courts, 14 players
    
    Based on real paper sheets!
    
    Pattern stored as JSON with this structure:
    {
        "rounds": [
            {
                "round_number": 1,
                "courts": [
                    {
                        "court_number": 1,
                        "team1": [1, 2],  # Player positions
                        "team2": [3, 4]
                    },
                    {
                        "court_number": 2,
                        "team1": [5, 6],
                        "team2": [7, 8]
                    },
                    ...
                ],
                "bench": [21, 22]  # Player positions sitting out
            },
            ...
        ]
    }
    """
    
    # Pattern identification
    num_players = models.IntegerField(
        unique=True,
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
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['num_players']
        verbose_name = 'Round-Robin Pattern'
        verbose_name_plural = 'Round-Robin Patterns'
    
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
    
    @property
    def num_rounds(self):
        """Get total number of rounds in this pattern."""
        return len(self.pattern_data.get('rounds', []))

# ========================================
# SIGNALS
# ========================================
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=LeagueParticipation)
def create_attendance_records_on_enrollment(sender, instance, created, **kwargs):
    """
    When user enrolls in a LEAGUE, auto-create attendance records for ALL future sessions.
    
    WHY THIS EXISTS:
    - Leagues: Members enrolled for entire season → pre-create attendance for all sessions
    - Events: Users register per-session → NO signal needed (explicit registration action)!
    
    BUSINESS LOGIC:
    - Only runs for LEAGUES (is_event=False)
    - Only runs when LeagueParticipation is CREATED (not updated)
    - Creates LeagueAttendance with status=ATTENDING for all FUTURE SessionOccurrences
    - Users can then cancel if they can't make a specific session
    
    LOGICAL FLOW:
    1. Organizer creates LeagueSession → SessionOccurrences created
    2. User enrolls → LeagueParticipation created
    3. 🎯 THIS SIGNAL FIRES → attendance records created for all future sessions
    4. User sees all sessions they're enrolled in
    5. User can cancel individual sessions
    
    NOTE: For EVENTS, attendance is created when user registers for a specific session!
          No signal needed - it's an explicit action!
    """
    # Only for newly created participations
    if not created:
        return
    
    # Only for LEAGUES (not events!)
    league = instance.league
    if league.is_event:
        return  # Events handle attendance differently!
    
    # Get all FUTURE SessionOccurrences for this league
    # (Don't create attendance for past sessions!)
    from django.utils import timezone
    today = timezone.localtime().date()
    
    future_occurrences = SessionOccurrence.objects.filter(
        league_session__league=league,
        session_date__gte=today  # Only future sessions
    )
    
    # Create attendance records for all future sessions
    attendance_records = []
    for occurrence in future_occurrences:
        attendance_records.append(
            LeagueAttendance(
                league_participation=instance,
                session_occurrence=occurrence,
                status=LeagueAttendanceStatus.ATTENDING  # Default: attending
            )
        )
    
    # Bulk create all attendance records
    if attendance_records:
        LeagueAttendance.objects.bulk_create(
            attendance_records,
            ignore_conflicts=True  # In case records already exist
        )

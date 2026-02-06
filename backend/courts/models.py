from django.db import models
from public.models import Address
from public.constants import AffiliationType, BookingType, BlockType, DayOfWeek
from clubs.models import Club
from django.contrib.auth import get_user_model

User = get_user_model()

# Create your models here.
# CourtLocation contains all the static information for a court location, including
# the maximum number of courts available

class CourtLocation(models.Model):
    """
    Physical court location.
    
    Examples:
    - Parc Optimiste (8 courts, club affiliated)
    - Tennis 13 (20 courts, public booking site)
    - Centre Pickle (6 courts, dedicated pickleball)
    - Parc La Source (4 courts, club affiliated)
    """
    
    # Basic info
    name = models.CharField(
        max_length=200,
        help_text='Court name (e.g., Parc Optimiste, Tennis 13, Centre Pickle)'
    )
    address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='court_locations',
        help_text='Physical address of court location'
    )
    
    # Court details
    number_of_courts = models.IntegerField(
        default=1,
        help_text='Total number of courts at this location'
    )
    
    # External booking
    booking_website = models.URLField(
        blank=True,
        help_text='Link to external booking site (e.g., www.pickleballenligne.com/PSJ)'
    )
    
    # Club affiliations (through intermediary model)
    affiliated_clubs = models.ManyToManyField(
        Club,
        through='CourtClubAffiliation',
        related_name='affiliated_courts',
        blank=True,
        help_text='Clubs that have priority access or block bookings at this location'
    )
    
    # Display info
    description = models.TextField(
        blank=True,
        help_text='Additional info about the court (e.g., "Outdoor courts, covered")'
    )
    photo = models.URLField(
        max_length=200,
        blank=True,
        help_text='Photo of court location'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Court Location'
    
    def __str__(self):
        return self.name
    
    def get_affiliated_club_names(self):
        """Get comma-separated list of affiliated clubs."""
        return ', '.join(
            self.affiliated_clubs.values_list('name', flat=True)
        )

class CourtClubAffiliation(models.Model):
    """
    Links courts to clubs that have priority access.
    
    Examples:
    - Club St. Jérôme has priority access at Parc Optimiste
    - Club St. Jérôme has exclusive block bookings Mondays 8-12pm at Parc La Source
    - Multiple clubs may share access at same location
    """
    
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.CASCADE,
        related_name='club_affiliations'
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='court_affiliations'
    )
    
    # Affiliation details
    affiliation_type = models.IntegerField(
        choices=AffiliationType,
        default=AffiliationType.PRIORITY
    )
    
    notes = models.TextField(
        blank=True,
        help_text='e.g., "Club has priority Mondays 8-12pm" or "Exclusive access for leagues"'
    )
    
    # Active period (optional)
    start_date = models.DateField(
        blank=True,
        null=True,
        help_text='When affiliation starts (e.g., start of season)'
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        help_text='When affiliation ends (e.g., end of season)'
    )
    
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('court_location', 'club')
        verbose_name = 'Court-Club Affiliation'
    
    def __str__(self):
        return f"{self.club.name} at {self.court_location.name} ({self.get_affiliation_type_display()})"

class UserCourtBooking(models.Model):
    """
    User's manually-entered court bookings.
    
    WHY MANUAL ENTRY?
    - Users book on various external sites (Tennis 13, Centre Pickle, city websites, etc.)
    - Each site has different systems, APIs (if any), authentication
    - Impossible to integrate with all of them
    - This app doesn't replace those booking systems!
    
    WHAT THIS DOES:
    - Lets users track their bookings in ONE place
    - Shows combined schedule with league matches
    - Simple and practical!
    
    Examples:
    - "I booked Tennis 13, Monday 1-2pm, Court 14"
    - "I booked Parc Optimiste, Wednesday 2-4pm, Court 2"
    - "I have Parc La Source reserved, Friday 10-12pm"
    """
    
    # Who booked
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='manual_court_bookings',
        help_text='User who made this booking'
    )
    
    # Court details
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.CASCADE,
        related_name='user_bookings',
        help_text='Which court location'
    )
    court_number = models.CharField(
        max_length=20,
        blank=True,
        help_text='Specific court number (if known, e.g., "14", "Court 2", "T5")'
    )
    
    # Time details
    booking_date = models.DateField(help_text='Date of booking')
    start_time = models.TimeField(help_text='Start time')
    end_time = models.TimeField(help_text='End time')
    
    # Booking details
    booking_type = models.IntegerField(
        choices=BookingType,
        default=BookingType.PRACTICE
    )
    
    # Who's playing (optional)
    with_players = models.ManyToManyField(
        User,
        related_name='shared_bookings',
        blank=True,
        help_text='Other users playing with you (if they have accounts)'
    )
    
    # External booking reference (optional)
    external_booking_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text='Booking confirmation number from external site (if any)'
    )

    # Full Fee - if a user has a subscription with a discount, the actual fee will be calculated based on that
    booking_fee = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Total Booking Fee per session. NULL = free.'
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text='e.g., "Doubles with Joe and Laura", "Working on serves"'
    )
    
    # Reminders (optional - future feature)
    send_reminder = models.BooleanField(
        default=False,
        help_text='Send reminder notification before booking'
    )
    reminder_minutes_before = models.IntegerField(
        blank=True,
        null=True,
        help_text='Minutes before booking to send reminder (e.g., 60 for 1 hour)'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['booking_date', 'start_time']
        verbose_name = 'User Court Booking'
    
    def __str__(self):
        court = f" Court {self.court_number}" if self.court_number else ""
        return (
            f"{self.user.username} - {self.court_location.name}{court} - "
            f"{self.booking_date} {self.start_time}-{self.end_time}"
        )
    
    def get_duration_hours(self):
        """Calculate booking duration in hours."""
        from datetime import datetime, date
        start = datetime.combine(date.min, self.start_time)
        end = datetime.combine(date.min, self.end_time)
        duration = end - start
        return duration.total_seconds() / 3600

class CourtScheduleBlock(models.Model):
    """
    OPTIONAL MODEL - For displaying court schedule to users.
    
    Shows weekly schedule blocks like:
    - "Monday 8-10am: League Action Pickleball" (4 courts, magenta)
    - "Monday 10-12am: Competitive" (4 courts, blue)
    - "Monday 12-2pm: PUBLIC" (8 courts, green)
    - "Monday 2-4pm: 3.5+" (4 courts, yellow)
    
    PURPOSE:
    - Display only (not for booking validation!)
    - Helps users understand when courts are available
    - Shows what activities happen at court location
    
    REAL-WORLD USAGE:
    - League organizers create these blocks
    - Helps users see "When can I book for public play?"
    - Shows "When does my club have priority access?"

    **Purpose**: Display court schedule to users (like weekly grid)

    **⚠️ CRITICAL IMPORT NOTE:**
    This model has a ForeignKey to `League`, which creates a **circular import** issue:
    - `leagues/models.py` imports `CourtLocation` from `courts/models.py` (for LeagueSession)
    - `courts/models.py` would normally import `League` from `leagues/models.py` (for CourtScheduleBlock)
    - This creates: `leagues.models` → `courts.models` → `leagues.models` ❌ CIRCULAR!

    **SOLUTION: Use String Reference**
    Instead of importing `League` at the top of the file, we use Django's string reference feature:
    ```python
    # ❌ WRONG - Creates circular import:
        from leagues.models import League
        league = models.ForeignKey(League, ...)

    # ✅ CORRECT - String reference, no import needed:
        league = models.ForeignKey('leagues.League', ...)
    """
    
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.CASCADE,
        related_name='schedule_blocks'
    )
    
    # Time block
    day_of_week = models.IntegerField(
        choices=DayOfWeek,
        help_text='Day of week for this recurring block'
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # What's happening
    block_type = models.IntegerField(
        blank=True,
        null=True,
        choices=BlockType,
        default=BlockType.PUBLIC
    )
    # Access control
    skill_level_min = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        null=True,
        blank=True,
        help_text='Minimum skill level required (e.g., 3.5 for 3.5+ play)'
    )
    skill_level_max = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        null=True,
        blank=True,
        help_text='Maximum skill level allowed (e.g., 4.0 for up to 4.0)'
    )
    
    # Capacity
    max_players = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum number of players allowed in this time block'
    )

    courts_used = models.IntegerField(
        default=1,
        help_text='Numbers of courts assigned for this block'
    )
    background_color = models.CharField(
        blank=True,
        default='#bdc8d0', # var(--lightgrey-80), --var(color-accent2)
        help_text='Color the block should show - default is Accent2'
    )
    text_color = models.CharField(
        blank=True,
        default='#1e2021', # var(--neutral-12), --var(color-on-accent2)
        help_text='Color of the text shown on the block - default is on-Accent2'
    )
    title = models.CharField(
        blank=True,
        help_text='Title of the block'
    )

    # Reservations
    requires_reservation = models.BooleanField(
        default=False,
        help_text='Do users need to reserve a spot?'
    )
    
    # Cost
    cost_per_session = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.00,
        help_text='Cost per person per session (0.00 for free play)'
    )
    
    # Links to leagues/clubs
    league = models.ForeignKey(
        'leagues.League',  # Use string reference to avoid circular import
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='league_schedule_blocks',  # league.league_schedule_blocks.all()
        help_text='Link to league if this is a league block'
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='court_schedule_blocks',
        help_text='Link to club if this is club-specific'
    )
    
    # Active period (for seasonal schedules)
    active_from = models.DateField(
        blank=True,
        null=True,
        help_text='When this schedule block starts (e.g., season start)'
    )
    active_until = models.DateField(
        blank=True,
        null=True,
        help_text='When this schedule block ends (e.g., season end)'
    )
    
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schedule_blocks_created',
        help_text='League organizer or admin who created this'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['court_location', 'day_of_week', 'start_time']
        verbose_name = 'Court Schedule Block'
    
    def __str__(self):
        return (
            f"{self.court_location.name} - {self.get_day_of_week_display()} "
            f"{self.start_time}-{self.end_time}: {self.title}"
        )
    
    def is_currently_active(self):
        """Check if block is active for current date."""
        from datetime import date
        today = date.today()
        
        if not self.is_active:
            return False
        
        if self.active_from and today < self.active_from:
            return False
        
        if self.active_until and today > self.active_until:
            return False
        
        return True

# The CourtLocationSchedule handles the court availability schedule. Using a ForeignKey
# to CourtLocation allows to specify blocked times for each court location

class CourtLocationSchedule(models.Model):

    court_location = models.ForeignKey(
        CourtLocation, 
        on_delete=models.CASCADE, 
        related_name="schedule")
    day_of_week = models.IntegerField(
        choices=DayOfWeek
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    description = models.CharField(
        max_length=200,
        help_text="e.g., 'Courts blocked for Tennis club'."
    )

    def __str__(self):
        return f"{self.location.name} - {self.get_day_of_week_display()}"



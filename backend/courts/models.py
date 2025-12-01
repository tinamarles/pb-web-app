from django.db import models
from public.models import Address
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
        null=True,
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
        null=True,
        help_text='Additional info about the court (e.g., "Outdoor courts, covered")'
    )
    photo = models.URLField(
        max_length=200,
        blank=True,
        null=True,
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

# The CourtLocationSchedule handles the court availability schedule. Using a ForeignKey
# to CourtLocation allows to specify blocked times for each court location

class CourtClubAffiliation(models.Model):
    """
    Links courts to clubs that have priority access.
    
    Examples:
    - Club St. Jérôme has priority access at Parc Optimiste
    - Club St. Jérôme has exclusive block bookings Mondays 8-12pm at Parc La Source
    - Multiple clubs may share access at same location
    """
    
    AFFILIATION_TYPE_CHOICES = [
        ('priority', 'Priority Access'),
        ('exclusive', 'Exclusive Access (certain times)'),
        ('partner', 'Partner Club'),
        ('shared', 'Shared Access'),
    ]
    
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
    affiliation_type = models.CharField(
        max_length=50,
        choices=AFFILIATION_TYPE_CHOICES,
        default='priority'
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
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
    
    BOOKING_TYPE_CHOICES = [
        ('practice', 'Practice Session'),
        ('casual', 'Casual Play'),
        ('lesson', 'Lesson'),
        ('drill', 'Drill Session'),
        ('other', 'Other'),
    ]
    
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
        null=True,
        help_text='Specific court number (if known, e.g., "14", "Court 2", "T5")'
    )
    
    # Time details
    booking_date = models.DateField(help_text='Date of booking')
    start_time = models.TimeField(help_text='Start time')
    end_time = models.TimeField(help_text='End time')
    
    # Booking details
    booking_type = models.CharField(
        max_length=50,
        choices=BOOKING_TYPE_CHOICES,
        default='practice'
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
        null=True,
        help_text='Booking confirmation number from external site (if any)'
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        null=True,
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
    """
    
    BLOCK_TYPE_CHOICES = [
        ('league', 'League'),
        ('competitive', 'Competitive Play'),
        ('recreative', 'Recreative Play'),
        ('skill_restricted', 'Skill Restricted (3.5+, 4.0+, etc.)'),
        ('public', 'Public Open Play'),
        ('drill', 'Drill/Training'),
        ('tournament', 'Tournament'),
        ('blocked', 'Blocked/Reserved'),
        ('maintenance', 'Maintenance/Closed'),
    ]
    
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.CASCADE,
        related_name='schedule_blocks'
    )
    
    # Time block
    day_of_week = models.IntegerField(
        choices=[
            (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
            (4, "Friday"), (5, "Saturday"), (6, "Sunday")
        ],
        help_text='Day of week for this recurring block'
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # What's happening
    block_type = models.CharField(
        max_length=20,
        choices=BLOCK_TYPE_CHOICES
    )
    title = models.CharField(
        max_length=100,
        help_text='e.g., "Groupe Action Pickleball", "Competitive", "PUBLIC", "3.5+"'
    )
    description = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='e.g., "4 terrains", "Tous les membres", "T5-T6-T7-T8"'
    )
    
    # Court allocation
    courts_affected = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Which courts (e.g., "1-4", "5-8", "All", "T5,T6,T7,T8")'
    )
    
    # Display hints
    background_color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Hex color for schedule display (e.g., #FF00FF for magenta)'
    )
    text_color = models.CharField(
        max_length=20,
        default='#FFFFFF',
        help_text='Text color for readability'
    )
    
    # Links
    league = models.ForeignKey(
        'leagues.League',  # ← String reference! Format: 'app_name.ModelName'
        on_delete=models.CASCADE,
        blank=True,
        null=True,
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



# clubs/models.py

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date
from public.models import Address
from public.constants import SkillLevel, RoleType, MembershipStatus, ClubType
from django.contrib.auth import get_user_model

User = get_user_model()

def get_default_start_date():
    return date(date.today().year, 1, 1)

def get_default_end_date():
    return date(date.today().year, 12, 31)

# A new model for roles
class Role(models.Model):
    """
    This model is a system model! The user is not able
    to modify these! These roles determine permissions
    for a variety of frontend functions (eg. admin functions)
    ---
    NOTE: This model will be re-designed to include the club as a FK! This allows for each club to
    set different permissions for each role rather than a unified strict permission setting for each role.
    The admin of each club can then assign different permissions based on a permission matrix.
    While the individual roles remain fixed, the permission setting can be different from club to club.
    ---
    Uses constant RoleType (current):
    - **Admin** - Club administrator (all permissions enabled)
    - **Instructor** - Can create training sessions (can_create_training)
    - **Captain** - Can cancel league sessions for captained leagues (can_cancel_league_sessions)
    - **Organizer** - Can manage leagues and sessions (can_manage_leagues, can_manage_league_sessions)
    - **Member** - Regular Club member

    NOTE: once the club field is implemented a **Member** of club A may be able to manage leagues,
    whereas a **Member** of club B may not!

    **Permission Checking Pattern:**
    ```python
    # Check if user can manage full league (members, matches, stats)
    membership = ClubMembership.objects.get(member=user, club=league.club)
    can_manage = membership.roles.filter(can_manage_leagues=True).exists()

    # Check if user can edit session details
    can_edit_sessions = membership.roles.filter(can_manage_league_sessions=True).exists()

    # Check if user can cancel sessions (explicit OR implicit)
    can_cancel = membership.roles.filter(
        models.Q(can_cancel_league_sessions=True) | 
        models.Q(can_manage_league_sessions=True)
    ).exists() and (
        # Full session management OR captain of this league
        membership.roles.filter(can_manage_league_sessions=True).exists() or
        league.captain == user
    )
    """
    name = models.IntegerField(
        choices=RoleType,
        unique=True,
        help_text='System role name')
    
    description = models.TextField(blank=True)

    # Permission flags (for clean authorization checks)
    can_manage_club = models.BooleanField(
        default=False,
        help_text="Full club administration privileges"
    )
    can_manage_members = models.BooleanField(
        default=False,
        help_text="Can add/remove/modify club members"
    )
    can_create_training = models.BooleanField(
        default=False,
        help_text="Can create and manage training sessions"
    )
    # League permissions (3-level hierarchy with implicit inheritance)
    can_manage_leagues = models.BooleanField(
        default=False,
        help_text="Can manage league members, create matches, view stats, edit league settings"
    )
    can_manage_league_sessions = models.BooleanField(
        default=False,
        help_text="Can create/modify session details (location, day, time, courts). Implies can_cancel_league_sessions."
    )
    can_cancel_league_sessions = models.BooleanField(
        default=False,
        help_text="Can cancel/reinstate sessions only. Automatically true if can_manage_league_sessions=True."
    )
    can_manage_courts = models.BooleanField(
        default=False,
        help_text="Can manage court bookings and availability"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return self.get_name_display()
    
# Model for ClubMembership Types: eg. Resident, Non-Resident
class ClubMembershipType(models.Model):
    """
    1. Relationships
    club.membership_types.all() -> all membership types for this club
    type.memberships.all() -> all ClubMemberships with this type

    2. Computed Properties
    current_member_count: count of active members with this type
    is_at_capacity: check if type has reached capacity limit
    is_registration_open: check if registration is open (dates + capacity)

    3. Validation rules:
    unique_together = ['club', 'name']: no duplicate type names per club
    if max_capacity is set, it must be > 0
    if max_capacity_percentage is set, must be between 0.01-100.00
    Cannot have BOTH: max_capacity AND max_capacity_percentage
    If registration_close_date is set, must be > registration_open_date
    annual_fee must be >= 0 (free is 0.00, not null)
    """
    # Required
    club = models.ForeignKey(
        'Club',
        on_delete=models.CASCADE,
        related_name='membership_types',
        help_text="Club this membership type belongs to"
    )
    name = models.CharField(
        max_length=50,
        help_text="Type name (e.g., Resident, Non-Resident, Junior)"
        )
    
    # Optional
    description = models.TextField(blank=True)
   
    # Registration settings
    requires_approval = models.BooleanField(
        default=False,
        help_text="Does this type require admin approval?"
    )
    registration_open_date = models.DateField(
        null=True,
        blank=True,
        help_text="When does registration open for this type?"
    )
    registration_close_date = models.DateField(
        null=True,
        blank=True,
        help_text="When does registration close for this type?"
    )
    
    # Capacity settings
    max_capacity = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of members for this type (null = unlimited)"
    )
    max_capacity_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Max % of total club members (e.g., 30.00 for 30%)"
    )
    
    # Fee settings (future - not implementing payments yet!)
    annual_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Annual membership fee (0.00 for free types like Junior)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['club', 'name']
        ordering = ['club', 'name']
        verbose_name = 'Club Membership Type'
        verbose_name_plural = 'Club Membership Types'
    
    def __str__(self):
        return f"{self.club.name} - {self.name}"
    
    @property
    def current_member_count(self):
        """Count of active members with this type"""
        return self.memberships.filter(
            status=2  # ACCEPTED status
        ).count()
    
    @property
    def is_at_capacity(self):
        """Check if this type has reached max capacity"""
        if self.max_capacity:
            return self.current_member_count >= self.max_capacity
        
        if self.max_capacity_percentage:
            total_members = self.club.club_memberships.filter(
                status=2  # ACCEPTED status
            ).count()
            max_allowed = int((self.max_capacity_percentage / 100) * total_members)
            return self.current_member_count >= max_allowed
        
        return False
    
    @property
    def is_registration_open(self):
        """Check if registration is currently open for this type"""
        today = timezone.now().date()
        
        # Check opening date
        if self.registration_open_date and today < self.registration_open_date:
            return False
        
        # Check closing date
        if self.registration_close_date and today > self.registration_close_date:
            return False
        
        # Check capacity
        if self.is_at_capacity:
            return False
        
        return True

# Model to define the Player Level based on assessment (not self-rating)
# Example: Group 3.5+, Group 4.0, Action League, not assessed
class ClubMembershipSkillLevel(models.Model):
    level = models.IntegerField(
        choices=SkillLevel,
        unique=True,
        help_text='Skill level designation'
        )
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['level']
        verbose_name = 'Club Membership Skill Level'
        verbose_name_plural = 'Club Membership Skill Levels'
    
    def __str__(self):
        return self.get_level_display()

# Club model
class Club(models.Model):
    """ Related Names for Club
    club.members.all() -> All User objects who are members
    club.club_memberships.all() -> All ClubMembership records
    club.leagues.all() -> All leagues run by this club (via leagues Module)
    club.court_affiliations.all() -> All court affiliations (via courts module)
    club.membership_types.all() -> All membership types for the club

    """
    # Required fields
    club_type = models.IntegerField(
        choices=ClubType,
        default=ClubType.OFFICIAL
        )
    
    name = models.CharField(max_length=255)
    
    # Optional fields
    short_name = models.CharField(max_length=20,blank=True)
    description = models.TextField(blank=True)
    
    # Contact info
    address = models.ForeignKey(
        Address, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='club_location')
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True) 
    website_url = models.URLField(max_length=200, blank=True)
    logo_url = models.URLField(max_length=200, blank=True)
    banner_url = models.URLField(max_length=200, blank=True)
    
    # Many-to-Many to User through ClubMembership
    members = models.ManyToManyField(
        User, through='ClubMembership', 
        related_name='clubs_as_member')
    
    autoapproval = models.BooleanField(
        default=False,
        help_text="If False, join requests require explicit admin approval. If True, users are auto-approved.")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Club'
        verbose_name_plural = 'Clubs'
    
    def __str__(self):
        return self.short_name if self.short_name else self.name

# Through-table for User and Club (ClubMembership)
class ClubMembership(models.Model):
    # constant MembershipStatus

    # pending
    # accepted
    # rejected
    # cancelled
    # blocked

    member = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='club_memberships') # user.club_memberships.all()
    
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='club_memberships') # club.club_memberships.all()
    
    type = models.ForeignKey(
        ClubMembershipType, 
        on_delete=models.PROTECT, 
        related_name='memberships')
    
    # Multi-role support: User can have multiple roles in a club
    # NOTE: ManyToManyField DOES NOT support on_delete! This is only
    # for ForeignKey and OneToOneField.
    roles = models.ManyToManyField(
        Role, 
        related_name='club_memberships_with_role',
        blank=True)
    
    levels = models.ManyToManyField(
        ClubMembershipSkillLevel, 
        related_name='club_memberships_at_level',
        blank=True)
    
    membership_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    status= models.IntegerField(
        choices=MembershipStatus, 
        default=MembershipStatus.ACTIVE, 
        )
    
    is_preferred_club = models.BooleanField(default=False)
    
    # Registration dates
    registration_start_date = models.DateField(
        default=get_default_start_date,
        blank=True, 
        null=True)
    registration_end_date = models.DateField(
        default=get_default_end_date,
        blank=True, 
        null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['member', 'club']]
        ordering = ['-is_preferred_club', 'club__name']
        verbose_name = 'Club Membership'
        verbose_name_plural = 'Club Memberships'
        indexes = [
            models.Index(fields=['member', 'status']),
            models.Index(fields=['club', 'status']),
            models.Index(fields=['is_preferred_club']),
        ]
    
    def __str__(self):
        return f"{self.member.username} - {self.club.name} ({self.get_status_display()})"
    
    def clean(self):
        """Validate that membership type belongs to the same club"""
        super().clean()
        if self.type and self.club and self.type.club != self.club:
            raise ValidationError({
                'type': f'Membership type "{self.type.name}" does not belong to {self.club.name}.'
            })
    
    def save(self, *args, **kwargs):
        """Ensure validation + only one preferred club per user"""
        # 🎯 VALIDATE FIRST - This calls clean() above
        self.full_clean()
        
        # Your existing logic
        if self.is_preferred_club:
            # Unset any other preferred clubs for this user
            ClubMembership.objects.filter(
                member=self.member,
                is_preferred_club=True
            ).exclude(pk=self.pk).update(is_preferred_club=False)
        
        # save first as we need pk for the M2M relationship for roles
        is_new = self.pk is None    
        super().save(*args, **kwargs)

        # Auto-assign RoleType.MEMBER if no roles exist (new Membership)
        if is_new and not self.roles.exists():
            self.roles.add(Role.objects.get(name=RoleType.MEMBER))

    @property
    def can_manage_club(self) -> bool:
        return self.roles.filter(can_manage_club=True).exists()
    
    @property
    def can_manage_members(self) -> bool:
        return self.roles.filter(can_manage_members=True).exists()
    
    @property
    def can_create_training(self) -> bool:
        return self.roles.filter(can_create_training=True).exists()
    
    @property
    def can_manage_leagues(self) -> bool:
        return self.roles.filter(can_manage_leagues=True).exists()
    
    @property
    def can_manage_league_sessions(self) -> bool:
        return self.roles.filter(can_manage_league_sessions=True).exists()
    
    @property
    def can_cancel_league_sessions(self) -> bool:
        return self.roles.filter(can_cancel_league_sessions=True).exists()
    
    @property
    def can_manage_courts(self) -> bool:
        return self.roles.filter(can_manage_courts=True).exists()

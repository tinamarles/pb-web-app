# clubs/models.py

from django.db import models
from datetime import date
from public.models import Address
from django.contrib.auth import get_user_model

User = get_user_model()

def get_default_start_date():
    return date(date.today().year, 1, 1)

def get_default_end_date():
    return date(date.today().year, 12, 31)

# A new model for roles
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name
    
# Model for ClubMembership Types: eg. Resident, Non-Resident
class ClubMembershipType(models.Model):
    type = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.type
# Model to define the Player Level based on assessment (not self-rating)
# Example: Group 3.5+, Group 4.0, Action League, not assessed
class ClubMembershipSkillLevel(models.Model):
    level = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.level

# Club model
class Club(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    members = models.ManyToManyField(User, through='ClubMembership', related_name='clubs_as_member')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='club_location')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True) 
    website_url = models.URLField(max_length=200, blank=True, null=True)
    logo_url = models.URLField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# Through-table for User and Club (ClubMembership)
class ClubMembership(models.Model):
    member = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='club_memberships') # Changed on_delete to SET_NULL for safety
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='club_memberships')
    roles = models.ManyToManyField(Role, related_name='club_memberships_with_role')
    membership_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    is_preferred_club = models.BooleanField(default=False)
    registration_start_date = models.DateField(default=get_default_start_date)
    registration_end_date = models.DateField(default=get_default_end_date)
    # Link to ClubMemberShip Type and if a Type is deleted, then set all associated
    # ClubMemberships with that Type to type = null
    type = models.ForeignKey(ClubMembershipType, on_delete=models.SET_NULL, null=True)
    level = models.ManyToManyField(ClubMembershipSkillLevel, related_name='club_memberships_with_level')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('member', 'club')

    def __str__(self):
        return f"{self.user.username} - {self.club.name}"
    

# members/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager
from public.constants import Gender

# Member profile linked one-to-one with a User.
# The user field can be NULL to support members without a user account.
class CustomUser(AbstractUser):

    email = models.EmailField(unique=True)

    skill_level = models.DecimalField(max_digits=2, decimal_places=1,default=2.5, null=True)
    profile_picture_url = models.URLField(max_length=200, blank=True)
    is_coach = models.BooleanField(default=False) # Global coach role
    home_phone = models.CharField(max_length=20, blank=True)
    mobile_phone = models.CharField(max_length=20, blank=True)
    work_phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(
        max_length=100, 
        blank=True,
        help_text='City/Region where user lives')
    dob = models.DateField(null=True, blank=True)
    gender = models.IntegerField(
        choices=Gender, 
        default=Gender.UNSPECIFIED)
    bio = models.TextField(blank=True)
    # ⚠️ TODO Fields (Not Yet Implemented):
    # App settings - PLACEHOLDER ONLY
    # theme_preference = models.CharField(
    #     max_length=20,
    #     default='light',
    #     choices=[
    #         ('light', 'Light'),
    #         ('dark', 'Dark'),
    #         ,
    #     ]
    # )
    
    # ⚠️ TODO Fields (Not Yet Implemented):
    # Notification counts - PLACEHOLDER ONLY
    # unread_notifications = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # Link custom manager
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} {self.first_name} {self.last_name}"
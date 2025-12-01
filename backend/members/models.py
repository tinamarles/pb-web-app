# members/models.py

from django.db import models
# from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

User = get_user_model()

# Member profile linked one-to-one with a User.
# The user field can be NULL to support members without a user account.
# THIS MODEL IS OBSOLETE -> WE ARE USING CustomUser!

class Member(models.Model):

    class Gender(models.IntegerChoices):
        FEMALE = 1, "Female"
        MALE = 2, "Male"
        UNSPECIFIED = 3, "Unspecified"
    
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL, # Safely preserves member data if user is deleted
        null=True,
        blank=True,
        related_name='member_profile' # Added related_name
    )
    
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True) # Used for account claims
    skill_level = models.DecimalField(max_digits=2, decimal_places=1,default=2.5, null=True)
    profile_picture_url = models.URLField(max_length=200, blank=True, null=True)
    is_coach = models.BooleanField(default=False) # Global coach role
    home_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    work_phone = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.IntegerField(choices=Gender, default=Gender.UNSPECIFIED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
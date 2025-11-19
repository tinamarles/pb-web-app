# members/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager

# Member profile linked one-to-one with a User.
# The user field can be NULL to support members without a user account.
class CustomUser(AbstractUser):

    class Gender(models.IntegerChoices):
        FEMALE = 1, "Female"
        MALE = 2, "Male"
        UNSPECIFIED = 3, "Unspecified"
   
    email = models.EmailField(unique=True)

    skill_level = models.DecimalField(max_digits=2, decimal_places=1,default=2.5, null=True)
    profile_picture_url = models.URLField(max_length=200, blank=True, null=True)
    is_coach = models.BooleanField(default=False) # Global coach role
    home_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    work_phone = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.IntegerField(choices=Gender, default=Gender.UNSPECIFIED)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # Link custom manager
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} {self.first_name} {self.last_name}"
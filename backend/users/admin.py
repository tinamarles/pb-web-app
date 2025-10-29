# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    # This will determine which fields are shown on the list page
    list_display = (
        'email', 
        'username', 
        'first_name', 
        'last_name', 
        'is_staff', 
        'is_coach' 
    )

    # This will add the phone_number field to the 'Personal info' fieldset.
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('mobile_phone', 'home_phone', 'work_phone', 'skill_level', 'dob', 'gender','is_coach')}),
    )

    # The search_fields will allow you to search for users
    search_fields = ('email', 'first_name', 'last_name')

    # This will enable filtering by 'first name', 'last name', and 'is_coach'
    list_filter = ('is_coach', 'first_name', 'last_name')

admin.site.register(CustomUser, CustomUserAdmin)
# Register your models here.

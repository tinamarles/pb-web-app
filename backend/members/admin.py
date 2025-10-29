from django.contrib import admin
from .models import Member
# Register your models here.
'''
@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    # This controls which fields are displayed on the list page
    list_display = ('first_name', 'last_name', 'skill_level', 'created_at')

    # This creates filters on the right side of the list page
    list_filter = ('first_name', 'skill_level')

    # This creates a search bar that searches these fields
    search_fields = ('first_name', 'last_name')
'''

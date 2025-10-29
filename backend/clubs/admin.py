from django.contrib import admin
from .models import ClubMembershipSkillLevel, ClubMembershipType, Role

# Register your models here.
admin.site.register(ClubMembershipSkillLevel)
admin.site.register(ClubMembershipType)
admin.site.register(Role)
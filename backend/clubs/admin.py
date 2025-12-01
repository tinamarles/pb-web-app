from django.contrib import admin
from .models import ClubMembershipSkillLevel, ClubMembershipType, Role, Club, ClubMembership

# Register your models here.
admin.site.register(ClubMembershipSkillLevel)
admin.site.register(ClubMembershipType)
admin.site.register(Role)
admin.site.register(Club)
admin.site.register(ClubMembership)
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
        (None, {'fields': ('mobile_phone', 'home_phone', 'work_phone', 'location', 'skill_level', 'dob', 'gender','is_coach','profile_picture_url', 'bio')}),
    )

    # The search_fields will allow you to search for users
    search_fields = ('email', 'first_name', 'last_name')

    # This will enable filtering by 'first name', 'last name', and 'is_coach'
    list_filter = ('is_coach', 'first_name', 'last_name')

    def get_search_results(self, request, queryset, search_term):
        """Filter autocomplete by club when editing a League"""
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        
        referer = request.META.get('HTTP_REFERER', '')
        if '/admin/leagues/league/' in referer and '/change/' in referer:
            try:
                parts = referer.split('/admin/leagues/league/')[1]
                league_id = parts.split('/')[0]
                
                if league_id.isdigit():
                    from leagues.models import League
                    from public.constants import MembershipStatus
                    
                    league = League.objects.get(pk=league_id)
                    queryset = queryset.filter(
                        club_memberships__club=league.club,
                        club_memberships__status=MembershipStatus.ACTIVE
                    ).distinct()
            except (ValueError, IndexError, League.DoesNotExist):
                pass
        
        return queryset, use_distinct

admin.site.register(CustomUser, CustomUserAdmin)
# Register your models here.

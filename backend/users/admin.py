# users/admin.py
from django.contrib import admin
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import path
from django.core.management import call_command
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

    '''
    Added to allow uploading users via admin panel
    path('load-users/', self.admin_site.admin_view(self.load_users_view), name='load_user_data'),
    '''
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-users/', self.admin_site.admin_view(self.load_users_view), name='load_users'),
        ]
        return custom_urls + urls
    
    def load_users_view(self, request):
        # Load users from JSON fixture
        dry_run = request.GET.get('dry_run') == 'true'

        try:
            if dry_run:
                messages.warning(request, '🧪 DRY RUN: Would load users.json (check file exists)')
            else:
                # call_command('loaddata', 'data/production/users.json')
                call_command('loaddata', 'data/test/test_users.json')
                messages.success(request,'✅ Users loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')

        return redirect('..')
    
admin.site.register(CustomUser, CustomUserAdmin)
# Register your models here.

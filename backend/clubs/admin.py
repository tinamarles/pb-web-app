# === ADMIN.PY FOR CLUBS MODULE ===
# Date: 2025-12-07
# Comprehensive Django admin configuration for clubs module
# ==========================================

from django.contrib import admin
from django.utils.html import format_html
from django import forms
from django.db import models
from django.contrib import messages
from django.shortcuts import redirect  # ✅ ADD THIS!
from django.urls import path  # ✅ ADD THIS!
from django.core.management import call_command  # ✅ ADD THIS!

from .models import (
    Club,
    ClubMembership,
    ClubMembershipType,
    ClubMembershipSkillLevel,
    Role
)

# ==========================================
# ADMIN FORMS
# ==========================================

class BulkUpdateLevelForm(forms.Form):
    """Form for bulk updating skill levels on ClubMemberships"""
    skill_level = forms.ModelChoiceField(
        queryset=ClubMembershipSkillLevel.objects.all().order_by('level'),
        required=True,
        label='Skill Level',
        help_text='Select the skill level to assign to selected memberships'
    )
    action_type = forms.ChoiceField(
        choices=[
            ('replace', 'Replace all existing levels'),
            ('add', 'Add to existing levels (keep current levels)'),
        ],
        initial='replace',
        required=True,
        widget=forms.RadioSelect,
        label='Action Type'
    )

# ==========================================
# INLINES
# ==========================================

class ClubMembershipInline(admin.StackedInline):  # ← Changed to Stacked
    """Display club memberships inline on Club admin"""
    model = ClubMembership
    extra = 1
    classes = ('collapse',)
    
    fieldsets = (
        ('Member Info', {
            'fields': (
                ('member', 'type'),
                ('status', 'is_preferred_club', 'membership_number'),
            )
        }),
        ('Roles & Levels', {
            'fields': ('roles', 'levels')
        }),
        ('Registration Period', {
            'fields': (('registration_start_date', 'registration_end_date'),)
        }),
    )
    autocomplete_fields = ['member']
    filter_horizontal = ('roles', 'levels')  # ← Nicer M2M widget!

class ClubMembershipTypeInline(admin.StackedInline):  # ← Changed to StackedInline
    """Display membership types inline on Club admin"""
    model = ClubMembershipType
    extra = 0
    classes = ('collapse',)  # Makes it collapsible to save space
    
    fieldsets = (
        (None, {
            'fields': (
                ('name', 'requires_approval'),
                ('annual_fee', 'max_capacity'),
                ('registration_open_date', 'registration_close_date', 'registration_status'),
                'description',  # ← Full width on its own line
            )
        }),
    )
    readonly_fields = ('registration_status',)
    
    formfield_overrides = {
        models.TextField: {'widget': forms.Textarea(attrs={'rows': 2, 'style': 'width: 100%; resize: vertical;'})},
    }
    
    def registration_status(self, obj):
        """Show if registration is open"""
        if obj.pk:
            if obj.is_registration_open:
                return format_html('<span style="color: green;">✓ Open</span>')
            return format_html('<span style="color: red;">✗ Closed</span>')
        return '-'
    registration_status.short_description = 'Status'

# ==========================================
# CLUB ADMIN
# ==========================================

@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = (
        'name_display',
        'short_name',
        'club_type_display',  # ✅ NEW!
        'member_count',
        'autoapproval_display',
        'has_contact',
        'created_at'
    )
    list_filter = (
        'club_type',  # ✅ NEW!
        'autoapproval',
        'created_at'
    )
    search_fields = (
        'name',
        'short_name',
        'description',
        'email',
        'address__city'
    )
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'member_count')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('club_type', 'name', 'short_name', 'description')  # ✅ Added club_type
        }),
        ('Location', {
            'fields': ('address',)
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email', 'website_url'),
            'classes': ('collapse',)
        }),
        ('Branding', {
            'fields': ('logo_url', 'banner_url'),  # ✅ Added banner_url
            'classes': ('collapse',)
        }),
        ('Membership Settings', {
            'fields': ('autoapproval',)
        }),
        ('Statistics', {
            'fields': ('member_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ClubMembershipTypeInline, ClubMembershipInline]
    
    def name_display(self, obj):
        """Display name with logo if available"""
        if obj.logo_url:
            return format_html(
                '<img src="{}" style="height: 20px; margin-right: 5px; vertical-align: middle;"/> {}',
                obj.logo_url,
                obj.name
            )
        return obj.name
    name_display.short_description = 'Name'
    
    # ✅ NEW METHOD!
    def club_type_display(self, obj):
        """Visual indicator for club type"""
        if obj.club_type == 1:  # PERSONAL
            return format_html('<span style="color: purple;">👤 Personal</span>')
        else:  # OFFICIAL (2)
            return format_html('<span style="color: blue;">🏢 Official</span>')
    club_type_display.short_description = 'Type'
    
    def member_count(self, obj):
        """Count active members"""
        count = obj.club_memberships.filter(status=2).count()  # ACTIVE status
        return count
    member_count.short_description = 'Active Members'
    
    def autoapproval_display(self, obj):
        """Visual indicator for autoapproval"""
        if obj.autoapproval:
            return format_html('<span style="color: green;">✓ Auto</span>')
        return format_html('<span style="color: orange;">⚠ Manual</span>')
    autoapproval_display.short_description = 'Approval'
    
    def has_contact(self, obj):
        """Check if club has contact info"""
        has_info = bool(obj.email or obj.phone_number or obj.website_url)
        return '✓' if has_info else '-'
    has_contact.short_description = 'Contact Info'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-clubs/', 
                 self.admin_site.admin_view(self.load_clubs_view), 
                 name='load_clubs'),
        ]
        return custom_urls + urls
    
    def load_clubs_view(self, request):
        try:
            call_command('loaddata', 'data/production/clubs.json')
            # call_command('loaddata', 'data/test/test_clubs.json')
            messages.success(request, '✅ Clubs loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')
        return redirect('..')

# ==========================================
# CLUB MEMBERSHIP ADMIN
# ==========================================

class RoleFilter(admin.SimpleListFilter):
    """Custom filter to filter ClubMemberships by Role"""
    title = 'role'  # Display name in filter sidebar
    parameter_name = 'role'  # URL parameter name
    
    def lookups(self, request, model_admin):
        """Return list of roles to filter by"""
        from public.constants import RoleType
        
        # Get all roles that exist in database
        roles = Role.objects.all().order_by('name')
        return [(role.id, role.get_name_display()) for role in roles]
    
    def queryset(self, request, queryset):
        """Filter queryset based on selected role"""
        if self.value():
            # Filter memberships that have this role
            return queryset.filter(roles__id=self.value())
        return queryset
    
class LevelFilter(admin.SimpleListFilter):
    """Custom filter to filter ClubMemberships by Skill Level"""
    title = 'skill level'  # Display name in filter sidebar
    parameter_name = 'skill_level'  # URL parameter name
    
    def lookups(self, request, model_admin):
        """Return list of skill levels to filter by"""
        levels = ClubMembershipSkillLevel.objects.all().order_by('level')
        options = [(l.id, f"{l.level} - {l.short_name}") for l in levels]
        # Add option to filter by empty/no level
        options.append(('none', 'No Level Assigned'))
        return options
    
    def queryset(self, request, queryset):
        """Filter queryset based on selected skill level"""
        if self.value() == 'none':
            # Filter memberships with NO skill level assigned
            return queryset.filter(levels__isnull=True)
        elif self.value():
            # Filter memberships that have this skill level
            return queryset.filter(levels__id=self.value())
        return queryset

class MembershipTypeFilter(admin.SimpleListFilter):
    """Custom filter to filter ClubMemberships by Type"""
    title = 'membership type'  # Display name in filter sidebar
    parameter_name = 'membership_type'  # URL parameter name
    
    def lookups(self, request, model_admin):
        """Return list of membership types to filter by"""
        # Get all membership types, grouped by club for clarity
        types = ClubMembershipType.objects.all().select_related('club').order_by('club__name', 'name')
        return [(t.id, f"{t.club.short_name or t.club.name} - {t.name}") for t in types]
    
    def queryset(self, request, queryset):
        """Filter queryset based on selected membership type"""
        if self.value():
            # Filter memberships that have this type
            return queryset.filter(type__id=self.value())
        return queryset

@admin.register(ClubMembership)
class ClubMembershipAdmin(admin.ModelAdmin):
    list_display = (
        'member_display',
        'club',
        'type_name',
        'status_display',
        'role_list',
        'level_list',
        'is_preferred_club',
        'created_at'
    )
    list_filter = (
        'status',
        'is_preferred_club',
        MembershipTypeFilter,  # ← ADD THIS!
        'club',
        RoleFilter,  # ← Already there!
        LevelFilter,  # ← Already there!
        'created_at'
    )
    search_fields = (
        'member__username',
        'member__first_name',
        'member__last_name',
        'member__email',
        'club__name',
        'membership_number'
    )
    #ordering = ('-created_at',)
    ordering = ('member__last_name', 'member__first_name', 'club__name')  # More intuitive default ordering
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('member',)
    filter_horizontal = ('roles', 'levels')
    actions = ['bulk_update_skill_level']  # ← Register the action!
    
    fieldsets = (
        ('Member Details', {
            'fields': ('member', 'club', 'type')
        }),
        ('Roles & Skill Levels', {
            'fields': ('roles', 'levels')
        }),
        ('Membership Info', {
            'fields': ('membership_number', 'status', 'is_preferred_club')
        }),
        ('Registration Period', {
            'fields': ('registration_start_date', 'registration_end_date'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def bulk_update_skill_level(self, request, queryset):
        """
        Admin action to bulk update skill levels for selected memberships.
        Shows an intermediate form to select the skill level and action type.
        """
        from django.shortcuts import render
        from django.http import HttpResponseRedirect
        
        # If form has been submitted from the intermediate page
        if 'apply' in request.POST:
            form = BulkUpdateLevelForm(request.POST)
            
            if form.is_valid():
                skill_level = form.cleaned_data['skill_level']
                action_type = form.cleaned_data['action_type']
                
                # Get the membership IDs from the hidden fields
                membership_ids = request.POST.getlist('_selected_action')
                
                if not membership_ids:
                    self.message_user(
                        request,
                        'No memberships were selected.',
                        messages.ERROR
                    )
                    return HttpResponseRedirect(request.get_full_path())
                
                # Fetch the memberships
                memberships = self.model.objects.filter(pk__in=membership_ids)
                
                updated_count = 0
                for membership in memberships:
                    if action_type == 'replace':
                        # Clear all existing levels and set new one
                        membership.levels.clear()
                        membership.levels.add(skill_level)
                    else:  # 'add'
                        # Add to existing levels (if not already present)
                        membership.levels.add(skill_level)
                    updated_count += 1
                
                # Success message
                self.message_user(
                    request,
                    f'Successfully updated skill level for {updated_count} membership(s) to "{skill_level}".',
                    messages.SUCCESS
                )
                
                # Return None to return to the changelist
                return None
        
        # Show the intermediate form (first time)
        form = BulkUpdateLevelForm()
        
        context = {
            'form': form,
            'memberships': queryset,
            'action_name': 'bulk_update_skill_level',  # ← Important!
            'opts': self.model._meta,
            'title': 'Bulk Update Skill Level',
            'queryset': queryset,
            'action_checkbox_name': admin.helpers.ACTION_CHECKBOX_NAME,
        }
        
        return render(request, 'admin/bulk_update_skill_level.html', context)
    
    bulk_update_skill_level.short_description = 'Update skill level for selected memberships'
    
    def member_display(self, obj):
        """Display member with full name"""
        full_name = obj.member.get_full_name()
        if full_name:
            return f"{full_name}"
        return obj.member.username
    member_display.short_description = 'Member'
    
    def status_display(self, obj):
        """Colored status display"""
        colors = {
            1: 'orange',   # PENDING
            2: 'green',    # ACTIVE
            3: 'red',      # SUSPENDED
            4: 'gray',     # CANCELLED
            5: 'darkred',  # BLOCKED
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def role_list(self, obj):
        """Display all roles"""
        roles = obj.roles.all()
        if roles:
            return ', '.join([role.get_name_display() for role in roles])
        return '-'
    role_list.short_description = 'Roles'
    
    def level_list(self, obj):
        """Display all skill levels"""
        levels = obj.levels.all()
        if levels:
            return ', '.join([str(level) for level in levels])
        return '-'
    level_list.short_description = 'Skill Levels'

    def type_name(self, obj):
        """Display the name of the membership type"""
        return obj.type.name if obj.type else '-'
    type_name.short_description = 'Type'

    # ✅ ADD LOAD BUTTON FOR CLUB MEMBERSHIPS!
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-club-memberships/', self.admin_site.admin_view(self.load_club_memberships_view), name='load_club_memberships'),
        ]
        return custom_urls + urls
    
    def load_club_memberships_view(self, request):
        """Load club memberships from JSON fixture"""
        dry_run = request.GET.get('dry_run') == 'true'
        
        try:
            if dry_run:
                messages.warning(request, '🧪 DRY RUN: Would load club_memberships.json')
            else:
                call_command('loaddata', 'data/production/club_memberships.json')
                # call_command('loaddata', 'data/test/test_club_memberships.json')
                messages.success(request, '✅ Club Memberships loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')
        
        return redirect('..')
# ==========================================
# CLUB MEMBERSHIP TYPE ADMIN
# ==========================================

@admin.register(ClubMembershipType)
class ClubMembershipTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'club',
        'annual_fee',
        'current_member_count',
        'capacity_status',
        'registration_status_display',
        'requires_approval'
    )
    list_filter = (
        'club',
        'requires_approval',
        'registration_open_date',
        'registration_close_date'
    )
    search_fields = (
        'name',
        'club__name',
        'description'
    )
    ordering = ('club__name', 'name')
    readonly_fields = ('created_at', 'updated_at', 'current_member_count', 'capacity_status')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('club', 'name', 'description')
        }),
        ('Registration Settings', {
            'fields': (
                'requires_approval',
                'registration_open_date',
                'registration_close_date'
            )
        }),
        ('Capacity Limits', {
            'fields': ('max_capacity', 'max_capacity_percentage'),
            'description': 'Set either max_capacity OR max_capacity_percentage, not both!'
        }),
        ('Financial', {
            'fields': ('annual_fee',)
        }),
        ('Statistics', {
            'fields': ('current_member_count', 'capacity_status'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def current_member_count(self, obj):
        """Display current member count"""
        if obj.pk:
            return obj.current_member_count
        return 0
    current_member_count.short_description = 'Current Members'
    
    def capacity_status(self, obj):
        """Visual capacity indicator"""
        if obj.pk:
            if obj.is_at_capacity:
                return format_html('<span style="color: red; font-weight: bold;">✗ AT CAPACITY</span>')
            
            count = obj.current_member_count
            if obj.max_capacity:
                percentage = (count / obj.max_capacity) * 100
                if percentage >= 90:
                    return format_html('<span style="color: orange;">⚠ {}% full ({}/{})</span>', 
                                     int(percentage), count, obj.max_capacity)
                return format_html('<span style="color: green;">✓ {}/{}</span>', 
                                 count, obj.max_capacity)
            
            return format_html('<span style="color: green;">✓ No limit</span>')
        return '-'
    capacity_status.short_description = 'Capacity'
    
    def registration_status_display(self, obj):
        """Show if registration is open"""
        if obj.pk:
            if obj.is_registration_open:
                return format_html('<span style="color: green; font-weight: bold;">✓ OPEN</span>')
            return format_html('<span style="color: red;">✗ Closed</span>')
        return '-'
    registration_status_display.short_description = 'Registration'

    # ✅ ADD LOAD BUTTON FOR CLUB MEMBERSHIP TYPES!
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-club-membership-types/', 
                 self.admin_site.admin_view(self.load_club_membership_types_view), 
                 name='load_club_membership_types'),
        ]
        return custom_urls + urls
    
    def load_club_membership_types_view(self, request):
        """Load club membership types from JSON fixture"""
        try:
            call_command('loaddata', 'data/production/club_membership_types.json')
            # call_command('loaddata', 'data/test/test_club_membership_types.json')
            messages.success(request, '✅ Club Membership Types loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')
        return redirect('..')

# ==========================================
# CLUB MEMBERSHIP SKILL LEVEL ADMIN
# ==========================================

@admin.register(ClubMembershipSkillLevel)
class ClubMembershipSkillLevelAdmin(admin.ModelAdmin):
    list_display = (
        'level',
        'description_short',
        'short_name',
        'min_level',
        'max_level',
        'member_count',
        'created_at'
    )
    search_fields = (
        'level',
        'description'
    )
    ordering = ('level',)
    readonly_fields = ('created_at', 'updated_at', 'member_count')
    
    fieldsets = (
        ('Skill Level', {
            'fields': ('level', 'short_name', 'description', 'min_level', 'max_level')
        }),
        ('Statistics', {
            'fields': ('member_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def description_short(self, obj):
        """Truncated description"""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Description'
    
    def member_count(self, obj):
        """Count members at this level"""
        if obj.pk:
            return obj.club_memberships_at_level.count()
        return 0
    member_count.short_description = 'Members at Level'

    # ✅ ADD LOAD BUTTON FOR SKILL LEVELS!
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-skill-levels/', 
                 self.admin_site.admin_view(self.load_skill_levels_view), 
                 name='load_skill_levels'),
        ]
        return custom_urls + urls
    
    def load_skill_levels_view(self, request):
        """Load skill levels from JSON fixture"""
        try:
            call_command('loaddata', 'data/production/skill_levels.json')
            # call_command('loaddata', 'data/test/test_skill_levels.json')
            messages.success(request, '✅ Skill Levels loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')
        return redirect('..')

# ==========================================
# ROLE ADMIN
# ==========================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        'club',
        'name_display',
        'permission_summary',
        'membership_count',
        'created_at'
    )
    list_filter = (
        'club',
        'name',
        'can_manage_club',
        'can_manage_members',
        'can_manage_leagues',
        'can_create_training'
    )
    search_fields = (
        'club__name',
        'club__short_name',
        'description',
    )
    ordering = ('club', 'name',)
    readonly_fields = ('created_at', 'updated_at', 'membership_count')
    
    fieldsets = (
        ('Role Information', {
            'fields': ('club', 'name', 'description')
        }),
        ('Club Permissions', {
            'fields': (
                'can_manage_club',
                'can_manage_members',
                'can_create_training'
            )
        }),
        ('League Permissions', {
            'fields': (
                'can_manage_leagues',
                'can_manage_league_sessions',
                'can_cancel_league_sessions'
            ),
            'description': 'Note: can_manage_league_sessions implies can_cancel_league_sessions'
        }),
        ('Court Permissions', {
            'fields': ('can_manage_courts',)
        }),
        ('Statistics', {
            'fields': ('membership_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def club_display(self, obj):
        """Display club name (with short name if available)"""
        if obj.club.short_name:
            return f"{obj.club.short_name}"
        return obj.club.name
    club_display.short_description = 'Club'
    
    def name_display(self, obj):
        """Display role name with icon"""
        icons = {
            1: '👤',  # MEMBER
            2: '⚡',  # ADMIN
            3: '🎓',  # INSTRUCTOR
            4: '🎯',  # CAPTAIN
            5: '📋',  # ORGANIZER
            6: '🏆',  # COACH
        }
        icon = icons.get(obj.name, '•')
        return f"{icon} {obj.get_name_display()}"
    name_display.short_description = 'Role'
    
    def permission_summary(self, obj):
        """Quick permission summary"""
        perms = []
        if obj.can_manage_club:
            perms.append('Club')
        if obj.can_manage_members:
            perms.append('Members')
        if obj.can_manage_leagues:
            perms.append('Leagues')
        if obj.can_create_training:
            perms.append('Training')
        if obj.can_manage_courts:
            perms.append('Courts')
        
        if perms:
            return ', '.join(perms)
        return '-'
    permission_summary.short_description = 'Permissions'
    
    def membership_count(self, obj):
        """Count how many memberships have this role"""
        if obj.pk:
            return obj.club_memberships_with_role.count()
        return 0
    membership_count.short_description = 'Memberships with Role'

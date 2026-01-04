# === ADMIN.PY FOR CLUBS MODULE ===
# Date: 2025-12-07
# Comprehensive Django admin configuration for clubs module
# ==========================================

from django.contrib import admin
from django.utils.html import format_html
from django import forms
from django.db import models

from .models import (
    Club,
    ClubMembership,
    ClubMembershipType,
    ClubMembershipSkillLevel,
    Role
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

# ==========================================
# CLUB MEMBERSHIP ADMIN
# ==========================================

@admin.register(ClubMembership)
class ClubMembershipAdmin(admin.ModelAdmin):
    list_display = (
        'member_display',
        'club',
        'type',
        'status_display',
        'role_list',
        'level_list',
        'is_preferred_club',
        'created_at'
    )
    list_filter = (
        'status',
        'is_preferred_club',
        'type',
        'club',
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
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('member',)
    filter_horizontal = ('roles', 'levels')
    
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
    
    def member_display(self, obj):
        """Display member with full name"""
        full_name = obj.member.get_full_name()
        if full_name:
            return f"{obj.member.username} ({full_name})"
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


# ==========================================
# CLUB MEMBERSHIP SKILL LEVEL ADMIN
# ==========================================

@admin.register(ClubMembershipSkillLevel)
class ClubMembershipSkillLevelAdmin(admin.ModelAdmin):
    list_display = (
        'level',
        'description_short',
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
            'fields': ('level', 'description')
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


# ==========================================
# ROLE ADMIN
# ==========================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        'name_display',
        'permission_summary',
        'membership_count',
        'created_at'
    )
    list_filter = (
        'can_manage_club',
        'can_manage_members',
        'can_manage_leagues',
        'can_create_training'
    )
    search_fields = (
        'description',
    )
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'membership_count')
    
    fieldsets = (
        ('Role Information', {
            'fields': ('name', 'description')
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

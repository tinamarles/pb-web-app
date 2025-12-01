# === CORRECTED ADMIN.PY FOR LEAGUES ===
# Date: 2025-12-01
# Corrected to match actual model fields
# ========================================

from django.contrib import admin
from .models import (
    League, 
    LeagueParticipation, 
    LeagueSession, 
    LeagueAttendance, 
    RoundRobinPattern
)


class LeagueParticipationInline(admin.TabularInline):
    model = LeagueParticipation
    extra = 0
    fields = ('member', 'club_membership', 'status', 'captain_notes', 'exclude_from_rankings')
    readonly_fields = ('joined_at',)


class LeagueSessionInline(admin.TabularInline):
    model = LeagueSession
    extra = 0
    fields = ('day_of_week', 'start_time', 'end_time', 'court_location', 'courts_used', 'is_active')
    show_change_link = True


@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'club',
        'league_type',
        'minimum_skill_level', 
        'start_date', 
        'end_date', 
        'is_active',
        'participant_count'
    )
    list_filter = (
        'league_type', 
        'is_active',
        'registration_open',
        'start_date',
        'club'
    )
    search_fields = ('name', 'description', 'captain__username', 'club__name')
    ordering = ('-start_date', 'name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'club', 'captain')
        }),
        ('League Type & Format', {
            'fields': (
                'league_type',
                'default_match_format',
                'minimum_skill_level'
            )
        }),
        ('Registration', {
            'fields': (
                'registration_open',
                'max_participants',
                'allow_reserves'
            )
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [LeagueParticipationInline, LeagueSessionInline]
    
    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'


@admin.register(LeagueParticipation)
class LeagueParticipationAdmin(admin.ModelAdmin):
    list_display = (
        'member', 
        'league', 
        'club_membership',
        'status', 
        'joined_at',
        'exclude_from_rankings',
        'is_active'
    )
    list_filter = (
        'status', 
        'exclude_from_rankings',
        'joined_at'
    )
    search_fields = (
        'member__username', 
        'member__email',
        'member__first_name',
        'member__last_name',
        'league__name'
    )
    ordering = ('-joined_at',)
    readonly_fields = ('joined_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Participation Info', {
            'fields': ('league', 'member', 'club_membership', 'status')
        }),
        ('Captain Notes', {
            'fields': ('captain_notes', 'exclude_from_rankings'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'left_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_active(self, obj):
        return obj.status == 'active'
    is_active.boolean = True
    is_active.short_description = 'Active'


@admin.register(LeagueSession)
class LeagueSessionAdmin(admin.ModelAdmin):
    list_display = (
        'league', 
        'day_of_week_display',
        'time_range',
        'court_location', 
        'courts_used',
        'is_active'
    )
    list_filter = (
        'is_active', 
        'day_of_week',
        'recurrence_type'
    )
    search_fields = (
        'league__name', 
        'court_location__name'
    )
    ordering = ('league', 'day_of_week', 'start_time')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Session Details', {
            'fields': ('league', 'court_location', 'courts_used')
        }),
        ('Schedule', {
            'fields': (
                'day_of_week',
                'start_time',
                'end_time',
                'recurrence_type',
                'recurrence_interval'
            )
        }),
        ('Active Period', {
            'fields': ('active_from', 'active_until', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def day_of_week_display(self, obj):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[obj.day_of_week] if 0 <= obj.day_of_week < 7 else 'Unknown'
    day_of_week_display.short_description = 'Day'
    
    def time_range(self, obj):
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'


@admin.register(LeagueAttendance)
class LeagueAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'get_member',
        'get_league',
        'session_date',
        'status',
        'cancelled_at'
    )
    list_filter = (
        'status',
        'session_date'
    )
    search_fields = (
        'league_participation__member__username',
        'league_participation__member__first_name',
        'league_participation__member__last_name',
        'league_participation__league__name'
    )
    ordering = ('-session_date',)
    readonly_fields = ('created_at', 'updated_at', 'cancelled_at')
    
    fieldsets = (
        ('Attendance Info', {
            'fields': ('league_participation', 'session_date', 'status')
        }),
        ('Cancellation', {
            'fields': ('cancelled_at', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_member(self, obj):
        return obj.league_participation.member.get_full_name() or obj.league_participation.member.username
    get_member.short_description = 'Member'
    
    def get_league(self, obj):
        return obj.league_participation.league.name
    get_league.short_description = 'League'


@admin.register(RoundRobinPattern)
class RoundRobinPatternAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'num_courts',
        'num_players',
        'created_at'
    )
    list_filter = (
        'num_courts',
        'num_players'
    )
    search_fields = (
        'name',
    )
    ordering = ('num_courts', 'num_players')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Pattern Info', {
            'fields': ('name', 'num_courts', 'num_players')
        }),
        ('Pattern Data', {
            'fields': ('pattern_data',),
            'description': 'JSON data defining the round robin pattern'
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )

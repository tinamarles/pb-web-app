# picklehub/leagues/admin.py

from django.contrib import admin
from .models import (
    League, 
    LeagueParticipation, 
    LeagueSession, 
    LeagueAttendance, 
    RoundRobinPattern
)
from public.constants import (
    LeagueParticipationStatus,
    LeagueAttendanceStatus,
    LeagueType,
    SkillLevel
)


# ========================================
# CUSTOM FILTERS
# ========================================

class EventLeagueFilter(admin.SimpleListFilter):
    """
    Custom filter to show "Events" vs "Leagues" instead of "Yes/No"
    """
    title = 'event or league'
    parameter_name = 'is_event'
    
    def lookups(self, request, model_admin):
        return (
            ('event', 'Events'),
            ('league', 'Leagues'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'event':
            return queryset.filter(is_event=True)
        if self.value() == 'league':
            return queryset.filter(is_event=False)
        return queryset


# ========================================
# INLINES
# ========================================

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


# ========================================
# LEAGUE ADMIN
# ========================================

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'club',
        'event_type_display',
        'league_type_display',
        'skill_level_display', 
        'start_date', 
        'end_date', 
        'is_active',
        'participant_count'
    )
    list_filter = (
        EventLeagueFilter,  # ✅ FIRST!
        'league_type', 
        'is_active',
        'registration_open',
        'start_date',
        'club'
    )
    search_fields = ('name', 'description', 'captain__username', 'club__name')
    ordering = ('-start_date', 'name')
    readonly_fields = ('created_at', 'updated_at', 'participant_count_display')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'club', 'captain', 'image_url')
        }),
        ('Type & Format', {
            'fields': (
                'is_event',
                'league_type',
                'default_generation_format',
                'minimum_skill_level'
            )
        }),
        ('Registration Settings', {
            'fields': (
                'registration_open',
                'max_participants',
                'allow_reserves',
                'registration_opens_hours_before',
                'registration_closes_hours_before'
            )
        }),
        ('Session Settings', {
            'fields': (
                'max_spots_per_session',
                'allow_waitlist'
            )
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status & Metadata', {
            'fields': ('is_active', 'participant_count_display', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [LeagueParticipationInline, LeagueSessionInline]
    
    def event_type_display(self, obj):
        return "Event" if obj.is_event else "League"
    event_type_display.short_description = 'Type'
    
    def league_type_display(self, obj):
        return obj.get_league_type_display()  # ✅ Django magic!
    league_type_display.short_description = 'League Type'
    
    def skill_level_display(self, obj):
        """Display minimum skill level as label"""
        if obj.minimum_skill_level is None:
            return "Any Level"
        return str(obj.minimum_skill_level)  # ✅ ForeignKey - just convert to string!
    skill_level_display.short_description = 'Min. Skill'
    
    def participant_count(self, obj):
        """Count active participants for list display"""
        return obj.participants.filter(
            league_participations__status=LeagueParticipationStatus.ACTIVE  # ✅ Fixed: league_participations (with 's')
        ).distinct().count()
    participant_count.short_description = 'Active Participants'
    
    def participant_count_display(self, obj):
        active = obj.participants.filter(
            league_participations__status=LeagueParticipationStatus.ACTIVE
        ).distinct().count()
        total = obj.participants.count()
        return f"{active} active / {total} total"
    participant_count_display.short_description = 'Participants'


@admin.register(LeagueParticipation)
class LeagueParticipationAdmin(admin.ModelAdmin):
    list_display = (
        'member', 
        'league', 
        'club_membership',
        'status_display',
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
    
    def status_display(self, obj):
        return obj.get_status_display()  # ✅ Django magic!
    status_display.short_description = 'Status'
    
    def is_active(self, obj):
        return obj.status == LeagueParticipationStatus.ACTIVE
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
        'status_display',
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
    
    def status_display(self, obj):
        return obj.get_status_display()  # ✅ Django magic!
    status_display.short_description = 'Status'


@admin.register(RoundRobinPattern)
class RoundRobinPatternAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'num_players',
        'created_at'
    )
    search_fields = ('name',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Pattern Info', {
            'fields': ('name', 'num_players')
        }),
        ('Pattern Data', {
            'fields': ('pattern_data',),
            'description': 'JSON data defining the round robin pattern'
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
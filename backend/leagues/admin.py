# picklehub/leagues/admin.py
# === UPDATED ADMIN.PY FOR LEAGUES ===
# Date: 2026-01-12
# Updated to:
# 1. Use INTEGER constants (LeagueParticipationStatus, etc.)
# 2. Include ALL League model fields (is_event, image_url, etc.)
# 3. Better organization and display methods
# 4. Custom filter for Event/League selection (first filter)
# 5. ✅ FIXED: LeagueAttendanceAdmin to use session_occurrence instead of session_date
# 6. ✅ FIXED: LeagueAdmin removed 'registration_open' filter (field doesn't exist)
# =====================================

from django.contrib import admin
from .models import (
    League, 
    LeagueParticipation, 
    LeagueSession, 
    LeagueAttendance, 
    RoundRobinPattern,
    SessionOccurrence,  # ✅ ADD THIS!
    SessionCancellation  # ✅ ADD THIS!
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
    This makes it MUCH clearer for admins!
    """
    title = 'event or league'  # Shows as "By event or league"
    parameter_name = 'is_event'
    
    def lookups(self, request, model_admin):
        """Define filter options"""
        return (
            ('event', 'Events'),    # is_event=True
            ('league', 'Leagues'),  # is_event=False
        )
    
    def queryset(self, request, queryset):
        """Filter queryset based on selection"""
        if self.value() == 'event':
            return queryset.filter(is_event=True)
        if self.value() == 'league':
            return queryset.filter(is_event=False)
        return queryset  # "All" - no filter


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
    extra = 1  # ✅ Changed from 0 to 1 - show one empty form by default
    min_num = 1  # ✅ REQUIRE at least 1 session!
    validate_min = True  # ✅ Enforce the minimum
    fields = (
        'day_of_week', 
        'start_time', 
        'end_time', 
        'court_location', 
        'courts_used', 
        'recurrence_type',      # ✅ Shows ONCE/WEEKLY/BI_WEEKLY/MONTHLY
        'recurrence_interval',  # ✅ Shows interval (1, 2, 3, etc.)
        'is_active'
    )
    show_change_link = True
    
    # ✅ Add helpful message
    verbose_name = "Session Schedule"
    verbose_name_plural = "Session Schedules (At least 1 required!)"


# ========================================
# LEAGUE ADMIN
# ========================================

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'club',
        'event_type_display',  # ✅ Show if it's event or league
        'league_type_display',
        'skill_level_display', 
        'start_date', 
        'end_date', 
        'is_active',
        'participant_count'
    )
    list_filter = (
        EventLeagueFilter,  # ✅ FIRST! Custom filter for Event/League
        'league_type', 
        'is_active',
        # ❌ REMOVED: 'registration_open' - field doesn't exist!
        'start_date',
        'club'
    )
    search_fields = ('name', 'description', 'captain__username', 'club__name')
    ordering = ('-start_date', 'name')
    readonly_fields = ('created_at', 'updated_at', 'participant_count_display')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'club', 'captain', 'image_url')  # ✅ Added image_url
        }),
        ('Type & Format', {
            'fields': (
                'is_event',  # ✅ NEW! Differentiates event vs league
                'league_type',
                'default_generation_format',  # ✅ CORRECT field name!
                'minimum_skill_level'
            )
        }),
        ('Registration Settings', {
            'fields': (
                # ❌ REMOVED: 'registration_open' - field doesn't exist!
                'max_participants',
                'allow_reserves',
                'registration_opens_hours_before',  # ✅ NEW!
                'registration_closes_hours_before'  # ✅ NEW!
            )
        }),
        ('League-Specific Registration Dates', {
            'fields': (
                'registration_start_date',  # ✅ For leagues only
                'registration_end_date',    # ✅ For leagues only
            ),
            'classes': ('collapse',),  # Collapsed by default
            'description': 'For LEAGUES: Date-based registration windows. For EVENTS: Use hours-based windows above.'
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
        """Show Event or League"""
        return "Event" if obj.is_event else "League"
    event_type_display.short_description = 'Type'
    
    def league_type_display(self, obj):
        """Display league type as label"""
        return obj.get_league_type_display()  # ✅ Django's built-in method!
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
        """Detailed participant count for detail view"""
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
        'status_display',  # ✅ Use display method with label
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
        """Display status as label"""
        return obj.get_status_display()  # ✅ Django's built-in method!
    status_display.short_description = 'Status'
    
    def is_active(self, obj):
        """Boolean indicator for active status"""
        return obj.status == LeagueParticipationStatus.ACTIVE  # ✅ INTEGER constant!
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
        """Display day of week as readable string"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[obj.day_of_week] if 0 <= obj.day_of_week < 7 else 'Unknown'
    day_of_week_display.short_description = 'Day'
    
    def time_range(self, obj):
        """Display time range in readable format"""
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'


@admin.register(LeagueAttendance)
class LeagueAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'get_member',
        'get_league',
        'get_session_date',  # ✅ FIXED: Use method instead of direct field
        'status_display',
        'cancelled_at'
    )
    list_filter = (
        'status',
        'session_occurrence__session_date'  # ✅ FIXED: Access via FK relationship
    )
    search_fields = (
        'league_participation__member__username',
        'league_participation__member__first_name',
        'league_participation__member__last_name',
        'league_participation__league__name'
    )
    ordering = ('-session_occurrence__session_date',)  # ✅ FIXED: Access via FK relationship
    readonly_fields = ('created_at', 'updated_at', 'cancelled_at')
    
    fieldsets = (
        ('Attendance Info', {
            'fields': ('league_participation', 'session_occurrence', 'status')  # ✅ FIXED: Use session_occurrence
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
        """Display member full name or username"""
        return obj.league_participation.member.get_full_name() or obj.league_participation.member.username
    get_member.short_description = 'Member'
    
    def get_league(self, obj):
        """Display league name"""
        return obj.league_participation.league.name
    get_league.short_description = 'League'
    
    def get_session_date(self, obj):
        """Display session date from SessionOccurrence"""
        return obj.session_occurrence.session_date
    get_session_date.short_description = 'Session Date'
    get_session_date.admin_order_field = 'session_occurrence__session_date'  # ✅ Enable sorting!
    
    def status_display(self, obj):
        """Display attendance status as label"""
        return obj.get_status_display()  # ✅ Django's built-in method!
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


@admin.register(SessionOccurrence)
class SessionOccurrenceAdmin(admin.ModelAdmin):
    list_display = (
        'get_league',
        'session_date',
        'time_range',
        'get_location',
        'is_cancelled',
        'attendance_count'
    )
    list_filter = (
        'session_date',
        'is_cancelled',
        'league_session__league__is_event',
        'league_session__league'
    )
    search_fields = (
        'league_session__league__name',
        'league_session__court_location__name'
    )
    ordering = ('-session_date', 'start_datetime')
    readonly_fields = (
        'league_session',
        'session_date',
        'start_datetime',
        'end_datetime',
        'registration_opens_at',
        'registration_closes_at',
        'created_at',
        'updated_at'
    )
    
    fieldsets = (
        ('Session Info', {
            'fields': ('league_session', 'session_date', 'start_datetime', 'end_datetime')
        }),
        ('Registration Windows (Events Only)', {
            'fields': ('registration_opens_at', 'registration_closes_at'),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': ('is_cancelled', 'cancellation_reason')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_league(self, obj):
        """Display league name"""
        return obj.league_session.league.name
    get_league.short_description = 'League/Event'
    
    def time_range(self, obj):
        """Display time range"""
        return f"{obj.start_datetime.strftime('%H:%M')} - {obj.end_datetime.strftime('%H:%M')}"
    time_range.short_description = 'Time'
    
    def get_location(self, obj):
        """Display court location"""
        return obj.league_session.court_location.name
    get_location.short_description = 'Location'
    
    def is_cancelled(self, obj):
        """Check if session is cancelled"""
        return obj.cancellations.filter(cancelled_by_captain=True).exists()
    is_cancelled.boolean = True
    is_cancelled.short_description = 'Cancelled'
    
    def attendance_count(self, obj):
        """Count attendees"""
        from public.constants import LeagueAttendanceStatus
        return obj.attendances.filter(
            status=LeagueAttendanceStatus.ATTENDING
        ).count()
    attendance_count.short_description = 'Attendees'


@admin.register(SessionCancellation)
class SessionCancellationAdmin(admin.ModelAdmin):
    list_display = (
        'get_league',
        'get_cancellation_period',
        'reason',
        'cancelled_by',
        'created_at'
    )
    list_filter = (
        'cancelled_from',
        'cancelled_until',
        'session__league'
    )
    search_fields = (
        'session__league__name',
        'reason'
    )
    ordering = ('-cancelled_from',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Cancellation Period', {
            'fields': ('session', 'cancelled_from', 'cancelled_until', 'reason')
        }),
        ('Metadata', {
            'fields': ('cancelled_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_league(self, obj):
        """Display league name"""
        return obj.session.league.name
    get_league.short_description = 'League/Event'
    
    def get_cancellation_period(self, obj):
        """Display cancellation period"""
        if obj.cancelled_from == obj.cancelled_until:
            return obj.cancelled_from
        return f"{obj.cancelled_from} to {obj.cancelled_until}"
    get_cancellation_period.short_description = 'Cancelled Period'
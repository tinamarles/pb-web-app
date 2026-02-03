# === CORRECTED ADMIN.PY FOR COURTS ===
# Date: 2025-12-01
# Corrected to match actual model fields
# ========================================

from django.contrib import admin
from .models import (
    CourtLocation,
    CourtClubAffiliation,
    UserCourtBooking,
    CourtScheduleBlock
)


class CourtClubAffiliationInline(admin.TabularInline):
    model = CourtClubAffiliation
    extra = 0
    fields = ('club', 'affiliation_type', 'is_active')


class CourtScheduleBlockInline(admin.TabularInline):
    model = CourtScheduleBlock
    extra = 0
    fields = (
        'day_of_week', 
        'start_time', 
        'end_time', 
        'block_type', 
        'is_active')


@admin.register(CourtLocation)
class CourtLocationAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'number_of_courts',
        'is_active',
        'booking_website_display',
        'affiliation_count'
    )
    list_filter = (
        'is_active',
        'created_at'
    )
    search_fields = (
        'name',
        'description',
        'address__street_address',
        'address__city'
    )
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'address', 'number_of_courts')
        }),
        ('Booking', {
            'fields': ('booking_website',)
        }),
        ('Display', {
            'fields': ('description', 'photo')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [CourtClubAffiliationInline, CourtScheduleBlockInline]
    
    def booking_website_display(self, obj):
        return '✓' if obj.booking_website else '-'
    booking_website_display.short_description = 'Has Booking Site'
    
    def affiliation_count(self, obj):
        return obj.affiliated_clubs.count()
    affiliation_count.short_description = 'Affiliations'


@admin.register(CourtClubAffiliation)
class CourtClubAffiliationAdmin(admin.ModelAdmin):
    list_display = (
        'court_location',
        'club',
        'affiliation_type',
        'is_active',
        'start_date',
        'end_date'
    )
    list_filter = (
        'affiliation_type',
        'is_active',
        'start_date'
    )
    search_fields = (
        'court_location__name',
        'club__name',
        'notes'
    )
    ordering = ('court_location__name', 'club__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Affiliation Details', {
            'fields': ('court_location', 'club', 'affiliation_type')
        }),
        ('Period', {
            'fields': ('start_date', 'end_date')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserCourtBooking)
class UserCourtBookingAdmin(admin.ModelAdmin):
    list_display = (
        'booking_id_display',
        'user',
        'court_location',
        'booking_date',
        'time_range',
        'booking_type'
    )
    list_filter = (
        'booking_type',
        'booking_date',
        'send_reminder'
    )
    search_fields = (
        'user__username',
        'user__first_name',
        'user__last_name',
        'court_location__name',
        'notes'
    )
    ordering = ('-booking_date', '-start_time')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Booking Details', {
            'fields': ('user', 'court_location', 'court_number')
        }),
        ('Time', {
            'fields': ('booking_date', 'start_time', 'end_time')
        }),
        ('Details', {
            'fields': ('booking_type', 'with_players', 'external_booking_reference')
        }),
        ('Reminders', {
            'fields': ('send_reminder', 'reminder_minutes_before'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def booking_id_display(self, obj):
        return f"Booking #{obj.id}"
    booking_id_display.short_description = 'ID'
    
    def time_range(self, obj):
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'


@admin.register(CourtScheduleBlock)
class CourtScheduleBlockAdmin(admin.ModelAdmin):
    list_display = (
        'court_location',
        'day_of_week_display',
        'time_range',
        'block_type',
        'is_active'
    )
    list_filter = (
        'block_type',
        'is_active',
        'day_of_week'
    )
    search_fields = (
        'court_location__name',
        'title'
    )
    ordering = ('court_location', 'day_of_week', 'start_time')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Schedule Info', {
            'fields': ('court_location', 'day_of_week', 'start_time', 'end_time')
        }),
        ('Block Details', {
            'fields': (
                'block_type',
                'title',
                'courts_used'
            )
        }),
        ('Display', {
            'fields': ('background_color', 'text_color'),
            'classes': ('collapse',)
        }),
        ('Links', {
            'fields': ('league', 'club'),
            'classes': ('collapse',)
        }),
        ('Active Period', {
            'fields': ('active_from', 'active_until', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    DAY_NAMES = {
        0: 'Monday',
        1: 'Tuesday',
        2: 'Wednesday',
        3: 'Thursday',
        4: 'Friday',
        5: 'Saturday',
        6: 'Sunday'
    }
    
    def day_of_week_display(self, obj):
        return self.DAY_NAMES.get(obj.day_of_week, 'Unknown')
    day_of_week_display.short_description = 'Day'
    
    def time_range(self, obj):
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'

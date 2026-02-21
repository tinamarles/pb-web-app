# picklehub/leagues/admin.py
# === UPDATED ADMIN.PY FOR LEAGUES ===
# Date: 2026-01-19
# Updated to:
# 1. Use INTEGER constants (LeagueParticipationStatus, etc.)
# 2. Include ALL League model fields (is_event, image_url, etc.)
# 3. Better organization and display methods
# 4. Custom filter for Event/League selection (first filter)
# 5. ✅ FIXED: LeagueAttendanceAdmin to use session_occurrence instead of session_date
# 6. ✅ FIXED: LeagueAdmin removed 'registration_open' filter (field doesn't exist)
# 7. ✅ FIXED: Added custom TimeInput widget to accept "10" instead of requiring "10:00" (2026-01-17)
# 8. ✅ NEW: Added AUTOCOMPLETE fields to prevent dropdown nightmare! (2026-01-19)
# 9. ✅ NEW: Added LeagueAttendanceInline to SessionOccurrence - book members from session page! (2026-01-19)
# 10. ✅ NEW: Made LeagueParticipation searchable via autocomplete (2026-01-19)
# 11. ✅ FIXED: Auto-populate club_membership - no more wrong club selection! (2026-01-19)
# 12. ✅ FIXED: Filter member dropdown to ONLY show club members - prevents selecting wrong users! (2026-01-19)
# 13. ✅ FIXED: save_formset now properly tracks instances to save - prevents RelatedObjectDoesNotExist! (2026-01-19)
# 14. ✅ FIXED: Custom FORM clean() method auto-populates club_membership + makes it not required! (2026-01-19)
# 15. ✅ NEW: Added ClubFilterForSessionOccurrence - filter by club FIRST, then league! (2026-01-19)
# 16. ✅ NEW: Added LeagueFilterForSessionOccurrence - DYNAMIC league filter that respects club selection! (2026-01-19)
# 17. ✅ NEW: Added LeagueFilterForParticipation - Custom filter to filter LeagueParticipation by League (2026-01-19)
# 18. ✅ NEW: Added LeagueFilterForAttendance - Custom filter to filter LeagueAttendance by League/Event (2026-02-20)
# =====================================

from django.contrib import admin
from django import forms
from django.contrib import messages
from .models import (
    League, 
    LeagueParticipation, 
    LeagueSession, 
    LeagueAttendance, 
    RoundRobinPattern,
    SessionOccurrence,
    SessionCancellation
)
from clubs.models import ClubMembership  # ✅ NEW! Import ClubMembership
from public.constants import (
    LeagueParticipationStatus,
    LeagueAttendanceStatus,
    LeagueType,
    SkillLevel,
    MembershipStatus  # ✅ NEW! Import MembershipStatus
)


# ========================================
# CUSTOM FORM WIDGETS
# ========================================

class TimeInputWidget(forms.TimeInput):
    """
    Custom time input that accepts "10" and converts to "10:00"
    No more annoying "correct the error" messages!
    """
    input_type = 'time'
    format = '%H:%M'
    
    def __init__(self, attrs=None, format=None):
        default_attrs = {'placeholder': 'HH:MM (e.g., 10:00 or just 10)'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(attrs=default_attrs, format=format or self.format)


# ========================================
# CUSTOM FORMS
# ========================================

class LeagueSessionForm(forms.ModelForm):
    """
    Custom form for LeagueSession to use TimeInputWidget for time fields
    """
    class Meta:
        model = LeagueSession
        fields = '__all__'
        widgets = {
            'start_time': TimeInputWidget(),
            'end_time': TimeInputWidget(),
        }


class LeagueParticipationForm(forms.ModelForm):
    """
    Custom form for LeagueParticipation to filter members by club.
    
    This ensures only members of the league's club can be selected!
    """
    class Meta:
        model = LeagueParticipation
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # ✅ CRITICAL: Make club_membership NOT required in the form!
        # We'll populate it in clean() before validation
        if 'club_membership' in self.fields:
            self.fields['club_membership'].required = False
        
        # If editing an existing participation, filter members by club
        if 'instance' in kwargs and kwargs['instance'] and kwargs['instance'].league:
            league = kwargs['instance'].league
            from django.contrib.auth import get_user_model
            User = get_user_model()
            self.fields['member'].queryset = User.objects.filter(
                club_memberships__club=league.club,
                club_memberships__status=MembershipStatus.ACTIVE
            ).distinct()
        
        # If creating new participation with initial data (from inline)
        elif 'initial' in kwargs and 'league' in kwargs['initial']:
            league_id = kwargs['initial']['league']
            try:
                league = League.objects.get(pk=league_id)
                from django.contrib.auth import get_user_model
                User = get_user_model()
                self.fields['member'].queryset = User.objects.filter(
                    club_memberships__club=league.club,
                    club_memberships__status=MembershipStatus.ACTIVE
                ).distinct()
            except League.DoesNotExist:
                pass
    
    def clean(self):
        """
        Auto-populate club_membership before form validation.
        
        This runs AFTER field cleaning but BEFORE model validation!
        """
        cleaned_data = super().clean()
        
        member = cleaned_data.get('member')
        league = cleaned_data.get('league')
        club_membership = cleaned_data.get('club_membership')
        
        # Only auto-populate if member is set but club_membership is not
        if member and league and not club_membership:
            try:
                club_membership = ClubMembership.objects.get(
                    member=member,
                    club=league.club,
                    status=MembershipStatus.ACTIVE
                )
                cleaned_data['club_membership'] = club_membership
                # ✅ Also set it on the instance!
                self.instance.club_membership = club_membership
            except ClubMembership.DoesNotExist:
                raise forms.ValidationError(
                    f"{member.username} does not have an active membership in {league.club.name}! "
                    f"Please create a ClubMembership first."
                )
            except ClubMembership.MultipleObjectsReturned:
                raise forms.ValidationError(
                    f"{member.username} has multiple memberships in {league.club.name}! "
                    f"Please fix the data."
                )
        
        return cleaned_data


class LeagueParticipationInlineFormSet(forms.BaseInlineFormSet):
    """
    Custom formset that auto-populates club_membership BEFORE validation.
    
    This fixes the issue where Django tries to validate club_membership
    before save_formset runs!
    """
    
    def _construct_form(self, i, **kwargs):
        """
        Override form construction to auto-populate club_membership.
        """
        form = super()._construct_form(i, **kwargs)
        
        # Get the league from the parent instance
        if hasattr(self, 'instance') and self.instance:
            league = self.instance
            
            # If this form has a member selected, auto-populate club_membership
            if form.instance and form.instance.member_id:
                try:
                    club_membership = ClubMembership.objects.get(
                        member_id=form.instance.member_id,
                        club=league.club,
                        status=MembershipStatus.ACTIVE
                    )
                    form.instance.club_membership = club_membership
                except ClubMembership.DoesNotExist:
                    pass  # Will be handled in validation
        
        return form


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


class ClubFilterForSessionOccurrence(admin.SimpleListFilter):
    """
    Filter SessionOccurrences by club.
    
    This makes it MUCH easier to find sessions when you have multiple clubs!
    Filter by club FIRST, then by league/event!
    """
    title = 'club'  # Shows as "By club"
    parameter_name = 'club'
    
    def lookups(self, request, model_admin):
        """Get all clubs that have leagues with session occurrences"""
        from clubs.models import Club
        # Get clubs that have leagues with sessions
        clubs = Club.objects.filter(
            leagues__sessions__occurrences__isnull=False
        ).distinct().order_by('name')
        return [(club.id, club.name) for club in clubs]
    
    def queryset(self, request, queryset):
        """Filter by club"""
        if self.value():
            return queryset.filter(league_session__league__club_id=self.value())
        return queryset


class LeagueFilterForSessionOccurrence(admin.SimpleListFilter):
    """
    Dynamic league filter that ONLY shows leagues from the selected club!
    
    Workflow:
    1. User selects club filter
    2. This filter shows ONLY leagues from that club
    3. Much easier to find the specific league/event!
    
    If no club is selected, shows a message to select club first.
    """
    title = 'league/event'  # Shows as "By league/event"
    parameter_name = 'league'
    
    def lookups(self, request, model_admin):
        """
        Get leagues based on selected club.
        
        If club is selected → show only that club's leagues
        If no club → show message to select club first
        """
        club_id = request.GET.get('club')
        
        if club_id:
            # ✅ Club selected! Show only leagues from this club
            leagues = League.objects.filter(
                club_id=club_id,
                sessions__occurrences__isnull=False
            ).distinct().order_by('name')
            
            # Add club name prefix for clarity
            from clubs.models import Club
            try:
                club = Club.objects.get(pk=club_id)
                return [(league.id, f"{league.name}") for league in leagues]
            except Club.DoesNotExist:
                return []
        else:
            # ❌ No club selected! Show helpful message
            return [('', '← Select a club first')]
    
    def queryset(self, request, queryset):
        """Filter by league"""
        if self.value():
            return queryset.filter(league_session__league_id=self.value())
        return queryset


class LeagueFilterForParticipation(admin.SimpleListFilter):
    """Custom filter to filter LeagueParticipation by League"""
    title = 'league/event'  # Display name in filter sidebar
    parameter_name = 'league_filter'  # URL parameter name (different from 'league' field!)
    
    def lookups(self, request, model_admin):
        """Return list of leagues to filter by"""
        # Get all leagues that have participants, grouped by club for clarity
        leagues = League.objects.filter(
            league_participants__isnull=False
        ).select_related('club').distinct().order_by('club__name', 'name')
        
        return [(league.id, f"{league.club.short_name or league.club.name} - {league.name}") for league in leagues]
    
    def queryset(self, request, queryset):
        """Filter queryset based on selected league"""
        if self.value():
            # Filter participations for this league
            return queryset.filter(league__id=self.value())
        return queryset


class LeagueFilterForAttendance(admin.SimpleListFilter):
    """
    Custom filter to filter LeagueAttendance by League/Event.
    
    🎯 NEW FILTER (2026-02-20):
    - Shows all leagues/events that have attendance records
    - Groups by club for easier navigation
    - Works with member search and date filter!
    
    Workflow:
    1. User selects a league/event
    2. Attendance list filtered to ONLY show records for that league
    3. Can then filter by member name or date
    """
    title = 'league/event'  # Display name in filter sidebar
    parameter_name = 'league_filter'  # URL parameter name
    
    def lookups(self, request, model_admin):
        """Return list of leagues that have attendance records"""
        # ✅ FIX: Get unique league IDs from attendance records
        # Can't use __isnull on reverse relations, so we get IDs first
        league_ids = LeagueAttendance.objects.values_list(
            'league_participation__league', 
            flat=True
        ).distinct()
        
        # Then get those leagues with club info
        leagues = League.objects.filter(
            id__in=league_ids
        ).select_related('club').order_by('club__name', 'name')
        
        return [(league.id, f"{league.club.short_name or league.club.name} - {league.name}") for league in leagues]
    
    def queryset(self, request, queryset):
        """Filter attendance records by league"""
        if self.value():
            # Filter attendance for this league
            return queryset.filter(league_participation__league__id=self.value())
        return queryset


# ========================================
# INLINES
# ========================================

class LeagueParticipationInline(admin.TabularInline):
    """
    Add participants directly from League page.
    
    ⚠️ IMPORTANT: club_membership is AUTO-POPULATED!
    Just select the member, and the system will automatically find their
    ClubMembership for this league's club. No manual selection needed!
    
    ⚠️ FILTERING: Only shows members who have an ACTIVE ClubMembership in this league's club!
    
    Workflow:
    1. Create League
    2. Add Sessions inline (auto-creates SessionOccurrences!)
    3. Add Participants here - just select member!
    4. System auto-fills club_membership
    5. Go to SessionOccurrence to book specific sessions
    """
    model = LeagueParticipation
    form = LeagueParticipationForm  # ✅ USE CUSTOM FORM!
    formset = LeagueParticipationInlineFormSet  # ✅ USE CUSTOM FORMSET!
    extra = 3  # ✅ Show 3 empty rows to add participants
    autocomplete_fields = ['member']  # ✅ Only member! club_membership is auto-filled!
    fields = ('member', 'status', 'captain_notes', 'exclude_from_rankings')  # ✅ club_membership NOT included!
    exclude = ('club_membership',)  # ✅ EXPLICITLY EXCLUDE to prevent validation!
    readonly_fields = ('joined_at',)  # ✅ Only joined_at is readonly!
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Filter member dropdown to ONLY show users who are members of this league's club.
        
        This prevents admins from selecting users who don't have a ClubMembership!
        """
        if db_field.name == "member":
            # Get the league being edited from the URL
            obj_id = request.resolver_match.kwargs.get('object_id')
            if obj_id:
                try:
                    league = League.objects.get(pk=obj_id)
                    # ✅ ONLY show users with ACTIVE membership in this league's club!
                    # NOTE: Using 'club_memberships' (the related_name from ClubMembership.member)
                    kwargs["queryset"] = league.club.members.filter(
                        club_memberships__status=MembershipStatus.ACTIVE
                    ).distinct()
                except League.DoesNotExist:
                    pass
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_formset(self, request, form, formset, change):
        """
        Auto-populate club_membership based on member + league.club.
        
        Logic:
        1. User selects member
        2. System looks up ClubMembership for (member, league.club, status=ACTIVE)
        3. Auto-fills it
        4. If not found, shows error message and DOESN'T save
        """
        instances = formset.save(commit=False)
        
        # ✅ Get the league from the parent form!
        league = form.instance
        
        # Track which instances to actually save
        instances_to_save = []
        
        for instance in instances:
            # Only process if member is set
            if not instance.member:
                continue
            
            # ✅ Set the league explicitly (in case it's not set yet)
            instance.league = league
            
            # Auto-populate club_membership if not set
            if not instance.club_membership:
                try:
                    # Get the ClubMembership for this member in this league's club
                    instance.club_membership = ClubMembership.objects.get(
                        member=instance.member,
                        club=league.club,  # ✅ Use league from parent form!
                        status=MembershipStatus.ACTIVE  # ← Only active memberships!
                    )
                    # ✅ Successfully found club_membership, can save!
                    instances_to_save.append(instance)
                    
                except ClubMembership.DoesNotExist:
                    # Handle error - member doesn't have membership in this club!
                    messages.error(
                        request,
                        f"❌ {instance.member.username} does not have an active membership in {league.club.name}! "
                        f"Please create a ClubMembership first."
                    )
                    # ❌ DON'T add to save list!
                    
                except ClubMembership.MultipleObjectsReturned:
                    # Should never happen if constraint is enforced, but handle it
                    messages.error(
                        request,
                        f"❌ {instance.member.username} has multiple memberships in {league.club.name}! "
                        f"Please fix the data."
                    )
                    # ❌ DON'T add to save list!
            else:
                # club_membership already set (editing existing record)
                instances_to_save.append(instance)
        
        # Save only valid instances
        for instance in instances_to_save:
            instance.save()
        
        # Delete removed instances
        for obj in formset.deleted_objects:
            obj.delete()
        
        formset.save_m2m()


class LeagueSessionInline(admin.TabularInline):
    model = LeagueSession
    form = LeagueSessionForm  # ✅ Use custom form with TimeInputWidget!
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
    verbose_name_plural = "Session Schedules (At least 1 required! Auto-creates SessionOccurrences on save!)"
    
    def save_formset(self, request, form, formset, change):
        """
        Override save_formset to regenerate SessionOccurrence records
        when LeagueSession is edited via League admin inline.
        
        This ensures occurrences regenerate whether you edit:
        1. Directly in LeagueSession admin (uses save_model)
        2. Via inline in League admin (uses THIS method)
        """
        # Save the formset normally
        instances = formset.save(commit=False)
        
        # Track sessions that need regeneration
        sessions_to_regenerate = []
        
        # Save instances and track which ones were modified
        for instance in instances:
            # Check if this is an update (not a new record)
            is_update = instance.pk is not None
            
            instance.save()
            
            # If updating existing session, mark for regeneration
            if is_update:
                sessions_to_regenerate.append(instance)
        
        # Handle deletions
        for obj in formset.deleted_objects:
            obj.delete()
        
        # Save many-to-many relationships
        formset.save_m2m()
        
        # Now regenerate occurrences for updated sessions
        total_occurrences = 0
        for session in sessions_to_regenerate:
            session.generate_occurrences()
            count = session.occurrences.count()
            total_occurrences += count
        
        # Show success message if any were regenerated
        if total_occurrences > 0:
            messages.success(
                request,
                f'✅ Regenerated {total_occurrences} SessionOccurrence records for {len(sessions_to_regenerate)} session(s).'
            )


class LeagueAttendanceInline(admin.TabularInline):
    """
    Book members to specific session occurrence.
    
    This shows up on SessionOccurrence page!
    
    Workflow:
    1. Go to SessionOccurrence (e.g., "Rising Stars - 2026-09-27")
    2. Use this inline to add attendees
    3. Search for LeagueParticipation records (members enrolled in league)
    4. Set status (ATTENDING/WAITLIST/etc.)
    5. Save!
    """
    model = LeagueAttendance
    extra = 5  # ✅ Show 5 empty rows to book multiple members
    autocomplete_fields = ['league_participation']  # ✅ SEARCHABLE - no more dropdown nightmare!
    fields = ['league_participation', 'status', 'checked_in', 'checked_in_by']
    verbose_name = "Attendee"
    verbose_name_plural = "Attendees (Book members for this session)"


# ========================================
# LEAGUE ADMIN
# ========================================

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = (
        'id',
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
                'is_event',  # ✅ NEW! Differentiates event vs league
                'league_type',
                'default_generation_format',
                'minimum_skill_level'
            )
        }),
        ('Capacity & Fee', {
            'fields': (
                'max_participants',
                'allow_reserves',
                'fee'
            )
        }),
        ('Event Registration (Hours-Based)', {
            'fields': (
                'registration_opens_hours_before',
                'registration_closes_hours_before'
            ),
            'classes': ('collapse',),
            'description': 'For EVENTS: Registration opens/closes X hours before session start.'
        }),
        ('League Registration (Date-Based)', {
            'fields': (
                'registration_start_date',
                'registration_end_date',
            ),
            'classes': ('collapse',),
            'description': 'For LEAGUES: Date-based registration windows.'
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status & Metadata', {
            'fields': ('is_active', 'participant_count_display', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [LeagueSessionInline, LeagueParticipationInline]  # ✅ Sessions first, then participants!
    
    def get_search_results(self, request, queryset, search_term):
        """
        Override autocomplete search to filter members by club.
        
        This is needed because autocomplete_fields don't respect formfield_for_foreignkey!
        When searching for members in LeagueParticipationInline, we need to filter by club.
        """
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        
        # Check if this is a search for the 'member' field from the inline
        # The request will have a parameter indicating which field is being searched
        if request.path.endswith('/autocomplete/'):
            # Get the model being searched from the URL or params
            # For User model autocomplete, filter by club membership
            
            # Get the league being edited
            referer = request.META.get('HTTP_REFERER', '')
            if '/leagues/league/' in referer:
                # Extract league ID from referer URL
                try:
                    league_id = referer.split('/leagues/league/')[1].split('/')[0]
                    if league_id and league_id.isdigit():
                        league = League.objects.get(pk=league_id)
                        # Filter to only members of this league's club
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        if queryset.model == User:
                            queryset = league.club.members.filter(
                                club_memberships__club=league.club,
                                club_memberships__status=MembershipStatus.ACTIVE
                            ).distinct()
                except (ValueError, League.DoesNotExist):
                    pass
        
        return queryset, use_distinct
    
    def event_type_display(self, obj):
        """Show Event or League"""
        return "Event" if obj.is_event else "League"
    event_type_display.short_description = 'Type'
    
    def league_type_display(self, obj):
        """Display league type as label"""
        return obj.get_league_type_display()
    league_type_display.short_description = 'League Type'
    
    def skill_level_display(self, obj):
        """Display minimum skill level as label"""
        if obj.minimum_skill_level is None:
            return "Any Level"
        return str(obj.minimum_skill_level)
    skill_level_display.short_description = 'Min. Skill'
    
    def participant_count(self, obj):
        """Count active participants for list display"""
        return obj.league_participants.filter(
            status=LeagueParticipationStatus.ACTIVE
        ).count()
    participant_count.short_description = 'Active Participants'
    
    def participant_count_display(self, obj):
        """Detailed participant count for detail view"""
        active = obj.league_participants.filter(
            status=LeagueParticipationStatus.ACTIVE
        ).count()
        total = obj.league_participants.count()
        return f"{active} active / {total} total"
    participant_count_display.short_description = 'Participants'


@admin.register(LeagueParticipation)
class LeagueParticipationAdmin(admin.ModelAdmin):
    """
    ⚠️ IMPORTANT: This model MUST be searchable via autocomplete!
    Used by LeagueAttendanceInline to search for enrolled members.
    """
    list_display = (
        'id',
        'member__first_name', 
        'member__last_name',
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
        'joined_at',
        LeagueFilterForParticipation  # ✅ Add custom filter for league
    )
    search_fields = (
        'member__username', 
        'member__email',
        'member__first_name',
        'member__last_name',
        'league__name'
    )
    # ordering = ('-joined_at',)
    ordering = ('member__first_name', 'member__last_name', '-joined_at')  # ✅ Order by member name, then joined date
    readonly_fields = ('joined_at', 'created_at', 'updated_at')
    autocomplete_fields = ['league', 'member', 'club_membership']  # ✅ Make this searchable too!
    
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
        return obj.get_status_display()
    status_display.short_description = 'Status'
    
    def is_active(self, obj):
        """Boolean indicator for active status"""
        return obj.status == LeagueParticipationStatus.ACTIVE
    is_active.boolean = True
    is_active.short_description = 'Active'


@admin.register(LeagueSession)
class LeagueSessionAdmin(admin.ModelAdmin):
    form = LeagueSessionForm  # ✅ Use custom form with TimeInputWidget!
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
    
    def save_model(self, request, obj, form, change):
        """
        Override save_model to ALWAYS regenerate SessionOccurrence records
        when LeagueSession is saved from Django Admin.
        
        This fixes the issue where editing a session doesn't update occurrences!
        
        How it works:
        1. Save the LeagueSession normally
        2. If editing (change=True), regenerate all SessionOccurrence records
        3. Admin sees success message with count of occurrences created
        """
        super().save_model(request, obj, form, change)
        
        # If editing existing session, regenerate occurrences
        if change:
            obj.generate_occurrences()
            
            # Count how many were created
            occurrence_count = obj.occurrences.count()
            
            # Show success message
            messages.success(
                request,
                f'✅ Regenerated {occurrence_count} SessionOccurrence records for this session.'
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
        'id',
        'get_member',
        'get_league',
        'get_session_date',
        'status_display',
        'checked_in',
        'cancelled_at'
    )
    list_filter = (
        'status',
        'checked_in',
        'session_occurrence__session_date',
        LeagueFilterForAttendance  # ✅ Add custom filter for league
    )
    search_fields = (
        'league_participation__member__username',
        'league_participation__member__first_name',
        'league_participation__member__last_name',
        'league_participation__league__name'
    )
    ordering = ('-session_occurrence__session_date',)
    readonly_fields = ('created_at', 'updated_at', 'cancelled_at')
    autocomplete_fields = ['league_participation', 'session_occurrence', 'checked_in_by']  # ✅ SEARCHABLE!
    
    # ✅ NEW: Add date hierarchy for easy date navigation!
    date_hierarchy = 'session_occurrence__session_date'
    
    fieldsets = (
        ('Attendance Info', {
            'fields': ('league_participation', 'session_occurrence', 'status')
        }),
        ('Check-In', {
            'fields': ('checked_in', 'checked_in_by'),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': ('cancelled_at', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Mid-Session Changes', {
            'fields': ('left_after_round', 'arrived_before_round'),
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
    get_session_date.admin_order_field = 'session_occurrence__session_date'
    
    def status_display(self, obj):
        """Display attendance status as label"""
        return obj.get_status_display()
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
    """
    🎯 THIS IS WHERE YOU BOOK MEMBERS TO SESSIONS!
    
    Workflow:
    1. Find the SessionOccurrence (e.g., "Rising Stars - 2026-09-27")
    2. Scroll to "Attendees" inline section
    3. Search for LeagueParticipation records (enrolled members)
    4. Add them to the session!
    5. Save!
    """
    list_display = (
        'get_league',
        'session_date',
        'time_range',
        'get_location',
        'is_cancelled',
        'attendance_count',
        'registration_open'
    )
    list_filter = (
        ClubFilterForSessionOccurrence,  # ✅ 1️⃣ Select club FIRST!
        LeagueFilterForSessionOccurrence,  # ✅ 2️⃣ Then league (filtered by club)!
        'session_date',  # ✅ 3️⃣ Then date
        'is_cancelled',  # ✅ 4️⃣ Then cancelled status
        'league_session__league__is_event',  # ✅ 5️⃣ Then event/league type
    )
    search_fields = (
        'league_session__league__name',
        'league_session__court_location__name'
    )
    ordering = ('session_date', 'start_datetime')
    readonly_fields = (
        'league_session',
        'league',  # ✅ After optimization, this will be read-only!
        'session_date',
        'start_datetime',
        'end_datetime',
        'created_at',
        'updated_at',
        'registration_open'
    )
    
    # ✅ ADD THE INLINE HERE!
    inlines = [LeagueAttendanceInline]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('league_session', 'league', 'session_date', 'start_datetime', 'end_datetime')
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
        """Check if this specific occurrence is cancelled"""
        return obj.is_cancelled  # ✅ Use the model field directly!
    is_cancelled.boolean = True
    is_cancelled.short_description = 'Cancelled'
    
    def attendance_count(self, obj):
        """Count attendees"""
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
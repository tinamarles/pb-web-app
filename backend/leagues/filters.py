import django_filters
from django.db.models import Exists, OuterRef, Q, Min, Max
from django.utils import timezone

from .models import League, SessionOccurrence, LeagueParticipation
from public.constants import EventFilterType, EventFilterStatus, LeagueParticipationStatus

class LeagueFilter(django_filters.FilterSet):
    """
    Custom filter for League model (includes both Events and Leagues)
    
    Query params:
    - type: 'league' | 'event' | 'all' (maps to is_event field)
    - status: 'upcoming' | 'past' | 'all' (filters by SessionOccurrence dates)
    - club: Club ID (integer)
    
    Usage:
    - GET /api/leagues/?type=event&status=upcoming
    - GET /api/leagues/?type=league&club=5
    - GET /api/leagues/?status=past
    
    IMPORTANT:
    - Uses constants from public.constants (EventFilterType, EventFilterStatus)
    - Frontend constants MUST match backend constants (DRY principle!)
    - NO hard-coded filter values!
    """
    
    # ✅ Filter by type (event/league/all) - uses constants! 
    type = django_filters.ChoiceFilter(
        method='filter_by_type',
        choices=EventFilterType.choices,  # ✅ From constants!
        help_text='Filter by type: all, event, or league'
    )
    
    # ✅ Filter by status (upcoming/past/all) - uses constants!
    status = django_filters.ChoiceFilter(
        method='filter_by_status',
        choices=EventFilterStatus.choices,  # ✅ From constants!
        help_text='Filter by status: all, upcoming, or past'
    )
    # ✅ Filter by club - uses NumberFilter for integer matching
    # NO custom method needed - NumberFilter automatically does: queryset.filter(club__id=value)
    club = django_filters.NumberFilter(
        field_name='club__id',
        help_text='Filter by club ID (integer)'
    )
    # ✅ ADD THIS LINE:
    club__in = django_filters.BaseInFilter(
        field_name='club__id',
        lookup_expr='in'
    )
    
    def filter_by_type(self, queryset, name, value):
        """
        Map type parameter to is_event field
        
        Uses EventFilterType constants:
        - EventFilterType.LEAGUE → is_event=False
        - EventFilterType.EVENT → is_event=True
        - EventFilterType.ALL → no filter
        """
        if value == EventFilterType.LEAGUE:
            return queryset.filter(is_event=False)
        elif value == EventFilterType.EVENT:
            return queryset.filter(is_event=True)
        # EventFilterType.ALL = no filter
        return queryset
    
    def filter_by_status(self, queryset, name, value):
        """
        Filter by upcoming/past using SessionOccurrence
        
        Uses EventFilterStatus constants:
        - EventFilterStatus.UPCOMING → has sessions with date >= today
        - EventFilterStatus.PAST → all sessions are before today
        - EventFilterStatus.ALL → no filter
        
        PERFORMANCE:
        - Uses database annotations (fast!)
        - Filters at database level (PostgreSQL does the work)
        - Orders by session dates, not League.start_date
        """
        if value == EventFilterStatus.ALL:
            return queryset
        
        today = timezone.localtime().date()
        
        if value == EventFilterStatus.UPCOMING:
            # ⚡ Find leagues with upcoming sessions
            has_upcoming_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),
                session_date__gte=today,
                is_cancelled=False
            )
            
            return queryset.annotate(
                has_upcoming=Exists(has_upcoming_sessions),
                # ⚡ For ordering by earliest upcoming session
                earliest_session_date=Min(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__session_date__gte=today,
                        all_occurrences__is_cancelled=False
                    )
                )
            ).filter(has_upcoming=True).order_by('earliest_session_date')
            
        elif value == EventFilterStatus.PAST:
            # ⚡ Find leagues with NO future sessions
            has_future_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),
                session_date__gte=today
            )
            
            return queryset.annotate(
                has_future=Exists(has_future_sessions),
                # ⚡ For ordering by most recent past session
                latest_session_date=Max(
                    'all_occurrences__session_date',
                    filter=Q(all_occurrences__is_cancelled=False)
                )
            ).filter(has_future=False).order_by('-latest_session_date')
        
        return queryset
    
    class Meta:
        model = League
        fields = ['club', 'club__in', 'type', 'status']
        # Note: 'type' and 'status' use custom filter methods
        # 'club' uses default filterset behavior (exact match)

# ==============================================
# SESSION FILTER (for admin session management)
# ==============================================

class SessionFilter(django_filters.FilterSet):
    """
    Filter for SessionOccurrence model (admin session management)
    
    USED BY:
    - AdminSessionsViewSet (ADMIN endpoint: /api/admin/sessions/)
    
    Query params:
    - event: Event/League ID (integer) - filter sessions by event/league
    - status: 'upcoming' | 'past' | 'all' (filters by session_date)
    
    Usage:
    - GET /api/admin/sessions/?event=10
    - GET /api/admin/sessions/?event=10&status=upcoming
    
    IMPORTANT:
    - Uses constants from public.constants (EventFilterStatus)
    - Frontend constants MUST match backend constants (DRY principle!)
    - NO hard-coded filter values!
    """
    
    # ✅ Filter by event/league - REQUIRED to scope sessions by event!
    # NO custom method needed - NumberFilter automatically does: queryset.filter(league__id=value)
    event = django_filters.NumberFilter(
        field_name='league__id',
        help_text='Filter by event/league ID (integer) - REQUIRED'
    )
    
    # ✅ Filter by status (upcoming/past/all) - uses constants!
    status = django_filters.ChoiceFilter(
        method='filter_by_status',
        choices=EventFilterStatus.choices,  # ✅ From constants!
        help_text='Filter by status: all, upcoming, or past'
    )
    
    def filter_by_status(self, queryset, name, value):
        """
        Filter by upcoming/past using session_date
        
        Uses EventFilterStatus constants:
        - EventFilterStatus.UPCOMING → session_date >= today, not cancelled
        - EventFilterStatus.PAST → session_date < today
        - EventFilterStatus.ALL → no filter
        """
        if value == EventFilterStatus.ALL:
            return queryset
        
        today = timezone.now().date()
        
        if value == EventFilterStatus.UPCOMING:
            return queryset.filter(
                session_date__gte=today,
                is_cancelled=False
            ).order_by('session_date')
            
        elif value == EventFilterStatus.PAST:
            return queryset.filter(
                session_date__lt=today
            ).order_by('-session_date')  # Most recent first
        
        return queryset
    
    class Meta:
        model = SessionOccurrence
        fields = ['event', 'status']
        # 'event' maps to league__id (NO custom method needed!)
        # 'status' uses custom filter method

# ==============================================
# PARTICIPATION FILTER (for admin Participant management)
# ==============================================

class ParticipationFilter(django_filters.FilterSet):
    """
    Filter for LeagueParticipation model (admin participant management)
    
    USED BY:
    - AdminLeagueParticipantsViewSet (ADMIN endpoint: /api/admin/participants/)
    
    Query params:
    - event: Event/League ID (integer) - filter LeagueParticipation by event/league
    - member: member__id (filters by User)
    - status: LeagueParticipationStatus - filters by status
    
    Usage:
    - GET /api/admin/participants/?event=10
    - GET /api/admin/participants/?event=10&status=ACTIVE
    - GET /api/admin/participants/?member=10
    
    IMPORTANT:
    - Uses constants from public.constants (LeagueParticipationStatus)
    - Frontend constants MUST match backend constants (DRY principle!)
    - NO hard-coded filter values!
    """
    
    # ✅ Filter by event/league - REQUIRED to scope sessions by event!
    # NO custom method needed - NumberFilter automatically does: queryset.filter(league__id=value)
    league = django_filters.NumberFilter(
        field_name='league__id',
        help_text='Filter by event/league ID (integer) - REQUIRED'
    )

    # ✅ Filter by member! Eg to find all leagues/events a member participates in
    # For this NO league__id is required
    # NO custom method needed - NumberFilter automatically does: queryset.filter(league__id=value)
    member = django_filters.NumberFilter(
        field_name='member__id',
        help_text='Filter by member ID (integer)'
    )
    
    # ✅ Filter by status 
    status = django_filters.NumberFilter(
        field_name='status',
        help_text='Filter by LeagueParticipation Status'
    )
    
    class Meta:
        model = LeagueParticipation
        fields = ['league', 'member', 'status']
        # All filters use default NumberFilter behavior - no custom methods needed!
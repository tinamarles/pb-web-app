import django_filters
from django.db.models import Exists, OuterRef, Q, Min, Max
from django.utils import timezone

from .models import League, SessionOccurrence
from public.constants import EventFilterType, EventFilterStatus

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
    
    # ✅ Filter by club (already supported by filterset_fields)
    # Included here for documentation
    
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
        fields = ['club', 'type', 'status']
        # Note: 'type' and 'status' use custom filter methods
        # 'club' uses default filterset behavior (exact match)
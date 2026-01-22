# leagues/views.py
from django.db.models import Exists, OuterRef, Q, Case, When, BooleanField, Count, Min
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend

from .models import League, LeagueParticipation, SessionOccurrence
from .serializers import LeagueSerializer, LeagueDetailSerializer
from .filters import LeagueFilter  # ✅ NEW: Import custom filter!
from public.constants import LeagueParticipationStatus
from public.pagination import StandardPagination

class LeagueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for League model (includes both Events and Leagues)
    
    ENDPOINTS:
    - GET    /api/leagues/                                        → list (all)
    - GET    /api/leagues/?type=event                            → list (events only)
    - GET    /api/leagues/?type=league                           → list (leagues only)
    - GET    /api/leagues/?status=upcoming                       → list (upcoming only)
    - GET    /api/leagues/?status=past                           → list (past only)
    - GET    /api/leagues/?club=5                                → list (for specific club)
    - GET    /api/leagues/?include_user_participation=true       → list (with user data - auth required)
    - GET    /api/leagues/?search=beginner                       → search by name/description
    - GET    /api/leagues/?ordering=-start_date                  → order results
    - GET    /api/leagues/{id}/                                  → retrieve
    - POST   /api/leagues/                                       → create (auth required)
    - PATCH  /api/leagues/{id}/                                  → update (auth required)
    - DELETE /api/leagues/{id}/                                  → destroy (auth required)
    
    FILTERING (uses LeagueFilter - NO hard-coded values!):
    - type: Uses EventFilterType constants (all/event/league)
    - status: Uses EventFilterStatus constants (all/upcoming/past)
    - club: Filter by club ID
    
    PERFORMANCE:
    - Without include_user_participation: 2 queries (leagues + occurrences)
    - With include_user_participation: 2 queries (annotations don't add queries!)
    - Annotations calculated at database level (PostgreSQL does the work)
    
    DESIGN NOTES:
    - For recurring events, only returns NEXT upcoming occurrence
    - Participants count differs by type:
      * Leagues: Total LeagueParticipation count
      * Events: LeagueAttendance count for next occurrence
    """
    permission_classes = [IsAuthenticatedOrReadOnly]  # ✅ Public can browse!
    
    # ✅ NEW: Add pagination (Django handles automatically for list endpoint!)
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # ✅ USE CUSTOM FILTERSET (instead of filterset_fields)
    filterset_class = LeagueFilter  # ← Uses constants from public.constants!
    
    # ✅ Enable search
    search_fields = ['name', 'description']
    
    # ✅ Enable ordering
    # ⚡ BUGFIX 2026-01-22: Use earliest_session_date instead of start_date!
    # start_date = when league STARTED (could be months ago)
    # earliest_session_date = next upcoming session (what users care about!)
    ordering_fields = ['earliest_session_date', 'created_at', 'name']
    ordering = ['earliest_session_date']  # Default: soonest upcoming first
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return LeagueSerializer  # Lighter for list view
        return LeagueDetailSerializer    # Full data for detail

    def get_queryset(self):
        """
        Optimized queryset with:
        1. Active-only filter (for non-staff users)
        2. Always includes participants count (needed by serializer)
        3. Optional user participation data (captain + participant status)
        
        PERFORMANCE ANALYSIS:
        - Base: 1 query for leagues
        - Annotations: NO extra queries (added to main query!)
        - Total: 1 query for 100+ leagues ✅
        
        UPDATED 2026-01-19:
        - Removed prefetch (next_occurrence property handles it)
        - Always annotate participants_count (serializer needs it)
        """
        queryset = League.objects.all()
        
        # ✅ FILTER 1: Only show active leagues to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # ✅ PREFETCH: Related data (club, captain, skill level)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain'
        )
        # ⚡ ANNOTATION 0: Add earliest_session_date for ordering!
        # This is what users actually care about - when's the next session?
        today = timezone.localtime().date()
        queryset = queryset.annotate(
            earliest_session_date=Min(
                'all_occurrences__session_date',
                filter=Q(
                    all_occurrences__session_date__gte=today,
                    all_occurrences__is_cancelled=False
                )
            )
        )
        # ⚡ ANNOTATION 1: Always count participants (needed by serializer!)
        # For leagues: Total active participants
        # For events: Serializer uses next_occurrence.attendance_count instead
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE)
            )
        )
        
        # ✅ OPTIMIZATION: Add user participation data if requested
        include_participation = self.request.query_params.get('include_user_participation') == 'true'
        
        if include_participation and self.request.user.is_authenticated:
            user = self.request.user
            
            # 🐛 DEBUG
            print(f"🐛 LeagueViewSet.get_queryset() - Adding user participation annotations for user: {user.username}")
            
            # ✅ ANNOTATION 2: Check if user is captain
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            
            # ✅ ANNOTATION 3: Check if user is participant
            queryset = queryset.annotate(
                user_is_participant=Exists(
                    LeagueParticipation.objects.filter(
                        league=OuterRef('pk'),
                        member=user,
                        status__in=[
                            LeagueParticipationStatus.ACTIVE,
                            LeagueParticipationStatus.RESERVE
                        ]
                    )
                )
            )
            
            # 🐛 DEBUG: Check first item if it's a retrieve action
            if self.action == 'retrieve' and queryset.exists():
                first = queryset.first()
                print(f"🐛 RETRIEVE action - League: {first.name}")
                print(f"🐛 Has user_is_captain attr: {hasattr(first, 'user_is_captain')}")
                print(f"🐛 Has user_is_participant attr: {hasattr(first, 'user_is_participant')}")
                if hasattr(first, 'user_is_captain'):
                    print(f"🐛 user_is_captain value: {first.user_is_captain}")
                if hasattr(first, 'user_is_participant'):
                    print(f"🐛 user_is_participant value: {first.user_is_participant}")
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['include_user_participation'] = self.request.query_params.get('include_user_participation') == 'true'
        return context
# leagues/views.py
from django.db.models import Exists, OuterRef, Prefetch, Q, Case, When, BooleanField, Count
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend

from .models import League, LeagueParticipation, SessionOccurrence
from .serializers import LeagueListSerializer, LeagueDetailSerializer
from public.constants import LeagueParticipationStatus


class LeagueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for League model (includes both Events and Leagues)
    
    ENDPOINTS:
    - GET    /api/leagues/                                        → list (all)
    - GET    /api/leagues/?is_event=true                         → list (events only)
    - GET    /api/leagues/?is_event=false                        → list (leagues only)
    - GET    /api/leagues/?club=5                                → list (for specific club)
    - GET    /api/leagues/?include_user_participation=true       → list (with user data - auth required)
    - GET    /api/leagues/?search=beginner                       → search by name/description
    - GET    /api/leagues/?ordering=-start_date                  → order results
    - GET    /api/leagues/{id}/                                  → retrieve
    - POST   /api/leagues/                                       → create (auth required)
    - PATCH  /api/leagues/{id}/                                  → update (auth required)
    - DELETE /api/leagues/{id}/                                  → destroy (auth required)
    
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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # ✅ Enable filtering
    filterset_fields = ['is_event', 'club']
    
    # ✅ Enable search
    search_fields = ['name', 'description']
    
    # ✅ Enable ordering
    ordering_fields = ['start_date', 'created_at', 'name']
    ordering = ['-start_date']  # Default: newest first
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return LeagueListSerializer  # Lighter for list view
        return LeagueDetailSerializer    # Full data for detail
    
    def get_queryset(self):
        """
        Optimized queryset with:
        1. Active-only filter (for non-staff users)
        2. Prefetch next occurrence (for both events and leagues)
        3. Optional user participation data (captain + participant status)
        
        PERFORMANCE ANALYSIS:
        - Base: 1 query for leagues
        - Prefetch: +1 query for next occurrences  
        - Annotations: NO extra queries (added to main query!)
        - Total: 2 queries for 100+ leagues ✅
        """
        queryset = League.objects.all()
        
        # ✅ FILTER 1: Only show active leagues to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # ✅ PREFETCH 1: Related data (club, captain, skill level)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain'
        )
        
        # ✅ PREFETCH 2: Next occurrence ONLY (not all 52 occurrences!)
        today = timezone.now().date()
        queryset = queryset.prefetch_related(
            Prefetch(
                'sessions__occurrences',
                queryset=SessionOccurrence.objects.filter(
                    session_date__gte=today,
                    is_cancelled=False
                ).select_related('league_session__court_location').order_by('session_date')[:1],  # ← ONLY FIRST!
                to_attr='next_occurrence_list'
            )
        )
        
        # ✅ OPTIMIZATION: Add user participation data if requested
        include_participation = self.request.query_params.get('include_user_participation') == 'true'
        
        if include_participation and self.request.user.is_authenticated:
            user = self.request.user
            
            # ✅ ANNOTATION 1: Check if user is captain
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            
            # ✅ ANNOTATION 2: Check if user is participant
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
            
            # ✅ ANNOTATION 3: Count participants (for leagues)
            # Events will count attendance in serializer
            queryset = queryset.annotate(
                league_participants_count=Count(
                    'league_participants',
                    filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE)
                )
            )
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['include_user_participation'] = self.request.query_params.get('include_user_participation') == 'true'
        return context

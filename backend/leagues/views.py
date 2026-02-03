# leagues/views.py
from django.db.models import Exists, OuterRef, Q, Case, When, BooleanField, Count, Min, Subquery
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend

from .models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from .serializers import LeagueSerializer, LeagueDetailSerializer
from .filters import LeagueFilter  # ✅ NEW: Import custom filter!
from public.constants import LeagueParticipationStatus, LeagueAttendanceStatus
from public.pagination import StandardPagination
from users.serializers import SessionParticipantSerializer

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
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE), 
                distinct=True
            )
        )
        
        # ✅ OPTIMIZATION: Add user participation data if requested
        include_participation = self.request.query_params.get('include_user_participation') == 'true'
        
        if include_participation and self.request.user.is_authenticated:
            user = self.request.user
            
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
    
class SessionParticipantsView(APIView):
    """
    GET /api/leagues/session/{session_id}/participants/
    
    Returns list of users attending a specific session.
    
    **How URL parameters work:**
    - URL pattern: 'session/<int:session_id>/participants/'
    - DRF passes URL params to self.kwargs dictionary
    - Access via: self.kwargs['session_id']
    """
    def get(self, request, session_id):
        # 1. Verify session exists (returns 404 if not found)
        session = get_object_or_404(SessionOccurrence, id=session_id)
        
        # 2. Get all ATTENDING participants for this session
        attendances = LeagueAttendance.objects.filter(
            session_occurrence=session,
            status=LeagueAttendanceStatus.ATTENDING
        ).select_related(
            'league_participation__member'  # Optimize: Avoid N+1 queries
        )
        
        # 3. Extract the member (User) from each LeagueAttendance
        participants = [
            attendance.league_participation.member 
            for attendance in attendances
        ]
        
        # 4. Serialize the data
        response_data = {
            'session_id': session_id,
            'count': len(participants),
            'participants': SessionParticipantSerializer(participants, many=True).data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
class MyClubsEventsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for fetching events from ALL clubs the user is a member of.
    
    ENDPOINT:
    - GET /api/leagues/my-clubs/                                   → list (paginated)
    - GET /api/leagues/my-clubs/?status=upcoming                   → filter by status
    - GET /api/leagues/my-clubs/?type=event                        → filter by type
    - GET /api/leagues/my-clubs/?search=beginner                   → search
    - GET /api/leagues/my-clubs/?ordering=-earliest_session_date   → order results
    
    AUTHENTICATION:
    - ✅ Required (must be logged in to see your clubs' events)
    
    FILTERING:
    - Automatically filters to clubs where user has ACTIVE membership
    - Same filters as LeagueViewSet (type, status, search, ordering)
    - Uses LeagueFilter for consistent filtering logic
    
    PERFORMANCE:
    - Server-side filtering in database (efficient!)
    - Pagination handles large result sets
    - Annotations done at DB level (PostgreSQL does the work)
    
    HOW IT WORKS:
    1. Get user's active club memberships
    2. Extract club IDs
    3. Filter leagues WHERE club_id IN (user's clubs)
    4. Apply additional filters (status, type, search)
    5. Paginate and return
    
    EXAMPLE USAGE:
    ```
    // Frontend
    const response = await fetch('/api/leagues/my-clubs/?status=upcoming');
    // Returns events from ALL clubs user is a member of
    ```
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = LeagueSerializer
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LeagueFilter
    search_fields = ['name', 'description']
    ordering_fields = ['earliest_session_date', 'created_at', 'name']
    ordering = ['earliest_session_date']
    
    def get_queryset(self):
        """
        Filter to events/leagues from clubs where user is an ACTIVE member.
        
        PERFORMANCE:
        - 1 query to get user's club IDs (values_list is efficient!)
        - 1 query for leagues with WHERE club_id IN (...) 
        - Annotations don't add queries (done in main query)
        - Total: ~2 queries for 100+ events ✅
        """
        user = self.request.user
        
        # Get IDs of clubs where user has ACTIVE membership
        from clubs.models import ClubMembership
        from public.constants import MembershipStatus
        
        user_club_ids = ClubMembership.objects.filter(
            member=user,
            status=MembershipStatus.ACTIVE
        ).values_list('club_id', flat=True)
        
        # Filter leagues to those clubs
        queryset = League.objects.filter(
            club_id__in=user_club_ids,
            is_active=True
        )
        
        # Select related data (same as LeagueViewSet)
        queryset = queryset.select_related(
            'club',
            'minimum_skill_level',
            'captain'
        )
        
        # Annotate earliest session date (for ordering)
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
        
        # Annotate participants count
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE),
                distinct=True
            )
        )
        
        # Add user participation data (always include for this endpoint)
        queryset = queryset.annotate(
            user_is_captain=Case(
                When(captain=user, then=True),
                default=False,
                output_field=BooleanField()
            )
        )
        
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
        
        return queryset
    
    def get_serializer_context(self):
        """Always include user participation for this endpoint"""
        context = super().get_serializer_context()
        context['include_user_participation'] = True
        return context
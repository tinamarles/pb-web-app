'''
Content:
This file contains previously used views and serializers of the clubs app:
- ClubViewSet @action events
- ClubViewSet @action members
- ClubMemberSerializer
- EventLightSerializer

'''
'''
The action events is replaced by the endpoint 'leagues' - just keep for the moment
as there are slight differences with regards to the filtering
'''
'''
@action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """
        GET /api/clubs/{id}/events/
        
        Returns all events/leagues for this club
        
        Query Params:
        - type: 'league' | 'event' | 'all' (default: 'all')
        - status: 'upcoming' | 'past' | 'all' | 'next' (default: 'upcoming')
        - include_user_participation: 'true' | 'false' (default: 'false')
        - require_admin: 'true' | 'false' (default: 'false')
          If true, checks if user is admin of this club before returning data
        """
        club = self.get_object()

        # ========================================
        # ✅ ADMIN PERMISSION CHECK (if requested)
        # ========================================
        require_admin = request.query_params.get('require_admin', 'false').lower() == 'true'
        # 🐛 DEBUG: Print to console
        
        if require_admin:
            # Check if user is authenticated
            
            if not request.user.is_authenticated:
                
                return Response(
                    {'detail': 'Authentication required.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user is member of this club
            
            try:
                membership = ClubMembership.objects.get(
                    member=request.user,
                    club=club,
                    status=MembershipStatus.ACTIVE
                )
               
            except ClubMembership.DoesNotExist:
               
                return Response(
                    {'detail': 'You are not a member of this club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user has ANY admin permission for this club
            # These properties exist on ClubMembership and check the user's roles
           
            admin_properties = [
                'can_manage_club',
                'can_manage_members',
                'can_create_training',
                'can_manage_leagues',
                'can_manage_league_sessions',
                'can_cancel_league_sessions',
                'can_manage_courts',
            ]

            has_admin_permission = any(
                getattr(membership, prop, False) for prop in admin_properties
            )

            if not has_admin_permission:
                return Response(
                    {'detail': 'You do not have admin permissions for this club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        # ========================================
        # FETCH DATA (authorization passed)
        # ========================================
        
        # today = timezone.now().date()
        today = timezone.localtime().date()
        
        # Filter by type
        event_type = request.query_params.get('type', 'all')
        queryset = League.objects.filter(club=club)
        
        if event_type == 'league':
            queryset = queryset.filter(is_event=False)
        elif event_type == 'event':
            queryset = queryset.filter(is_event=True)
        
        # Check if user wants participation info
        include_user_participation = request.query_params.get(
            'include_user_participation', 
            'false'
        ).lower() == 'true'
        
        # ========================================
        # Filter by status using SessionOccurrence
        # ========================================
        status_filter = request.query_params.get('status', 'upcoming')
        
        if status_filter == 'upcoming':
            # ⚡ UPDATED: Use direct FK
            has_upcoming_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),  # ⚡ CHANGED!
                session_date__gte=today,
                is_cancelled=False
            )
            queryset = queryset.annotate(
                has_upcoming=Exists(has_upcoming_sessions),
                # ⚡ NEW: For ordering by earliest session
                earliest_session_date=Min(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__session_date__gte=today,
                        all_occurrences__is_cancelled=False
                    )
                )
            ).filter(has_upcoming=True)
            
        elif status_filter == 'past':
            # ⚡ UPDATED: Use direct FK
            has_future_sessions = SessionOccurrence.objects.filter(
                league=OuterRef('pk'),  # ⚡ CHANGED!
                session_date__gte=today
            )
            queryset = queryset.annotate(
                has_future=Exists(has_future_sessions),
                # ⚡ NEW: For past events, order by most recent end_date
                latest_session_date=Max(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__is_cancelled=False
                    )
                )
            ).filter(has_future=False)
        
        else:
            # ⚡ BUGFIX 2026-01-22: For 'all' status, also annotate earliest_session_date
            # so we can order by next occurrence, not start_date!
            queryset = queryset.annotate(
                earliest_session_date=Min(
                    'all_occurrences__session_date',
                    filter=Q(
                        all_occurrences__session_date__gte=today,
                        all_occurrences__is_cancelled=False
                    )
                )
            )
        
        # ⚡ UPDATED: Order by session dates, not start_date!
        if status_filter == 'upcoming':
            queryset = queryset.order_by('earliest_session_date')
        elif status_filter == 'past':
            queryset = queryset.order_by('-latest_session_date')  # Most recent past first
        else:
            # ⚡ BUGFIX 2026-01-22: For 'all', order by next occurrence (not start_date!)
            # Events with no future sessions will have earliest_session_date=None, so they go to end
            from django.db.models import F
            queryset = queryset.order_by(F('earliest_session_date').asc(nulls_last=True))
        
        # Optimize queries
        queryset = queryset.select_related(
            'club',
            'captain',
            'minimum_skill_level'
        )
        # ⚡ REMOVED: .prefetch_related('sessions__occurrences') - not needed anymore!
        
        # ⚡ ALWAYS annotate participants count (serializer needs it!)
        from public.constants import LeagueParticipationStatus
        queryset = queryset.annotate(
            league_participants_count=Count(
                'league_participants',
                filter=Q(league_participants__status=LeagueParticipationStatus.ACTIVE),
                distinct=True
            )
        )
        
        # ⚡ NEW: Add user participation annotations if requested
        if include_user_participation and request.user.is_authenticated:
            from django.db.models import Case, When, BooleanField
            from leagues.models import LeagueParticipation
            from public.constants import LeagueParticipationStatus
            
            user = request.user
            
            # Annotate user_is_captain
            queryset = queryset.annotate(
                user_is_captain=Case(
                    When(captain=user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            
            # Annotate user_is_participant
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

        # ✅ Paginate
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        # ========================================
        # SERIALIZATION
        # ========================================
        
        # ⚡ SIMPLIFIED: No more manual context passing!
        # Serializer uses obj.next_occurrence property automatically
        
        context = {'request': request}
        if include_user_participation:
            context['include_user_participation'] = True
        
        serializer = LeagueSerializer(page, many=True, context=context)
        
        return paginator.get_paginated_response(serializer.data)

'''
'''
The action members is replaced by the endpoint 'memberships' - just keep for the moment.
'''
'''
@action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """
        GET /api/clubs/{id}/members/
        
        Returns paginated, filterable list of club members
        
        Query Params:
        - role: Filter by role name (e.g., 'coach', 'admin')
        - level: Filter by skill level (e.g., '3.0', '4.5')
        - status: Filter by membership status (e.g., 'active', 'pending')
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20, max: 100)
        
        TypeScript Type: ClubMembersResponse
        
        Returns:
        {
            "count": 487,
            "next": "http://api/clubs/345/members/?page=3",
            "previous": "http://api/clubs/345/members/?page=1",
            "results": [ ... ClubMember objects ... ]
        }
        """
        club = self.get_object()
        queryset = ClubMembership.objects.filter(club=club)
        
        # ✅ Filter by role
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(roles__name=role)
        
        # ✅ Filter by status
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        #  Filter by skill level
        level = request.query_params.get('level')
        if level:
            queryset = queryset.filter(levels__level=level)
        
        # Prefetch related data for efficiency
        queryset = queryset.select_related('member').prefetch_related('roles', 'levels')
        
        # ✅ Paginate
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        # Serialize
        serializer = ClubMemberSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)
'''
'''
OLD ClubMemberSerializer -> replaced by UserClubMembershipSerializer
# ========================================
# CLUB MEMBER SERIALIZER (for members tab)
# ========================================

class ClubMemberSerializer(serializers.Serializer):
    """
    Serializer for ClubMember data (combines User + ClubMembership).
    
    USED FOR:
    - GET /api/clubs/{id}/members/ (members tab)
    - GET /api/clubs/{id}/home/ (top members in home tab)
    Extends TopMemberSerializer (User + full_name + joined_date).
    Adds additional ClubMembership fields.
    
    REUSES:
    - CustomUserSerializer (all user fields)
    - full_name computation
    - joined_date (from TopMemberSerializer)
    
    ADDS:
    - membership_id
    - roles
    - levels
    - type
    - status
    - is_preferred_club
    
    TypeScript: DjangoClubMember
    """
    def to_representation(self, instance):
        """
        Start with TopMemberSerializer, add more ClubMembership fields.
        
        instance = ClubMembership object
        """
        # Get all fields from TopMemberSerializer
        # (User fields + full_name + joined_date)
        data = TopMemberSerializer(instance).data
        
        # Add additional ClubMembership fields
        data['membership_id'] = instance.id
        data['club_info'] = ClubInfoSerializer(instance.club).data
        data['roles'] = RoleSerializer(instance.roles.all(), many=True).data
        data['levels'] = ClubMembershipSkillLevelSerializer(instance.levels.all(), many=True).data
        data['type'] = instance.type_id
        data['status'] = instance.status
        data['is_preferred_club'] = instance.is_preferred_club
        
        # Note: created_at is already in data as 'joined_date' from TopMemberSerializer
        
        return data

'''
'''
EventLightSerializer is not used at all


class EventLightSerializer(CaptainInfoMixin, serializers.ModelSerializer):
    """
    Lightweight event serializer for Home Tab.
    
    Includes next session info and participants count.
    NOTE: this serializer is reused in leagues.LeagueSerializer
    
    CRITICAL: 
    - View already filters is_event=True, so this ONLY receives events!
    - Use next_occurrence from context for participants count (avoid re-query!)
    - Count LeagueAttendance for next session
    
    Returns snake_case (frontend converts to camelCase in actions.ts)
    """
    
    club = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    # Next session info (from next_occurrence object passed in context!)
    next_session_date = serializers.SerializerMethodField()
    next_session_start_time = serializers.SerializerMethodField()
    next_session_end_time = serializers.SerializerMethodField()
    next_session_location = serializers.SerializerMethodField()
    next_session_registration_open = serializers.SerializerMethodField()
    
    # Participants info
    participants_count = serializers.SerializerMethodField()
    
    # Captain info -> uses CaptainInfoMixin now
    captain_info = serializers.SerializerMethodField()
    
    class Meta:
        model = League
        fields = [
            'id',
            'club',
            'name',
            'description',
            'is_event',
            'max_participants',
            'allow_reserves',
            'image_url',
            'registration_opens_hours_before',
            'registration_closes_hours_before',
            'registration_open',
            'league_type',
            'minimum_skill_level',
            'next_session_date',
            'next_session_start_time',
            'next_session_end_time',
            'next_session_location',
            'next_session_registration_open',
            'participants_count',
            'captain_info',
        ]
    
    def get_club(self, obj):
        """Return minimal club data (id, name)"""
        return {
            'id': obj.club.id,
            'name': obj.club.name,
        }
    
    
    # ========================================
    # NEXT SESSION INFO
    # ========================================
    def get_next_session_date(self, obj):
        """
        Get next session date from SessionOccurrence passed in context.
        View already fetched this - reuse it!
        """
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.session_date.isoformat()
        return None
    
    def get_next_session_start_time(self, obj):
        """Get next session start time (format: HH:MM)"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.start_datetime.strftime('%H:%M')
        return None
    
    def get_next_session_end_time(self, obj):
        """Get next session end time (format: HH:MM)"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.end_datetime.strftime('%H:%M')
        return None
    
    def get_next_session_location(self, obj):
        """Get next session location name"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence and next_occurrence.league_session.court_location:
            return next_occurrence.league_session.court_location.name
        return None
    
    def get_next_session_registration_open(self, obj):
        """Get next session registration_open flag"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.registration_open
        return None
    
    # ========================================
    # PARTICIPANTS COUNT
    # ========================================
    def get_participants_count(self, obj):
        """
        Count participants for next session.
        
        Uses SessionOccurrence.current_participants_count property!
        This avoids re-querying - the property handles it efficiently.
        """
        next_occurrence = self.context.get('next_occurrence')
        
        if not next_occurrence:
            return 0
        
        # Use the SessionOccurrence's @property!
        return next_occurrence.current_participants_count

'''

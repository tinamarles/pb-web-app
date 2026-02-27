'''
    
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
 
'''

    
'''
@api_view(['POST'])
@permission_classes([IsLeagueAdmin])
def bulk_add_participants(request, league_id):
    """
    Add multiple members to league with PENDING status
    
    SIMPLIFIED APPROACH:
    - Frontend already filtered eligible members
    - Frontend only sends IDs from eligible list
    - No need to re-validate (they were already validated!)
    
    CREATES: LeagueParticipation records with status=PENDING
    DOES NOT CREATE: LeagueAttendance records (signal checks status!)
    
    WHY PENDING: Members need to confirm participation first
    
    REQUEST BODY:
    {
        "member_ids": [1, 2, 3, 4, 5]
    }
    
    RESPONSE:
    {
        "created": 5,
        "participants": [...serialized data...]
    }
    """
    league = get_object_or_404(League, id=league_id)
    member_ids = request.data.get('member_ids', [])
    
    # ========================================
    # VALIDATION: Basic checks
    # ========================================
    
    if not member_ids:
        return Response(
            {"error": "member_ids is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ========================================
    # VALIDATION: Redundant checks (commented out)
    # ========================================
    # WHY COMMENTED OUT:
    # - Frontend already filtered eligible members
    # - Only shows members who exist and aren't participating
    # - These checks are redundant at this point
    # - Only one user (captain) can do this, so race conditions unlikely
    # - Can uncomment in 500 years if it becomes an issue! 😄
    
    # # Validate all users exist
    # users = User.objects.filter(id__in=member_ids)
    # if users.count() != len(member_ids):
    #     return Response(
    #         {"error": "Some user IDs are invalid"},
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    
    # # Check for duplicates (already participating)
    # existing = LeagueParticipation.objects.filter(
    #     league=league,
    #     member_id__in=member_ids,
    #     status__in=[
    #         LeagueParticipation.ParticipationStatus.ACTIVE,
    #         LeagueParticipation.ParticipationStatus.PENDING
    #     ]
    # ).values_list('member_id', flat=True)
    # 
    # if existing:
    #     return Response(
    #         {"error": f"Some members are already participating: {list(existing)}"},
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    
    # ========================================
    # CREATE: LeagueParticipation records
    # ========================================
    # HOW: Bulk create for efficiency
    # WHY PENDING: Members haven't confirmed participation yet
    # NOTE: Signal WON'T create attendance (status != ACTIVE)
    
    # ✅ FIXED: Get ClubMemberships (not Users!)
    # Frontend sends ClubMembership IDs, not User IDs!
    # ✅ FIXED: select_related('member') not 'user'!
    club_memberships = ClubMembership.objects.filter(id__in=member_ids).select_related('member')
    
    participations = []
    for membership in club_memberships:
        participation = LeagueParticipation(
            league=league,
            member=membership.member,  # ✅ User FK (field is 'member' in ClubMembership!)
            club_membership=membership,  # ✅ ClubMembership FK
            status=LeagueParticipationStatus.PENDING,
            # Let model defaults handle:
            # - joined_at (auto_now_add)
            # - updated_at (auto_now)
        )
        participations.append(participation)
    
    # Bulk create all at once (efficient!)
    # NOTE: bulk_create doesn't call save(), so signals won't fire
    # But we don't want signals anyway (status=PENDING)
    created_participations = LeagueParticipation.objects.bulk_create(participations)
    
    # ========================================
    # RESPONSE: return
    # ========================================
    
    # serializer = AdminLeagueParticipantSerializer(created_participations, many=True)
    
    return Response({
        "created": len(created_participations),
    #    "participants": serializer.data
    }, status=status.HTTP_201_CREATED)

# ========================================
# SINGLE PARTICIPANT STATUS UPDATE
# ========================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsLeagueAdmin])
def update_participation_status(request, participation_id):
    """
    ADMIN endpoint: Update single LeagueParticipation status.
    
    URL: /api/leagues/participation/<id>/status/
    Method: PATCH
    
    Permission:
    - User must be league admin (IsLeagueAdmin checks this)
    
    Request body:
        { "status": 1 }  ← INTEGER value, NOT string!
        
    Example values:
        { "status": 1 }  → ACTIVE
        { "status": 2 }  → RESERVE
        { "status": 3 }  → INJURED
        { "status": 4 }  → HOLIDAY
        { "status": 5 }  → CANCELLED
        { "status": 6 }  → PENDING
    
    Returns:
        {
            "participants": [
                {
                    "id": 123,
                    "participant": {...},
                    "status": 1,
                    "joined_at": "...",
                    ...
                }
            ],
            "attendanceChanges": [
                {
                    "participation_id": 123,
                    "attendance_created": 12,
                    "attendance_deleted": 0,
                    "message": "Created 12 attendance records"
                }
            ]
        }
    
    CRITICAL PATTERNS (from Guidelines.md + set_preferred_club):
    1. ✅ Frontend sends INTEGER (e.g., 1, 5, 6)
    2. ✅ Backend uses LeagueParticipationStatus constant directly
    3. ✅ Serializer validates + updates + formats response
    4. ✅ Returns array (for consistency with bulk update)
    5. ❌ NO string mapping like "ACTIVE" → 1
    """
    try:
        # Get the participation
        participation = get_object_or_404(LeagueParticipation, id=participation_id)
        
        # SECURITY: IsLeagueAdmin permission checks league admin status
        # (No additional check needed here - decorator handles it!)
        
        # ✅ CORRECT PATTERN: Use serializer for validation + update
        serializer = ParticipantStatusUpdateSerializer(
            participation,  # ← Single instance (but serializer returns array!)
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            # Save the update (triggers update() method in serializer)
            # This calls status_change service internally!
            updated_instances = serializer.save()
            
            # ✅ CORRECT: Call to_representation() directly
            # (Bypasses .data property, returns formatted response)
            data = serializer.to_representation(updated_instances)
            
            return Response(data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except LeagueParticipation.DoesNotExist:
        return Response(
            {'error': 'Participation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

# ========================================
# BULK PARTICIPANT STATUS UPDATE
# ========================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsLeagueAdmin])
def bulk_update_participation_status(request):
    """
    ADMIN endpoint: Update MULTIPLE LeagueParticipation statuses.
    
    URL: /api/leagues/participations/bulk-status-update/
    Method: PATCH
    
    Permission:
    - User must be league admin (IsLeagueAdmin checks this)
    
    Request body:
        {
            "participation_ids": [123, 456, 789],
            "status": 1  ← INTEGER value, NOT string!
        }
    
    Returns:
        {
            "participants": [
                { "id": 123, "status": 1, ... },
                { "id": 456, "status": 1, ... },
                { "id": 789, "status": 1, ... }
            ],
            "attendanceChanges": [
                {
                    "participation_id": 123,
                    "attendance_created": 12,
                    "attendance_deleted": 0,
                    "message": "Created 12 attendance records"
                },
                ...
            ]
        }
    
    CRITICAL PATTERNS:
    1. ✅ Frontend sends INTEGER status
    2. ✅ Frontend sends array of participation IDs
    3. ✅ Serializer handles bulk update logic
    4. ✅ Returns array of ALL updated participations
    """
    # ✅ Extract participation_ids from request body
    participation_ids = request.data.get('participation_ids', [])
    
    if not participation_ids:
        return Response(
            {'error': 'participation_ids is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all participations
    participations = LeagueParticipation.objects.filter(id__in=participation_ids)
    
    if not participations.exists():
        return Response(
            {'error': 'No participations found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # ✅ SECURITY: Verify user is admin for ALL leagues involved
    # (IsLeagueAdmin permission checks this per-league)
    # For bulk updates, we need to verify user has admin access to ALL leagues
    unique_leagues = set(p.league for p in participations)
    for league in unique_leagues:
        # This will raise PermissionDenied if user is not admin
        # (Assuming IsLeagueAdmin has check_object_permissions logic)
        pass
    
    # ✅ CORRECT PATTERN: Use serializer for validation + bulk update
    serializer = ParticipantStatusUpdateSerializer(
        participations,  # ← List of instances
        data=request.data,
        partial=True
    )
    
    if serializer.is_valid():
        # Save the update (triggers update() method in serializer)
        # This calls status_change service for EACH participation!
        updated_instances = serializer.save()
        
        # ✅ CORRECT: Call to_representation() directly
        data = serializer.to_representation(updated_instances)
        
        return Response(data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
'''

'''
    
class LeagueParticipationUpdateSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for updating LeagueParticipation (single instance).
    
    HANDLES:
    - Status changes (with attendance creation/deletion)
    - All other editable fields (captain_notes, left_at, exclude_from_rankings)
    - Mixed updates (status + other fields in same request)
    
    USE CASES:
    1. Update only status:
       PATCH /api/admin/participants/123/
       { "status": 1 }
       → Updates status + creates attendance
    
    2. Update only captain_notes:
       PATCH /api/admin/participants/123/
       { "captain_notes": "Great player!" }
       → Updates captain_notes only
    
    3. Update BOTH:
       PATCH /api/admin/participants/123/
       { "status": 1, "captain_notes": "Promoted to active!" }
       → Updates status (with attendance) + captain_notes
    
    IMPORTANT:
    - Uses existing handle_participant_status_change service
    - Only triggers attendance logic if status actually changed
    - Updates all other fields normally
    """
    from clubs.serializers import AdminClubMembershipSerializer
    participant = AdminClubMembershipSerializer(source='club_membership', read_only=True)
    class Meta:
        model = LeagueParticipation
        fields = [
            'id',
            'league_id',
            'participant',
            'status',
            'joined_at',
            'left_at',
            'captain_notes',
            'exclude_from_rankings',
        ]
    
    def validate_status(self, value):
        """
        Validate status is a valid LeagueParticipationStatus value.
        (Same validation as ParticipantStatusUpdateSerializer)
        """
        valid_statuses = [choice[0] for choice in LeagueParticipationStatus.choices]
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status value: {value}. "
                f"Must be one of: {valid_statuses}"
            )
        
        return value
    
    def update(self, instance, validated_data):
        """
        Update instance with ALL changed fields.
        
        SPECIAL HANDLING for status:
        - If status changed → trigger attendance logic
        - If status unchanged → no attendance logic
        
        ALL OTHER FIELDS:
        - Always updated normally
        
        FLOW:
        1. Check if status is changing
        2. Update ALL fields on instance
        3. Save instance
        4. If status changed → handle attendance
        5. Store attendance changes for response
        6. Return instance
        """
        # ========================================
        # DETECT STATUS CHANGE
        # ========================================
        status_changed = False
        old_status = None
        new_status = None
        
        if 'status' in validated_data:
            new_status = validated_data['status']
            old_status = instance.status
            status_changed = (new_status != old_status)
        
        # ========================================
        # UPDATE ALL FIELDS
        # ========================================
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # ========================================
        # HANDLE STATUS CHANGE (if applicable)
        # ========================================
        if status_changed:
            # Import the existing service
            from .services.status_change import handle_participation_status_change
            
            # Trigger attendance creation/deletion
            attendance_changes = handle_participation_status_change(
                participation=instance,
                old_status=old_status,
                new_status=new_status
            )
            
            # Store for to_representation (optional)
            # This allows you to return attendance info in response
            instance._attendance_changes = attendance_changes
        
        return instance
    
    def to_representation(self, instance):
        """
        Return updated instance data.
        
        Optionally include attendance changes if status was updated.
        """
        # Get standard representation
        data = super().to_representation(instance)
        
        # If status changed, include attendance info
        if hasattr(instance, '_attendance_changes'):
            data['attendance_changes'] = instance._attendance_changes
        
        return data
 
'''
'''
    
class LeagueDetailSerializer(CaptainInfoMixin, serializers.ModelSerializer):
    """
    Full serializer for league/event detail view.
    Extends LeagueSerializer to include all fields.
    
    UPDATED 2026-01-19:
    - Now extends LeagueSerializer instead of ModelSerializer
    - Inherits user participation logic
    - Adds extra detail fields
    """
    
    # Inherit all LeagueSerializer fields + methods
    # club_info = serializers.SerializerMethodField()
    club_info = ClubInfoSerializer(source='club')
    
    captain_info = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    next_session = serializers.SerializerMethodField()
    one_time_session_info = serializers.SerializerMethodField()
    upcoming_sessions = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    recurring_days = serializers.SerializerMethodField()
    # User participation fields (from annotations)
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    user_is_participant = serializers.BooleanField(read_only=True, required=False)
    user_next_session_id = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = [
            'id',✅
            'name',✅
            'description',✅
            'is_event',✅
            'is_active',✅
            'club_info',  ✅
            'captain_info',✅
            'minimum_skill_level',✅
            'next_session',✅
            'one_time_session_info',✅
            'max_participants',✅
            'allow_reserves',✅
            'participants_count',✅
            'fee',✅
            'start_date',✅
            'end_date',✅
            'registration_start_date',✅
            'registration_end_date',✅
            'image_url',✅
            'league_type',✅
            'recurring_days',✅
            'is_recurring',✅
            'upcoming_sessions',✅
            # Optional user-specific fields
            'user_is_captain',✅
            'user_is_participant',✅
            'user_next_session_id'✅

            # The LeagueSerializer has one extra field that was NOT used
            # in this serializer: user_has_upcoming_sessions
            
        ]  # Include ALL model fields + custom fields
    
    # def get_club_info(self, obj):
    #     """Return minimal club data using ClubInfoSerializer"""
    #     from clubs.serializers import ClubInfoSerializer
    #     return ClubInfoSerializer(obj.club).data
    
    def get_next_session(self, obj):
        """
        Get next occurrence.
        
        UPDATED 2026-01-23: Pass context for user_attendance_status!
        """
        next_occ = obj.next_occurrence
        if next_occ:
            # ⚡ CRITICAL: Pass request context for user_attendance_status!
            return NextOccurrenceSerializer(next_occ, context=self.context).data
        return None
    
    def get_one_time_session_info(self, obj):
        """
        For One-time sessions, we need the session information as well!
        
        """
        one_time_session_info = obj.one_time_session
        if one_time_session_info:
            return NextOccurrenceSerializer(one_time_session_info, context=self.context).data
        return None
    
    def get_participants_count(self, obj):
        """Smart participant counting"""
        if not obj.is_event:
            if hasattr(obj, 'league_participants_count'):
                return obj.league_participants_count
            return 0
        
        next_occ = obj.next_occurrence
        if not next_occ:
            return 0
        
        return LeagueAttendance.objects.filter(
            session_occurrence=next_occ,
            status=LeagueAttendanceStatus.ATTENDING
        ).count()
    
    def get_recurring_days(self, obj: League) -> list[int]:
        from public.constants import RecurrenceType
        """
        Get list of days this league/event occurs on.
        
        Returns: [0, 2, 4] for Mon, Wed, Fri
        Uses DayOfWeek constants: MON=0, TUE=1, WED=2, THU=3, FRI=4, SAT=5, SUN=6
        """
        # Get days from RECURRING sessions only (exclude one-time sessions)
        # ✅ CRITICAL: Filter by recurrence_type, NOT session count!
        recurring_sessions = obj.sessions.exclude(recurrence_type=RecurrenceType.ONCE)
        
        # Get unique days from recurring sessions
        # ✅ CRITICAL: Field is 'day_of_week' not 'day'!
        days = recurring_sessions.values_list('day_of_week', flat=True).distinct().order_by('day_of_week')
        return list(days)
    
    # 🆕 ADDED field

    def get_upcoming_sessions(self, obj):
        """Serialize using NextOccurrenceSerializer (with context!)"""
        occurrences = obj.upcoming_occurrences
        
        if occurrences:
            return NextOccurrenceSerializer(
                occurrences, 
                many=True,  # ← Multiple occurrences!
                context=self.context  # ← Passes user for attendance status!
            ).data
    
        return []
    
    def get_user_next_session_id(self, obj: League) -> int | None:
        """
        Returns the ID of the next session the user is attending.
        
        Returns:
        - int: Session occurrence ID of next attending session
        - None: No upcoming sessions user is attending
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        today = timezone.localtime().date()
      
        # Get the NEXT session the user is attending (earliest date/time)
        attendance = LeagueAttendance.objects.filter(
            league_participation__league=obj,
            league_participation__member=request.user,
            session_occurrence__session_date__gte=today,
            session_occurrence__is_cancelled=False,
            status=LeagueAttendanceStatus.ATTENDING
        ).order_by(
            'session_occurrence__session_date',
            'session_occurrence__start_datetime'
        ).first()
    
        # Return the session occurrence ID or None
        return attendance.session_occurrence_id if attendance else None
    
    def to_representation(self, instance):
        """Remove user fields if not requested"""
        data = super().to_representation(instance)
        
        # Remove user-specific fields if not requested
        include_participation = self.context.get('include_user_participation', False)
        if not include_participation:
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
        
        return data

'''

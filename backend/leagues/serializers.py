
from rest_framework import serializers
from django.contrib.auth import get_user_model

from users.serializers import UserInfoSerializer
from .models import League, LeagueParticipation, LeagueAttendance, LeagueSession
from public.constants import LeagueAttendanceStatus, LeagueParticipationStatus
from django.utils import timezone
from .mixins import CaptainInfoMixin
from courts.serializers import CourtLocationInfoSerializer

# Get the active user model
User = get_user_model()

class LeagueSessionSerializer(serializers.ModelSerializer):
    court_location_info = serializers.SerializerMethodField()
    class Meta:
        model = LeagueSession
        fields = ['id', 
                  'court_location_info', 
                  'courts_used',
                  'day_of_week',
                  'start_time',
                  'end_time',
                  'recurrence_type',
                  'recurrence_interval',
                  'active_from',
                  'active_until',
                  'is_active',
                  ] 
    def get_court_location_info(self, obj):
        """Return minimal court Location using CourtLocationInfoSerializer"""
        from courts.serializers import CourtLocationInfoSerializer
        return CourtLocationInfoSerializer(obj.court_location).data
   
class NextOccurrenceSerializer(serializers.Serializer):
    """
    Next occurrence data for EventCard.
    
    UPDATED 2026-01-23:
    - Added id field (SessionOccurrence.id)
    - Added participants_count (ATTENDING users for THIS occurrence)
    - Added user_attendance_status (user's status for THIS occurrence)
    """
    # SessionOccurrence ID (needed for API calls)
    id = serializers.IntegerField()
    
    # Date/time info
    date = serializers.DateField(source='session_date')
    start_time = serializers.TimeField(source='league_session.start_time')
    end_time = serializers.TimeField(source='league_session.end_time')
    
    # Location info
    # location_id = serializers.IntegerField(source='league_session.court_location.id')
    # location_name = serializers.CharField(source='league_session.court_location.name')
    # location_address = AddressSerializer(source='league_session.court_location.address', read_only=True)
    court_info = CourtLocationInfoSerializer(source='league_session.court_location', read_only=True)
    
    # 🆕 NEW FIELDS:
    participants_count = serializers.SerializerMethodField()
    user_attendance_status = serializers.SerializerMethodField()
    registration_open = serializers.BooleanField()
    max_participants = serializers.IntegerField(source='league_session.league.max_participants')

    def get_participants_count(self, obj) -> int:
        """Count ATTENDING users for THIS occurrence"""
        return LeagueAttendance.objects.filter(
            session_occurrence=obj,
            status=LeagueAttendanceStatus.ATTENDING
        ).count()
    
    def get_user_attendance_status(self, obj) -> str | None:
        """
        Get user's attendance status for THIS occurrence.
        
        ✅ OPTIMIZED VERSION:
        - First checks if status was passed via context (from prefetched data in view)
        - Falls back to querying if not in context (for backwards compatibility)
        
        """
        # ✅ OPTIMIZATION: Check if status already in context (from view's prefetch)
        # This is used by user_activities_view which prefetches attendance
        # Context 1: Activities view passes integer directly (optimized!)
        if 'user_attendance_status' in self.context:
            return self.context['user_attendance_status']  # ← Use it!
        
        # Context 2: Other views pass 'request' (calculate from DB)
        # ✅ FALLBACK: Compute it (for other endpoints that don't pass via context)
        # This is the ORIGINAL logic for backwards compatibility!
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            attendance = LeagueAttendance.objects.get(
                session_occurrence=obj,
                league_participation__member=request.user
            )
            return attendance.status
            
        except LeagueAttendance.DoesNotExist:
            return None
    
class LeagueSerializer(CaptainInfoMixin, serializers.ModelSerializer):
    """
    Lightweight serializer for league/event list.
    
    Returns ALL data needed for EventCard component:
    - Club info (id, name, logo)
    - Captain info (nested PersonInfo)
    - Next occurrence (date, time, location)
    - Participant count (smart: leagues vs events)
    - User participation (optional, when authenticated)
    
    DESIGN:
    - For recurring events: Only shows NEXT upcoming occurrence
    - Participants count:
      * Leagues: Total LeagueParticipation count
      * Events: LeagueAttendance count for next occurrence
    """
    club_info = serializers.SerializerMethodField()
   
    captain_info = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    # Next occurrence (computed)
    next_session = serializers.SerializerMethodField()
    one_time_session_info = serializers.SerializerMethodField()

    # Participant count (smart counting!)
    participants_count = serializers.SerializerMethodField()
    
    # ✅ User participation fields (read from annotations!)
    # These are annotated in LeagueViewSet.get_queryset() when include_user_participation=true
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    user_is_participant = serializers.BooleanField(read_only=True, required=False)
    user_has_upcoming_sessions = serializers.SerializerMethodField()
    recurring_days = serializers.SerializerMethodField()
    # upcoming_sessions = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = [
            'id',
            'name',
            'description',
            'is_event',
            'club_info',  
            'captain_info',
            'minimum_skill_level',
            'next_session',
            'one_time_session_info',
            'max_participants',
            'allow_reserves',
            'participants_count',
            'fee',
            'start_date',
            'end_date',
            'image_url',
            'league_type',
            'recurring_days',
            'is_recurring',
            'is_active',
           #   'upcoming_occurrences',
            'user_has_upcoming_sessions',
            
            # Optional user-specific fields
            'user_is_captain',
            'user_is_participant',
        ]
    
    def get_club_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        from clubs.serializers import ClubInfoSerializer
        return ClubInfoSerializer(obj.club).data
    
    def get_next_session(self, obj):
        """
        Uses League.next_occurrence @property directly!
        
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
        """
        Smart participant counting:
        - Leagues: Total enrollment (LeagueParticipation)
        - Events: Attendance for NEXT occurrence (LeagueAttendance)
        """
        if not obj.is_event:
            # LEAGUES: Use annotated count from ViewSet
            if hasattr(obj, 'league_participants_count'):
                return obj.league_participants_count
            return 0
        
        # EVENTS: Count attendance for NEXT occurrence
        # ⚡ Use the property - it's already calculated!
        next_occ = obj.next_occurrence  # ← Property call!
        
        if not next_occ:
            return 0
        
        # Count attending participants for this occurrence
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
    
    def get_user_has_upcoming_sessions(self, obj: League) -> bool:
        """
        Check if authenticated user is enrolled in ANY upcoming session.
        
        Only relevant for recurring events where user might be enrolled in
        a different session than next_occurrence.
        
        For one-time events: Returns False (use next_occurrence.user_attendance_status)
        For recurring events: Returns True if user enrolled in any upcoming session
        
        Example:
            Event has Mon/Wed sessions
            next_occurrence = Monday (user NOT enrolled)  
            But user IS enrolled for Wednesday
            → Returns True to show "Enrolled (other day)" badge
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Only relevant for recurring events
        if not obj.is_recurring:  # ✅ Uses the new property!
            return False
        
        # Check if user enrolled in any upcoming session occurrence
        today = timezone.localtime().date()
        
        # ✅ CORRECT: Query through LeagueAttendance → SessionOccurrence
        return LeagueAttendance.objects.filter(
            league_participation__league=obj,
            league_participation__member=request.user,
            session_occurrence__session_date__gte=today,
            session_occurrence__is_cancelled=False,
            status=LeagueAttendanceStatus.ATTENDING
        ).exists()
    
    def to_representation(self, instance):
        """Remove user fields if not requested"""
        data = super().to_representation(instance)
        
        # Remove user-specific fields if not requested
        include_participation = self.context.get('include_user_participation', False)
        if not include_participation:
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
        
        return data
    
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
    club_info = serializers.SerializerMethodField()
    
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
            'id',
            'name',
            'description',
            'is_event',
            'is_active',
            'club_info',  
            'captain_info',
            'minimum_skill_level',
            'next_session',
            'one_time_session_info',
            'max_participants',
            'allow_reserves',
            'participants_count',
            'fee',
            'start_date',
            'end_date',
            'registration_start_date',
            'registration_end_date',
            'image_url',
            'league_type',
            'recurring_days',
            'is_recurring',
            'upcoming_sessions',
            # Optional user-specific fields
            'user_is_captain',
            'user_is_participant',
            'user_next_session_id'
            
        ]  # Include ALL model fields + custom fields
    
    def get_club_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        from clubs.serializers import ClubInfoSerializer
        return ClubInfoSerializer(obj.club).data
    
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
    
class LeagueActivitySerializer(CaptainInfoMixin, serializers.ModelSerializer):
    """
    Simplified League serializer for activities endpoint.
    
    Returns minimal League/Event data needed for SessionActivity:
    - id, name, description
    - club_info (id, name, logo_url) ✅ Uses ClubInfoSerializer!
    - captain_info (nested UserInfo) ✅ From CaptainInfoMixin!
    - is_event, league_type
    - max_participants
    - image_url
    
    DOES NOT include: 
    - tags (not implemented yet on backend)
    """
    # ✅ USE ClubInfoSerializer instead of get_club_info()!
    club_info = serializers.SerializerMethodField()
    # ✅ captain_info comes from CaptainInfoMixin!
    captain_info = serializers.SerializerMethodField()

    # User participation flags (computed in view via .annotate())
    user_is_captain = serializers.SerializerMethodField()
    user_is_participant = serializers.SerializerMethodField()

    recurring_days = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    
    class Meta:
        model = League
        fields = [
            'id',
            'name',
            'fee',
            'club_info',
            'captain_info',
            'image_url',
            'user_is_captain',
            'user_is_participant',
            'minimum_skill_level',
            'recurring_days',
            'is_event',
        ]

    def get_user_is_captain(self, obj):
        """Get from context (passed by view)."""
        return self.context.get('user_is_captain', False)
    
    def get_user_is_participant(self, obj):
        """Get from context (passed by view)."""
        return self.context.get('user_is_participant', False)
    
    # ✅ Import INSIDE the method!
    def get_club_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        from clubs.serializers import ClubInfoSerializer
        return ClubInfoSerializer(obj.club).data
    
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
    
class SessionParticipantsSerializer(serializers.Serializer):
    """
    Serializer for session participants response.
    
    Returns list of users attending a specific SessionOccurrence.
    """
    session_id = serializers.IntegerField()
    count = serializers.IntegerField()
    participants = UserInfoSerializer(many=True)

class AdminLeagueListSerializer(CaptainInfoMixin, serializers.ModelSerializer):
    club_info = serializers.SerializerMethodField()
   
    captain_info = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    # Participant count (smart counting!)
    participants_count = serializers.SerializerMethodField()
    
    # ✅ User participation fields (read from annotations!)
    # These are annotated in LeagueViewSet.get_queryset() when include_user_participation=true
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    
    class Meta:
        model = League
        fields = [
            'id',
            'name',
            'is_event',
            'club_info',  
            'captain_info',
            'minimum_skill_level',
            'max_participants',
            'participants_count',
            'fee',
            'start_date',
            'end_date',
            'is_active',
            'user_is_captain',      
        ]
    def get_club_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        from clubs.serializers import ClubInfoSerializer
        return ClubInfoSerializer(obj.club).data
    
    def get_participants_count(self, obj):
        """
        Smart participant counting:
        - Leagues: Total enrollment (LeagueParticipation)
        - Events: Attendance for NEXT occurrence (LeagueAttendance)
        """
        if not obj.is_event:
            # LEAGUES: Use annotated count from ViewSet
            if hasattr(obj, 'league_participants_count'):
                return obj.league_participants_count
            return 0
        return 0
    
class AdminLeagueDetailSerializer(AdminLeagueListSerializer):
    '''
    league = models.ForeignKey(
        League, 
        on_delete=models.CASCADE, 
        related_name="sessions")
    '''
    league_sessions = LeagueSessionSerializer(source='sessions', read_only=True, many=True)

    class Meta(AdminLeagueListSerializer.Meta):
        fields = AdminLeagueListSerializer.Meta.fields + [
            'description',
            'image_url',
            'allow_reserves',
            'registration_opens_hours_before',
            'registration_closes_hours_before',
            'registration_start_date',
            'registration_end_date',
            'league_type',
            'default_generation_format',
            'league_sessions',
        ]

class AdminLeagueParticipantSerializer(serializers.ModelSerializer):
    from clubs.serializers import ClubMemberSerializer
    participant = ClubMemberSerializer(source='club_membership', read_only=True)

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

class ParticipantStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for ADMIN bulk updating participant status.
    
    KEY PATTERNS FROM set_preferred_club:
    - Accepts integer status value (NOT string!)
    - Validates against LeagueParticipationStatus choices
    - Returns ARRAY of updated participations (for bulk updates)
    - Uses to_representation() to format response
    
    Use case:
    - Admin on /admin/[clubId]/events/[eventId]/members page
    - Admin selects multiple participants
    - Admin clicks "Set to Active" or "Set to Cancelled"
    - Frontend needs updated list to re-render table
    
    Input (via view - NOT in body!):
    - participation_ids (in URL or view logic)
    - status: integer (in body, e.g., { "status": 1 })
    
    Output:
    - Array of ALL updated LeagueParticipations
    
    CRITICAL RULES (from Guidelines.md):
    1. Frontend ALWAYS sends integers, NEVER label strings
    2. Backend uses constants.LeagueParticipationStatus (IntegerChoices)
    3. NO string mapping like "ACTIVE" → 1
    4. Return format matches what frontend expects for table refresh
    """
    
    # ✅ CORRECT: Accept INTEGER status value
    status = serializers.IntegerField(required=True)
    
    def validate_status(self, value):
        """
        Validate status is a valid LeagueParticipationStatus value.
        
        CRITICAL: Frontend already sends INTEGER (e.g., 1, 2, 5, 6)
        We just need to validate it's a valid choice!
        """
        valid_statuses = [choice[0] for choice in LeagueParticipationStatus.choices]
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status value: {value}. "
                f"Must be one of: {valid_statuses}"
            )
        
        return value
    
    def update(self, instances, validated_data):
        """
        Update status for multiple participations.
        
        Args:
            instances: List[LeagueParticipation] (passed from view)
            validated_data: { "status": int }
        
        Returns:
            List[LeagueParticipation] (updated instances)
        
        Steps:
        1. Normalize to list (handle single instance OR list)
        2. Get new status from validated_data
        3. Loop through instances
        4. Store old_status, update to new_status
        5. Call status_change service for each
        6. Return updated instances as list
        """
        new_status = validated_data.get('status')
        
        # ✅ FIX: Normalize to list (handle single instance OR list)
        if not isinstance(instances, list):
            instances = [instances]
            
        # Import service here to avoid circular imports
        from .services.status_change import handle_participation_status_change
        
        updated_instances = []
        attendance_changes = []
        
        for participation in instances:
            old_status = participation.status
            
            # Only update if status actually changed
            if old_status != new_status:
                # Update status
                participation.status = new_status
                participation.save()
                
                # Handle attendance records (create/delete/update based on status change)
                result = handle_participation_status_change(
                    participation, old_status, new_status
                )
                attendance_changes.append({
                    'participation_id': participation.id,
                    **result
                })
            
            updated_instances.append(participation)
        
        # Store attendance changes in instance for response
        # (We'll return this via to_representation)
        if updated_instances:
            updated_instances[0]._attendance_changes = attendance_changes
        
        return updated_instances
    
    def to_representation(self, instances):
        """
        Custom representation: Return ALL updated participations.
        
        PATTERN FROM set_preferred_club:
        - Uses AdminLeagueParticipantSerializer for each participation
        - Returns array of serialized data
        - Includes attendance_changes summary
        
        Args:
            instances: List[LeagueParticipation]
        
        Returns:
            {
                "participants": [...],
                "attendanceChanges": [...]
            }
        """
        # Use existing AdminLeagueParticipantSerializer for consistency
        # from .serializers import AdminLeagueParticipantSerializer
        
        participant_data = AdminLeagueParticipantSerializer(
            instances, 
            many=True
        ).data
        
        # Get attendance changes if available
        attendance_changes = []
        if instances and hasattr(instances[0], '_attendance_changes'):
            attendance_changes = instances[0]._attendance_changes
        
        return {
            'participants': participant_data,
            'attendanceChanges': attendance_changes
        }
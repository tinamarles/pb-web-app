
from rest_framework import serializers
from django.contrib.auth import get_user_model
# from clubs.serializers import EventLightSerializer
from users.serializers import UserInfoSerializer
from .models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from public.constants import LeagueAttendanceStatus
from public.serializers import AddressSerializer
from django.utils import timezone


# Get the active user model
User = get_user_model()
   
class NextOccurrenceSerializer(serializers.Serializer):
    """Next occurrence data for EventCard"""
    date = serializers.DateField(source='session_date')
    start_time = serializers.TimeField(source='league_session.start_time')
    end_time = serializers.TimeField(source='league_session.end_time')
    location_id = serializers.IntegerField(source='league_session.court_location.id')
    location_name = serializers.CharField(source='league_session.court_location.name')
    location_address = AddressSerializer(source='league_session.court_location.address', read_only=True)

class LeagueSerializer(serializers.ModelSerializer):
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
    next_occurrence = serializers.SerializerMethodField()
    
    # Participant count (smart counting!)
    participants_count = serializers.SerializerMethodField()
    
    # ✅ User participation fields (read from annotations!)
    # These are annotated in LeagueViewSet.get_queryset() when include_user_participation=true
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    user_is_participant = serializers.BooleanField(read_only=True, required=False)
    
    recurring_days = serializers.SerializerMethodField()
    upcoming_occurrences = serializers.SerializerMethodField()

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
            'next_occurrence',
            'max_participants',
            'allow_reserves',
            'participants_count',
            'fee',
            'start_date',
            'end_date',
            'image_url',
            'league_type',
            'recurring_days',
            'upcoming_occurrences',
            
            # Optional user-specific fields
            'user_is_captain',
            'user_is_participant',
        ]

    def get_club_info(self, obj):
        """Return minimal club data (id, name)"""
        return {
            'id': obj.club.id,
            'name': obj.club.name,
            'logo_url': obj.club.logo_url,
        }
    
    def get_captain_info(self, obj):
        """
        Return captain info using existing UserInfoSerializer.
        Use captain if exists, else fall back to created_by.
        """
        captain = obj.captain if obj.captain else obj.created_by
        
        if not captain:
            return None
        
        return UserInfoSerializer(captain).data
    
    def get_next_occurrence(self, obj):
        """
        Returns appropriate occurrence based on status filter.
        Uses get_display_occurrence() instead of next_occurrence property.
        """
        # Get status filter from request context
        request = self.context.get('request')
        status = 'upcoming'  # default
        
        if request:
            status = request.query_params.get('status', 'upcoming')
        
        # Get appropriate occurrence based on status
        display_occ = obj.get_display_occurrence(status)
        
        if display_occ:
            return NextOccurrenceSerializer(display_occ).data
        
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
    
    def get_upcoming_occurrences(self, obj: League) -> list[dict]:
        """
        Get next 4 upcoming occurrences for recurring events.
        
        For one-time events: Returns 1 occurrence (same as next_occurrence)
        For recurring events: Returns up to 4 upcoming occurrences
        """
        session_count = obj.sessions.count()
        
        if session_count <= 1:
            # One-time event - just return next_occurrence if exists
            if obj.next_occurrence:
                return [NextOccurrenceSerializer(obj.next_occurrence).data]
            return []
        
        # Recurring event - get next 4 occurrences
        today = timezone.localtime().date()
        occurrences = SessionOccurrence.objects.filter(
            league=obj,
            session_date__gte=today,
            is_cancelled=False
        ).select_related(
            'league_session__court_location__address'
        ).order_by('session_date')[:4]  # ✅ Get 4!
        
        return NextOccurrenceSerializer(occurrences, many=True).data
    
    def to_representation(self, instance):
        """Remove user fields if not requested"""
        data = super().to_representation(instance)
        
        # Remove user-specific fields if not requested
        include_participation = self.context.get('include_user_participation', False)
        if not include_participation:
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
        
        return data
    
class LeagueDetailSerializer(serializers.ModelSerializer):
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
    next_occurrence = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    
    # User participation fields (from annotations)
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    user_is_participant = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = League
        fields = '__all__'  # Include ALL model fields + custom fields
    
    # Reuse methods from LeagueSerializer
    def get_club_info(self, obj):
        """Return minimal club data (id, name, logo)"""
        return {
            'id': obj.club.id,
            'name': obj.club.name,
            'logo_url': obj.club.logo_url,
        }
    
    def get_captain_info(self, obj):
        """Return captain info"""
        captain = obj.captain if obj.captain else obj.created_by
        if not captain:
            return None
        return UserInfoSerializer(captain).data
    
    def get_next_occurrence(self, obj):
        """Get next occurrence"""
        next_occ = obj.next_occurrence
        if next_occ:
            return NextOccurrenceSerializer(next_occ).data
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
    
    def to_representation(self, instance):
        """Remove user fields if not requested"""
        data = super().to_representation(instance)
        
        # Remove user-specific fields if not requested
        include_participation = self.context.get('include_user_participation', False)
        if not include_participation:
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
        
        return data
from rest_framework import serializers
from django.contrib.auth import get_user_model
from clubs.serializers import EventLightSerializer
from users.serializers import UserInfoSerializer
from .models import League, LeagueParticipation, LeagueAttendance
from public.constants import LeagueAttendanceStatus
from public.serializers import AddressSerializer

# Get the active user model
User = get_user_model()

class LeagueSerializer(EventLightSerializer):
    """
    Comprehensive serializer for Leagues and Events.
    
    Used for:
    - Events Tab (GET /api/clubs/{id}/events/)
    - League Detail (GET /api/leagues/{id}/)
    - Dashboard Todays' Events + Upcoming Leagues
         GET /api/clubs/5/events/?
            type=event&
            status=upcoming&
            page=1&
            pageSize=4

    UPDATED 2026-01-15:
    - Added optional user participation fields
    - Fields only included when context includes 'include_user_participation'=True
    
    CRITICAL:
    - Works for BOTH leagues (is_event=False) AND events (is_event=True)
    - Returns snake_case (frontend converts to camelCase)
    - Uses ModelSerializer for DRY approach
    - Uses SessionOccurrence for next session queries
    
    Fields:
    - Basic: id, name, description, league_type, etc.
    - Computed: club info, captain info, participants count
    - Next session: For events, shows next upcoming session details
    """
    
    # NEW: User participation fields (optional)
    user_is_captain = serializers.SerializerMethodField()
    user_is_participant = serializers.SerializerMethodField()
    user_attendance_status = serializers.SerializerMethodField()
    next_session_occurrence_id = serializers.SerializerMethodField()

    class Meta(EventLightSerializer.Meta): 
            """ now just add the extra fields """ 
            
            fields = EventLightSerializer.Meta.fields + [ 
                # Registration (computed @property for leagues, per-session for events)
                'registration_start_date',
                'registration_end_date',
                'start_date',
                'end_date',
                # Status
                'is_active',
                # Timestamps
                'created_at',
                'updated_at',
                # NEW fields (conditionally included)
                'user_is_captain',
                'user_is_participant',
                'user_attendance_status',
                'next_session_occurrence_id',
            ]

    def get_user_is_captain(self, obj):
        """
        Return True if current user is the captain.
        Only included when 'include_user_participation' is in context.
        """
        # Check if we should include this field
        if not self.context.get('include_user_participation'):
            return None  # Field will be omitted from response
        
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Compare captain ID with current user ID
        return obj.captain_id == request.user.id
    
    def get_user_is_participant(self, obj):
        """
        Return True if current user has attendance record for next session.
        Only included when 'include_user_participation' is in context.
        """
        if not self.context.get('include_user_participation'):
            return None  # Field will be omitted from response
        
        # Check if user_attendance was passed in context
        user_attendance = self.context.get('user_attendance')
        return user_attendance is not None
    
    def get_user_attendance_status(self, obj):
        """
        Return user's attendance status for next session.
        Only included when 'include_user_participation' is in context.
        """
        if not self.context.get('include_user_participation'):
            return None  # Field will be omitted from response
        
        user_attendance = self.context.get('user_attendance')
        if user_attendance:
            return user_attendance.status
        return None
    
    def get_next_session_occurrence_id(self, obj):
        """
        Return ID of next SessionOccurrence.
        Only included when 'include_user_participation' is in context.
        """
        if not self.context.get('include_user_participation'):
            return None  # Field will be omitted from response
        
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.id
        return None
    
    def to_representation(self, instance):
        """
        Override to conditionally exclude user participation fields.
        """
        data = super().to_representation(instance)
        
        # Remove user participation fields if not requested
        if not self.context.get('include_user_participation'):
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
            data.pop('user_attendance_status', None)
            data.pop('next_session_occurrence_id', None)
        
        return data
    
class NextOccurrenceSerializer(serializers.Serializer):
    """Next occurrence data for EventCard"""
    date = serializers.DateField(source='session_date')
    start_time = serializers.TimeField(source='league_session.start_time')
    end_time = serializers.TimeField(source='league_session.end_time')
    location_id = serializers.IntegerField(source='league_session.court_location.id')
    location_name = serializers.CharField(source='league_session.court_location.name')
    location_address = AddressSerializer(source='league_session.court_location.address', read_only=True)

class LeagueListSerializer(serializers.ModelSerializer):
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
    
    # ✅ Optional fields (only included if include_user_participation=true)
    user_is_captain = serializers.BooleanField(read_only=True, required=False)
    user_is_participant = serializers.SerializerMethodField()
    
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
            'start_date',
            'end_date',
            'image_url',
            'league_type',
            
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
    
    def get_user_is_participant(self, obj):
        """Check if user is participant (captain OR regular participant)"""
        if not self.context.get('include_user_participation'):
            return None
        
        # ✅ Use prefetched data (already filtered to current user!)
        if hasattr(obj, 'user_participations_list'):
            return len(obj.user_participations_list) > 0
        return False
    
    def get_next_occurrence(self, obj):
        """
        Get next upcoming occurrence (for BOTH events and leagues!)
        
        Returns None if:
        - No sessions exist
        - All sessions are in the past
        - All sessions are cancelled
        """
        # Access prefetched data (ViewSet limits to [:1])
        for session in obj.sessions.all():
            if hasattr(session, 'next_occurrence_list') and session.next_occurrence_list:
                next_occ = session.next_occurrence_list[0]
                return NextOccurrenceSerializer(next_occ).data
        
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
        
        # EVENTS: Count attendance for next occurrence
        next_occ = self.get_next_occurrence(obj)
        if not next_occ:
            return 0
        
        # Get first occurrence (same one we used above)
        for session in obj.sessions.all():
            if hasattr(session, 'next_occurrence_list') and session.next_occurrence_list:
                occurrence = session.next_occurrence_list[0]
                # Count attending status
                return LeagueAttendance.objects.filter(
                    session_occurrence=occurrence,
                    status=LeagueAttendanceStatus.ATTENDING
                ).count()
        
        return 0
    
    def to_representation(self, instance):
        """Remove user fields if not requested"""
        data = super().to_representation(instance)
        
        # Remove user-specific fields if not requested
        if not self.context.get('include_user_participation'):
            data.pop('user_is_captain', None)
            data.pop('user_is_participant', None)
        
        return data
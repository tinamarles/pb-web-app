from rest_framework import serializers
from django.contrib.auth import get_user_model
from clubs.serializers import EventLightSerializer

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
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    # NEW: User participation fields (optional)
    user_is_captain = serializers.SerializerMethodField()
    user_is_participant = serializers.SerializerMethodField()
    user_attendance_status = serializers.SerializerMethodField()
    next_session_occurrence_id = serializers.SerializerMethodField()

    class Meta(EventLightSerializer.Meta): 
            """ now just add the extra fields """ 
            
            fields = EventLightSerializer.Meta.fields + [ 
                'is_event',
                # Capacity and overflow (dual-purpose fields!)
                'max_participants',
                'allow_reserves',
                # Registration (computed @property for leagues, per-session for events)
                'registration_open',
                'registration_start_date',
                'registration_end_date',
                'league_type',
                'minimum_skill_level',
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
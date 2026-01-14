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
    
    class Meta(EventLightSerializer.Meta): 
            """ now just add the extra fields """ 
            fields = EventLightSerializer.Meta.fields + [ 
                'is_event',
                # Capacity and overflow (dual-purpose fields!)
                'max_participants',
                'allow_reserves',
                # Registration (computed @property for leagues, per-session for events)
                'registration_open',
                'start_date',
                'end_date',
                # Status
                'is_active',
                # Timestamps
                'created_at',
                'updated_at',
            ]
    
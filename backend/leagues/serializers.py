from rest_framework import serializers
from django.contrib.auth import get_user_model
from django_typomatic import ts_interface
from .models import League
from public.constants import LeagueParticipationStatus  

# Get the active user model
User = get_user_model()

@ts_interface()
class LeagueSerializer(serializers.ModelSerializer):
    captain_info = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()  # ✅ NEW!
    
    class Meta:
        model = League
        fields = ['id', 
                  'club',
                  'name', 
                  'description',
                  'is_event',
                  'image_url',
                  'max_spots_per_session',
                  'allow_waitlist',
                  'registration_opens_hours_before',
                  'registration_closes_hours_before',
                  'league_type',
                  'minimum_skill_level',
                  'captain_info',       # ✅ Matches method name!
                  'start_date',
                  'end_date',
                  'registration_open',
                  'max_participants',
                  'allow_reserves',
                  'is_active',
                  'participants_count'  # ✅ NEW!
                  ] 
    def get_captain_info(self, obj):
        """Get captain details (if captain exists)"""
        if obj.captain:
            return {
                'id': obj.captain.id,
                'first_name': obj.captain.first_name,
                'last_name': obj.captain.last_name,
                'avatar': obj.captain.profile_picture_url 
            }
        return None
    def get_participants_count(self, obj):
        """Count active participants in the league/event"""
        return obj.participants.filter(
            league_participations__status=LeagueParticipationStatus.ACTIVE  # ✅ Fixed indent!
        ).distinct().count()
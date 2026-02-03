"""
League Serializer Mixins

Reusable mixin classes for serializers.
Follows DRY principle - DEFINE ONCE, REUSE EVERYWHERE!

Created: 2026-02-01
"""

from rest_framework import serializers
from users.serializers import UserInfoSerializer

class CaptainInfoMixin:
    """
    Mixin to add captain_info field to any League serializer.
    
    ✅ USE THIS instead of duplicating get_captain_info() logic!
    
    Handles fallback logic:
    - If league has captain → use captain
    - Else if league has created_by → use created_by
    - Else → return None
    
    Usage:
        class MyLeagueSerializer(CaptainInfoMixin, serializers.ModelSerializer):
            class Meta:
                model = League
                fields = ['id', 'name', 'captain_info', ...]
    
    Output matches frontend TypeScript:
        export interface UserInfo {
            id: number;
            firstName: string;
            lastName: string;
            fullName: string; // Computed from firstName + lastName
            username: string;
            profilePictureUrl: string;
        }
    
    Used by:
    - EventLightSerializer (not currently used in API)
    - LeagueSerializer (EventCard)
    - LeagueDetailSerializer (EventDetail)
    - LeagueActivitySerializer (My Activities)
    """
    captain_info = serializers.SerializerMethodField()
    
    def get_captain_info(self, obj):
        """Reusable captain_info logic"""
        captain = obj.captain if obj.captain else obj.created_by
        if not captain:
            return None
        
        return UserInfoSerializer(captain).data
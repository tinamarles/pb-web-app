from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    Converts Django model → JSON for frontend.
    """
    
    # Add sender info (nested)
    sender_info = serializers.SerializerMethodField()
    
    # Serialize related object ForeignKeys as nested objects
    club = serializers.SerializerMethodField()
    league = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 
            'notification_type',  # ✅ snake_case (matches model field)
            'title', 
            'message', 
            'is_read',            # ✅ snake_case
            'created_at',         # ✅ snake_case
            'read_at',            # ✅ snake_case
            'action_url',         # ✅ snake_case
            'action_label',       # ✅ snake_case
            'club', 
            'league', 
            'match', 
            'sender_info',        # ✅ Matches method name!
            'metadata'
        ]
    
    def get_sender_info(self, obj):
        """Get sender details (if sender exists)"""
        if obj.sender:
            return {
                'id': obj.sender.id,
                'first_name': obj.sender.first_name,
                'last_name': obj.sender.last_name,
                'avatar': obj.sender.profile_picture_url 
            }
        return None
    
    def get_club(self, obj):
        if obj.club:
            return {
                'id': obj.club.id,
                'name': obj.club.name,
            }
        return None
    
    def get_league(self, obj):
        if obj.league:
            return {
                'id': obj.league.id,
                'name': obj.league.name,
            }
        return None
    
    def get_match(self, obj):
        if obj.match:
            return {
                'id': obj.match.id,
                # Add additional match fields as needed
            }
        return None
from rest_framework import serializers
from .models import Notification, Announcement

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
    
class AnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for Announcement model.
    Converts Django model → JSON for frontend.
    """
    club_name = serializers.CharField(source='club.name', read_only=True)

    # Use SerializerMethodField instead of CharField for nullable FKs
    league_name = serializers.SerializerMethodField()
    match_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement  # Announcement model
        fields = [
            'id',
            'notification_type',
            'club',
            'club_name',
            'league',
            'league_name',
            'match',
            'match_name',   
            'title',
            'content',
            'image_url',
            'action_url',
            'action_label',
            'is_pinned',
            'created_by',
            'created_by_name',
            'expiry_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'notification_type', 'created_at', 'updated_at', 'created_by'] 

    def get_league_name(self, obj):
        return obj.league.name if obj.league else None
    
    def get_match_name(self, obj):
        return str(obj.match) if obj.match else None
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def create(self, validated_data):
        # Set created_by from request.user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
        
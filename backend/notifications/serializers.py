from django.utils import timezone
from rest_framework import serializers
from .models import Notification, Announcement
from users.serializers import UserInfoSerializer


# ========================================
# BASE SERIALIZER (Common Fields)
# ========================================
class BaseFeedItemSerializer(serializers.Serializer):
    """
    Base serializer for ALL feed items (Notification + Announcement).
    
    Provides common fields and methods used by both types.
    Subclasses MUST override get_feed_type() method.
    
    COMMON FIELDS:
    - id, notification_type, title, content
    - club, league, match, creator_info
    - action_url, action_label
    - created_at, updated_at (Announcement might not have it, but we add it!)
    - feed_type (discriminator)
    
    FLEXIBILITY:
    - get_creator_info() works with 'sender' OR 'created_by' field
    - Handles both Notification and Announcement models
    """
    
    # === COMMON FIELDS ===
    id = serializers.IntegerField(read_only=True)
    notification_type = serializers.IntegerField()
    title = serializers.CharField()
    content = serializers.CharField()  # Subclass maps to 'message' if needed
    
    # === RELATED OBJECTS ===
    creator_info = serializers.SerializerMethodField()
    club = serializers.SerializerMethodField()
    league = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()
    
    # === ACTION BUTTON ===
    action_url = serializers.CharField(allow_blank=True)
    action_label = serializers.CharField(allow_blank=True)
    
    # === TIMESTAMPS ===
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    # === DISCRIMINATOR ===
    feed_type = serializers.SerializerMethodField()
    
    # ========================================
    # METHODS (Shared Logic)
    # ========================================
    
    def get_creator_info(self, obj):
        """
        Get creator details (flexible - works with 'sender' OR 'created_by').
        
        Why flexible?
        - Notification uses obj.sender
        - Announcement uses obj.created_by
        
        This method checks both and returns the first one found!
        """
        # Try sender first (Notification), then created_by (Announcement)
        user = getattr(obj, 'sender', None) or getattr(obj, 'created_by', None)
        
        if not user:
            return None
        
        return UserInfoSerializer(user).data
    
    def get_club(self, obj):
        """Serialize club as nested object"""
        if obj.club:
            return {
                'id': obj.club.id,
                'name': obj.club.name,
            }
        return None
    
    def get_league(self, obj):
        """Serialize league as nested object"""
        if obj.league:
            return {
                'id': obj.league.id,
                'name': obj.league.name,
            }
        return None
    
    def get_match(self, obj):
        """Serialize match as nested object"""
        if obj.match:
            return {
                'id': obj.match.id,
                # Add additional match fields as needed
            }
        return None
    
    def get_feed_type(self, obj):
        """
        Abstract method - MUST be overridden by subclass!
        Returns 'notification' or 'announcement'.
        """
        raise NotImplementedError("Subclass must implement get_feed_type()")

class NotificationSerializer(BaseFeedItemSerializer, serializers.ModelSerializer):
    """
    Serializer for Notification model.
    Converts Django model → JSON for frontend.
    
    Extends BaseFeedItemSerializer + adds notification-specific fields.
    
    INHERITANCE ORDER MATTERS:
    - BaseFeedItemSerializer FIRST (provides common fields + methods)
    - ModelSerializer SECOND (provides Django model integration)
    
    MODEL-SPECIFIC FIELDS:
    - is_read, read_at, metadata
    """
    
    class Meta:
        model = Notification
        fields = [
            # Inherited from BaseFeedItemSerializer:
            'id', 
            'notification_type', 
            'title', 
            'content',
            'creator_info',
            'club', 
            'league', 
            'match', 
            'action_url', 
            'action_label',
            'created_at', 
            'updated_at', 
            'feed_type',
            
            # Notification-specific:
            'is_read', 
            'read_at', 
            'metadata',
        ]
    
    def update(self, instance, validated_data):
        """
        Auto-set read_at when is_read changes to True.
        
        Just like updated_at is auto-set!
        """
        # If is_read is being set to True, auto-set read_at
        if 'is_read' in validated_data and validated_data['is_read']:
            validated_data['read_at'] = timezone.now()
        
        return super().update(instance, validated_data)
    def get_feed_type(self, obj):
        """Override abstract method - return 'notification'"""
        return 'notification'

class AnnouncementSerializer(BaseFeedItemSerializer, serializers.ModelSerializer):
    """
    Serializer for Announcement model.
    Extends BaseFeedItemSerializer + adds announcement-specific fields.
    
    MODEL-SPECIFIC FIELDS:
    - image_url, is_pinned, expiry_date
    - (Note: club is REQUIRED for Announcement, so get_club() will always return data)
    """
    
    class Meta:
        model = Announcement
        fields = [
            # Inherited from BaseFeedItemSerializer:
            'id', 
            'notification_type', 
            'title', 
            'content',
            'creator_info',
            'club', 
            'league', 
            'match', 
            'action_url', 
            'action_label',
            'created_at', 
            'updated_at', 
            'feed_type',
            
            # Announcement-specific:
            'image_url', 
            'is_pinned', 
            'expiry_date',
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def get_feed_type(self, obj):
        """Override abstract method - return 'announcement'"""
        return 'announcement'
    
    def create(self, validated_data):
        """Set created_by from request.user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
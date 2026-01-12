from rest_framework import serializers
from .models import Notification, Announcement

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    Converts Django model → JSON for frontend.
    
    Uses FUTURE field names (creator_info, content) to align with 
    planned abstract base class migration.
    """
    
    # FUTURE field names (for abstract class migration)
    content = serializers.CharField(source='message', read_only=True)
    creator_info = serializers.SerializerMethodField()
    
    # Serialize related object ForeignKeys as nested objects
    club = serializers.SerializerMethodField()
    league = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()
    
    # Feed type identifier
    feed_type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            # === COMMON FIELDS (Future Abstract Class) ===
            'id', 
            'notification_type',
            'title', 
            'content',  # ✅ Future field name (currently maps to 'message')
            'club',  # ✅ Nested format
            'league',  # ✅ Nested format
            'match',  # ✅ Nested format
            'creator_info',  # ✅ Future field name (currently maps to 'sender')
            'action_url',
            'action_label',
            'created_at',
            'updated_at',  # ✅ Added!
            'feed_type',
            
            # === NOTIFICATION-SPECIFIC FIELDS ===
            'is_read',
            'read_at',
            'metadata',
        ]
    
    def get_feed_type(self, obj):
        """Return 'notification' for frontend type discrimination"""
        return 'notification'
    
    def get_creator_info(self, obj):
        """
        Get creator/sender details (if exists).
        Uses 'creator_info' as future-proof field name.
        """
        if obj.sender:
            return {
                'id': obj.sender.id,
                'first_name': obj.sender.first_name,
                'last_name': obj.sender.last_name,
                'full_name': obj.sender.get_full_name(),  # ✅ Convenience field!
                'profile_picture_url': obj.sender.profile_picture_url  # ✅ Consistent naming!
            }
        return None
    
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


class AnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for Announcement model.
    Converts Django model → JSON for frontend.
    
    Uses FUTURE field names (creator_info, content) to align with 
    planned abstract base class migration.
    """
    
    # FUTURE field name (already matches!)
    creator_info = serializers.SerializerMethodField()
    
    # Serialize related object ForeignKeys as nested objects
    club = serializers.SerializerMethodField()
    league = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()
    
    # Feed type identifier
    feed_type = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            # === COMMON FIELDS (Future Abstract Class) ===
            'id',
            'notification_type',
            'title',
            'content',  # ✅ Already matches future field name!
            'club',  # ✅ Nested format (changed from flat!)
            'league',  # ✅ Nested format (changed from flat!)
            'match',  # ✅ Nested format (changed from flat!)
            'creator_info',  # ✅ Future field name (currently maps to 'created_by')
            'action_url',
            'action_label',
            'created_at',
            'updated_at',
            'feed_type',
            
            # === ANNOUNCEMENT-SPECIFIC FIELDS ===
            'image_url',
            'is_pinned',
            'expiry_date',
        ]
        read_only_fields = ['id', 'notification_type', 'created_at', 'updated_at', 'created_by']
    
    def get_feed_type(self, obj):
        """Return 'announcement' for frontend type discrimination"""
        return 'announcement'
    
    def get_creator_info(self, obj):
        """
        Get creator details (if exists).
        Uses 'creator_info' as future-proof field name.
        """
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'first_name': obj.created_by.first_name,
                'last_name': obj.created_by.last_name,
                'full_name': obj.created_by.get_full_name(),  # ✅ Convenience field!
                'profile_picture_url': obj.created_by.profile_picture_url
            }
        return None
    
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
    
    def create(self, validated_data):
        """Set created_by from request.user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
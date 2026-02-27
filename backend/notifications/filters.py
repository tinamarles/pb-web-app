import django_filters
from django.db.models import Q
from django.utils import timezone

from .models import Notification, Announcement
from public.constants import NotificationType


class NotificationFilter(django_filters.FilterSet):
    """
    Filter for Notification model.
    
    USAGE EXAMPLES:
    - GET /api/notifications/?is_read=false              (unread only - replaces @action!)
    - GET /api/notifications/?notification_type=2        (friend requests only)
    - GET /api/notifications/?club=5                     (club-specific notifications)
    - GET /api/notifications/?is_read=false&club=5       (unread club notifications)
    - GET /api/notifications/?league=10                  (league/event notifications)
    - GET /api/notifications/?match=15                   (match notifications)
    """
    
    # Filter by notification type (integer constant)
    notification_type = django_filters.NumberFilter(
        field_name='notification_type',
        help_text='Filter by notification type (integer from NotificationType constants)'
    )
    
    # Filter by read status (boolean)
    is_read = django_filters.BooleanFilter(
        field_name='is_read',
        help_text='Filter by read status (true/false) - REPLACES @action unread!'
    )
    
    # Filter by related club
    club = django_filters.NumberFilter(
        field_name='club__id',
        help_text='Filter by club ID (integer)'
    )
    
    # Filter by related league/event
    league = django_filters.NumberFilter(
        field_name='league__id',
        help_text='Filter by league/event ID (integer)'
    )
    
    # Filter by related match
    match = django_filters.NumberFilter(
        field_name='match__id',
        help_text='Filter by match ID (integer)'
    )
    
    # Filter by sender
    sender = django_filters.NumberFilter(
        field_name='sender__id',
        help_text='Filter by sender user ID (integer)'
    )
    
    # Filter by date range
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter notifications created after this datetime (ISO 8601)'
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter notifications created before this datetime (ISO 8601)'
    )
    
    class Meta:
        model = Notification
        fields = [
            'notification_type',
            'is_read',
            'club',
            'league',
            'match',
            'sender',
            'created_after',
            'created_before',
        ]


class AnnouncementFilter(django_filters.FilterSet):
    """
    Filter for Announcement model.
    
    USAGE EXAMPLES:
    - GET /api/announcements/?club=5                     (club announcements)
    - GET /api/announcements/?is_pinned=true             (pinned only)
    - GET /api/announcements/?notification_type=100      (general announcements)
    - GET /api/announcements/?league=10                  (league announcements)
    - GET /api/announcements/?active=true                (non-expired only)
    """
    
    # Filter by notification type (integer constant)
    notification_type = django_filters.NumberFilter(
        field_name='notification_type',
        help_text='Filter by announcement type (integer from NotificationType constants)'
    )
    
    # Filter by club
    club = django_filters.NumberFilter(
        field_name='club__id',
        help_text='Filter by club ID (integer) - REQUIRED for user announcements!'
    )
    
    # Filter by league/event
    league = django_filters.NumberFilter(
        field_name='league__id',
        help_text='Filter by league/event ID (integer)'
    )
    
    # Filter by match
    match = django_filters.NumberFilter(
        field_name='match__id',
        help_text='Filter by match ID (integer)'
    )
    
    # Filter by pinned status
    is_pinned = django_filters.BooleanFilter(
        field_name='is_pinned',
        help_text='Filter by pinned status (true/false)'
    )
    
    # Filter by active status (not expired)
    active = django_filters.BooleanFilter(
        method='filter_active',
        help_text='Filter by active status (true = not expired, false = expired)'
    )
    
    # Filter by creator
    created_by = django_filters.NumberFilter(
        field_name='created_by__id',
        help_text='Filter by creator user ID (integer)'
    )
    
    # Filter by date range
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter announcements created after this datetime (ISO 8601)'
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter announcements created before this datetime (ISO 8601)'
    )
    
    def filter_active(self, queryset, name, value):
        """
        Filter by active status (not expired).
        
        active=true  → expiry_date is null OR expiry_date >= today
        active=false → expiry_date < today
        """
        today = timezone.localtime().date()
        
        if value:  # active=true
            return queryset.filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
            )
        else:  # active=false (expired)
            return queryset.filter(
                expiry_date__lt=today
            )
    
    class Meta:
        model = Announcement
        fields = [
            'notification_type',
            'club',
            'league',
            'match',
            'is_pinned',
            'active',
            'created_by',
            'created_after',
            'created_before',
        ]
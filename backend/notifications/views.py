
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, permissions

from public.constants import MembershipStatus

from .models import Notification, Announcement
from clubs.models import ClubMembership
from .serializers import NotificationSerializer, AnnouncementSerializer
from django.utils import timezone
from django.db.models import Q


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """
    Get all notifications for current user.
    
    Returns:
        - notifications: List of notification objects
        - unread_count: Number of unread notifications
    """
    user = request.user
    
    # Get all notifications for user (most recent first)
    notifications = Notification.objects.filter(
        recipient=user
    ).select_related('sender', 'club', 'league', 'match').order_by('-created_at')[:50]  # Limit to 50 most recent
    
    # Serialize
    serializer = NotificationSerializer(notifications, many=True)
    
    # Calculate unread count
    unread_count = Notification.objects.filter(
        recipient=user,
        is_read=False
    ).count()
    
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            recipient=request.user
        )
        notification.mark_as_read()
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def dismiss_notification(request, notification_id):
    """Delete a notification"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            recipient=request.user
        )
        notification.delete()
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)
    
class AnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing announcements.

    list: Get all announcements for clubs the user is a member of
    create: Create new announcement (admin/captain only)
    retrieve: Get specific announcement
    update/patch: Update announcement (admin/captain only)
    destroy: Delete announcement (admin/captain only)
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        today = timezone.localtime().date()

        # Get clubs user is member of
        user_clubs = user.club_memberships.values_list('club', flat=True)
        
        return Announcement.objects.filter(
            club__in=user_clubs).filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
                ).select_related('club', 'created_by', 'league', 'match').order_by(
                    '-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread announcements.
        For now, treat all as 'unread' - can add read tracking later
        """
        count = self.get_queryset().count()
        return Response({'count': count})

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_feed(request):
    """
    Unified feed of notifications and announcements for the user.
    Returns merged list sorted by created_at descending.    
    """
    user = request.user
    today = timezone.localtime().date()
    
    # Get notifications with related objects (prevents N+1 queries)
    notifications = Notification.objects.filter(
        recipient=user
    ).select_related('sender', 'club', 'league', 'match')
    
    # Get announcements for user's active club memberships with related objects
    user_clubs = user.club_memberships.filter(status=MembershipStatus.ACTIVE).values_list('club', flat=True)

    announcements = Announcement.objects.filter(
        club__in=user_clubs
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
    ).select_related('club', 'created_by', 'league', 'match')
    
    # Serialize both
    # Note: feed_type is automatically added by the serializers!
    notification_data = NotificationSerializer(notifications, many=True).data
    announcement_data = AnnouncementSerializer(announcements, many=True).data

    # Merge and sort by created_at descending (newest first)
    feed = list(notification_data) + list(announcement_data)
    feed.sort(key=lambda x: x['created_at'], reverse=True)

    # Calculate badge count (unread notifications + all announcements)
    unread_notification_count = notifications.filter(is_read=False).count()
    announcement_count = announcements.count()  # TODO: add read tracking
    badge_count = unread_notification_count + announcement_count
    
    return Response({
        'items': feed,
        'badge_count': badge_count,
        'unread_notifications': unread_notification_count,
        'announcement_count': announcement_count,
    })

# notifications/views.py
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action

from .models import Notification, Announcement
from .serializers import NotificationSerializer, AnnouncementSerializer
from .filters import NotificationFilter, AnnouncementFilter
from .permissions import IsAnnouncementClubMember, IsNotificationRecipient
from clubs.models import ClubMembership
from public.constants import MembershipStatus
from public.pagination import StandardPagination  # ✅ Import shared pagination!

User = get_user_model()

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notifications.
    
    ENDPOINTS:
    - GET    /api/notifications/                → list (merged feed)
    - GET    /api/notifications/?is_read=false  → unread (filter!)
    - GET    /api/notifications/123/            → retrieve
    - PATCH  /api/notifications/123/            → update (mark as read!)
    - DELETE /api/notifications/123/            → destroy
    - POST   /api/notifications/mark-all-read/  → bulk mark as read
    """
    pagination_class = StandardPagination
    permission_classes = [IsAuthenticated, IsNotificationRecipient]
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = NotificationFilter
    ordering_fields = ['created_at', 'is_read']  # ✅ Adjust per model
    ordering = ['-created_at']
    search_fields = ['title', 'content', 'sender__last_name', 'recipient__last_name']
    
    def get_queryset(self):
        """
        Get ALL notifications for the user (including private notifications without club_id).
        
        ✅ This returns:
        - Club invitations (has club_id)
        - Match invitations (has club_id + match_id)
        - Friend requests (NO club_id)
        - System notifications (NO club_id)
        - Admin messages (NO club_id)

        What about for a function that shows all the notifications a User has sent?
        --> this would require to filter by sender=self.request.user
        """
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender', 'club', 'league', 'match')
    
    def list(self, request):
        """
        Return merged feed of notifications + announcements.
        USE CASE: Dashboard feed (shows everything)
        
        ENDPOINT: GET /api/notifications/
        
        Returns:
        {
            'items': [...],              // Merged notifications + announcements
            'badge_count': 5,            // Total unread count
            'unread_notifications': 3,
            'announcement_count': 2
        }
        """
        user = request.user
        today = timezone.localtime().date()
        
        # Get ALL notifications (including private ones without club_id!)
        notifications = self.get_queryset()
        
        # Get announcements for user's active club memberships
        user_club_ids = ClubMembership.objects.filter(
            member=user,
            status=MembershipStatus.ACTIVE
        ).values_list('club_id', flat=True)
        
        announcements = Announcement.objects.filter(
            club_id__in=user_club_ids
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
        ).select_related('club', 'created_by', 'league', 'match')
        
        # Serialize both
        notification_data = NotificationSerializer(notifications, many=True).data
        announcement_data = AnnouncementSerializer(announcements, many=True).data
        
        # Merge and sort
        feed = list(notification_data) + list(announcement_data)
        feed.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Calculate counts
        unread_notification_count = notifications.filter(is_read=False).count()
        announcement_count = announcements.count()
        badge_count = unread_notification_count + announcement_count
        
        return Response({
            'items': feed,
            'badge_count': badge_count,
            'unread_notifications': unread_notification_count,
            'announcement_count': announcement_count,
        })
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """
        Mark ALL notifications as read (bulk operation).
        
        ENDPOINT: POST /api/notifications/mark-all-read/
        
        Returns:
        {
            'success': True,
            'updated_count': 5  // Number of notifications marked as read
        }
        """
        unread_notifications = self.get_queryset().filter(is_read=False)
        updated_count = unread_notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'success': True,
            'updated_count': updated_count
        })
    
class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing announcements.

    list: Get all announcements for clubs the user is a member of
    create: Create new announcement (admin/captain only)
    retrieve: Get specific announcement
    update/patch: Update announcement (admin/captain only)
    destroy: Delete announcement (admin/captain only)
    """
    queryset = Announcement.objects.all()  # ✅ ADD THIS!
    permission_classes = [IsAuthenticated, IsAnnouncementClubMember]
    pagination_class = StandardPagination  # ✅ ADD pagination too!
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AnnouncementFilter
    search_fields = ['title', 'content', 'created_by__last_name', 'league__name']  # ✅ ADD search!
    ordering_fields = ['created_at', 'title', 'created_by__last_name', 'league__name', 'expiry_date']
    ordering = ['-created_at']
    serializer_class = AnnouncementSerializer

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

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

    # @action(detail=False, methods=['get'], url_path='unread')
    # def unread_count(self, request):
    #     """
    #     Get count of unread announcements.
    #     For now, treat all as 'unread' - can add read tracking later
    #     """
    #     count = self.get_queryset().count()
    #     return Response({'count': count})



  
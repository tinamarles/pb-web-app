'''
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

    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get ONLY unread notifications (NO announcements).
        USE CASE: Bell icon in header
        
        ENDPOINT: GET /api/notifications/unread/
        
        Returns:
        {
            'items': [...],  // Only unread notifications
            'count': 5       // Number of unread
        }
        """
        unread_notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        
        return Response({
            'items': serializer.data,
            'count': unread_notifications.count()
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark single notification as read.
        
        ENDPOINT: POST /api/notifications/<id>/mark-read/
        """
        notification = self.get_object()
        
        # ✅ Set fields directly (no mark_as_read() method exists!)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        return Response({'success': True})
    
'''
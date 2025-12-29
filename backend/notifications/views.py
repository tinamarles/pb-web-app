from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

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
    ).order_by('-created_at')[:50]  # Limit to 50 most recent
    
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
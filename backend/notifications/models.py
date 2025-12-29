from django.db import models
from django.contrib.auth import get_user_model
from public.constants import NotificationType
from django.utils import timezone

User = get_user_model()

class Notification(models.Model):
    """
    Universal notification model.
    Stores all notifications for users.
    """
    
    # Who receives this notification
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='User who receives this notification'
    )
    
    # Who sent it (optional - system notifications have sender=None)
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
        help_text='User who triggered this notification (optional)'
    )
    
    # What type of notification
    notification_type = models.IntegerField(
        choices=NotificationType,
        help_text='Type of notification'
    )
    
    # Content
    title = models.CharField(
        max_length=255,
        help_text='Short title (e.g., "Event Invitation")'
    )
    
    message = models.TextField(
        help_text='Full notification message'
    )
    
    # Read status
    is_read = models.BooleanField(
        default=False,
        help_text='Whether user has read this notification'
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When user read this notification'
    )
    
    # Action (where to go when clicked)
    action_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='URL to navigate to when clicked (e.g., "/events/101")'
    )
    action_label = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Label for action button (e.g., "View Match", "Renew Membership")'
    )
    
    # Related objects (optional - for context)
    club = models.ForeignKey(
        'clubs.Club',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text='Related club (if applicable)'
    )
    
    league = models.ForeignKey(
        'leagues.League',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text='Related league (if applicable)'
    )
    
    match = models.ForeignKey(
        'matches.Match',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text='Related match (if applicable)'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional data (e.g., milestone details, match scores)'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'notification_type', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.recipient.get_full_name()}: {self.title}"
    
    def mark_as_read(self):
        """
        BUSINESS LOGIC:
        Mark notification as read.
        
        PURPOSE:
        - Update is_read flag
        - Record when user read it
        - Decrease badge count
        
        WHEN CALLED:
        - User clicks notification in dropdown
        - User clicks "Mark as read" button
        - User views notification in full page
        """
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
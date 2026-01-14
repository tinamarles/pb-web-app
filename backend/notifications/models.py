from django.db import models
from django.contrib.auth import get_user_model
from public.constants import MembershipStatus, NotificationType
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def get_default_expiry_date():
    return timezone.now().date() + timedelta(days=30)

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

    content = models.TextField(
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


class Announcement(models.Model):
    """
    Club-wide announcements that broadcast to all members.
    Different from Notifications which are 1-to-1.
    
    Club is REQUIRED - all announcements belong to a club (for permissions/organization).
    League/Match are OPTIONAL - they narrow the audience within the club.
    
    Examples:
    - Club admin announces new court rules → club only (all members)
    - League captain announces playoff schedule → club + league (league members only)
    - Match organizer announces court change → club + match (match participants only)
    """
    
    # Foreign Keys
    club = models.ForeignKey(
        'clubs.Club',
        on_delete=models.CASCADE,
        related_name='announcements',
        help_text='Club this announcement belongs to (REQUIRED - for permissions and organization)'
    )
    notification_type = models.IntegerField(
        choices=NotificationType,
        editable=False,
        help_text='Type of announcement - auto-calculated based on context'
    )
    league = models.ForeignKey(
        'leagues.League',
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        help_text='Optional: Narrows audience to league participants only'
    )
    match = models.ForeignKey(
        'matches.Match',
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        help_text='Optional: Narrows audience to match participants only'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_announcements'
    )
    
    # Content
    title = models.CharField(max_length=255)
    content = models.TextField()
    image_url = models.URLField(blank=True)
    
    # Action (CTA button)
    action_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='URL to navigate to when clicked (e.g., "/events/101")'
    )
    action_label = models.CharField(
        max_length=100,
        blank=True,
        help_text='Label for action button (e.g., "View Match", "Renew Membership")'
    )
    
    # Announcement-specific fields
    is_pinned = models.BooleanField(default=False)
    expiry_date = models.DateField(
        null=True,
        blank=True,
        default=get_default_expiry_date,
        help_text='Announcement expires after this date (default: 30 days from creation)'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']  # Pinned first, then newest
        indexes = [
            models.Index(fields=['club', '-created_at']),
            models.Index(fields=['league', '-created_at']),
            models.Index(fields=['match', '-created_at']),
            models.Index(fields=['is_pinned', '-created_at']),
        ]
    
    def __str__(self):
        if self.match:
            return f"{self.club.name} - Match #{self.match.id}: {self.title}"
        elif self.league:
            return f"{self.club.name} - {self.league.name}: {self.title}"
        else:
            return f"{self.club.name}: {self.title}"
    
    def clean(self):
        """Validation: League and Match must belong to the same club."""
        from django.core.exceptions import ValidationError
        
        if self.league and self.league.club != self.club:
            raise ValidationError('League must belong to the same club as the announcement.')
        
        if self.match and self.match.club != self.club:
            raise ValidationError('Match must belong to the same club as the announcement.')
        
    def save(self, *args, **kwargs):
        self.notification_type = self._calculate_notification_type()
        super().save(*args, **kwargs)
    
    def _calculate_notification_type(self):
        """Determine notification type based on context."""
        if self.match:
            return NotificationType.MATCH_ANNOUNCEMENT
        elif self.league:
            return NotificationType.LEAGUE_ANNOUNCEMENT
        else:
            return NotificationType.CLUB_ANNOUNCEMENT
    
    def get_audience_queryset(self):
        """
        Returns queryset of users who should see this announcement.
        
        - If only club: All club members
        - If club + league: League participants only
        - If club + match: Match participants only
        """
        if self.match:
            # Match participants only
            return User.objects.filter(
                models.Q(match_participations__match=self.match)
            ).distinct()
        elif self.league:
            # League participants only
            return User.objects.filter(
                models.Q(league_participations__league=self.league)
            ).distinct()
        else:
            # All club members
            return User.objects.filter(
                memberships__club=self.club,
                memberships__status=MembershipStatus.ACTIVE
            ).distinct()
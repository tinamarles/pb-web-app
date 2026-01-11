from django.contrib import admin
from .models import Notification, Announcement

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['id', 'club', 'notification_type', 'title', 'content', 'image_url', 'action_url', 'action_label', 'expiry_date']
    list_filter = ['is_pinned', 'notification_type', 'created_by', 'expiry_date']
    search_fields = ['club__name', 'title', 'content']
    readonly_fields = ['created_at', 'updated_at']
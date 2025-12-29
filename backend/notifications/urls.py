from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_user_notifications, name='user-notifications'),
    path('<int:notification_id>/read/', views.mark_notification_read, name='notification-read'),
    path('<int:notification_id>/', views.dismiss_notification, name='notification-dismiss'),
]
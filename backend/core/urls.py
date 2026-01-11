
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

# Import the ViewSets from different apps
from users.views import CustomTokenObtainPairView, LogoutAndBlacklistRefreshToken, UserDetailsView
from clubs.views import ClubViewSet, ClubMembershipViewSet
from notifications.views import AnnouncementViewSet, notification_feed    

# Create a single router instance
router = DefaultRouter()

# Register all viewsets with the single router

router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'memberships', ClubMembershipViewSet, basename='club-membership')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/logout/", LogoutAndBlacklistRefreshToken.as_view(), name='logout_and_blacklist'),
    path("api/auth/user/", UserDetailsView.as_view(), name="user_details" ),
    # App-specific API URLs
    path('api/members/', include('members.urls')),
    path('api/profile/', include('users.urls')),
    path('api/clubs/', include('clubs.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/feed/', notification_feed, name='notification_feed'),
    # Use include to attach the URLs from the single, master router
    path('api/', include(router.urls)),
]

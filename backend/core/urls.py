
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

# Import the ViewSets from different apps
from users.views import CustomTokenObtainPairView, LogoutAndBlacklistRefreshToken, UserDetailsView
from clubs.views import ClubViewSet, ClubMembershipViewSet, AdminClubMembershipViewSet
from leagues.views import LeagueViewSet, AdminEventsViewSet, AdminLeagueParticipantsViewSet
from notifications.views import AnnouncementViewSet, NotificationViewSet    

# Create a single router instance
router = DefaultRouter()

# Register all viewsets with the single router

router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'leagues', LeagueViewSet, basename='leagues')
router.register(r'memberships', ClubMembershipViewSet, basename='club-membership')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')
router.register(r'notifications', NotificationViewSet, basename='notifications')

router.register(r'admin/events', AdminEventsViewSet, basename='admin-events')
router.register(r'admin/participants', AdminLeagueParticipantsViewSet, basename='admin-league-participants')
router.register(r'admin/memberships', AdminClubMembershipViewSet, basename='admin-membership')

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/logout/", LogoutAndBlacklistRefreshToken.as_view(), name='logout_and_blacklist'),
    path("api/auth/user/", UserDetailsView.as_view(), name="user_details" ),
    # App-specific API URLs
    path('api/members/', include('members.urls')), # Not used at all
    path('api/profile/', include('users.urls')),   # update, registration, activities
    path('api/clubs/', include('clubs.urls')),     # membership/<id>/set-preferred
    path('api/leagues/', include('leagues.urls')), # session/<id>/participants
    
    # Use include to attach the URLs from the single, master router
    path('api/', include(router.urls)),
]

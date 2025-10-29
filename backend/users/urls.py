# members/urls.py

from django.urls import path
from .views import UserProfileUpdateView, UserRegistrationView

urlpatterns = [
    # The URL for updating a user's profile
    path('update/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    
    # The URL for user registration
    path('registration/', UserRegistrationView.as_view(), name='user-registration'),
]
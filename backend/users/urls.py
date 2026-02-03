# members/urls.py

from django.urls import path
from .views import UserProfileUpdateView, UserRegistrationView, user_activities_view

urlpatterns = [
    # The URL for updating a user's profile
    path('update/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    
    # The URL for user registration
    path('registration/', UserRegistrationView.as_view(), name='user-registration'),

    # The URL for user activities
    path('activities/', user_activities_view, name='user-activities'),
]
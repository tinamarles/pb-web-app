# members/urls.py

from django.urls import path
from .views import MemberListCreateAPIView, MemberRetrieveUpdateDestroyAPIView

urlpatterns = [
    # Route for listing all members and creating a new one
    path('', MemberListCreateAPIView.as_view(), name='member-list-create'),
    
    # Route for retrieving, updating, and deleting a single member
    path('<int:pk>/', MemberRetrieveUpdateDestroyAPIView.as_view(), name='member-retrieve-update-destroy'),

    # Route for User registration
    # path("register/", RegisterUserView.as_view(), name="register_user"),
]
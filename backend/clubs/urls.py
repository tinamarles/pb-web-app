# clubs/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # User endpoint (set preferred)
    path(
        'membership/<int:membership_id>/set-preferred/',
        views.set_preferred_club_membership,
        name='set_preferred_club_membership'
    ),
    
    # Admin endpoint (update details)
    path(
        'membership/<int:membership_id>/',
        views.update_club_membership_admin,
        name='update_club_membership_admin'
    ),
]
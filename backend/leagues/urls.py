# leagues/urls.py

from django.urls import path
from .views import SessionParticipantsView, get_eligible_members, bulk_add_participants, update_participation_status, bulk_update_participation_status

urlpatterns = [
    # User endpoint (set preferred)
    path('session/<int:session_id>/participants/', SessionParticipantsView.as_view(), name="session_participants"),
    
    # GET eligible members for adding to league
    path(
        '<int:league_id>/eligible-members/',
        get_eligible_members,
        name='league-eligible-members'
    ),
    # POST bulk add participants
    path(
        '<int:league_id>/participants/bulk-add/',
        bulk_add_participants,
        name='league-participants-bulk-add'
    ),
    # ========================================
    # PARTICIPANT STATUS UPDATES
    # ========================================
    # PATCH single participant status
    path(
        'participation/<int:participation_id>/status/',
        update_participation_status,
        name='participation-status-update'
    ),
    # PATCH bulk participant status
    path(
        'participations/bulk-status-update/',
        bulk_update_participation_status,
        name='participations-bulk-status-update'
    ),
]
# leagues/urls.py

from django.urls import path
from .views import SessionParticipantsView

urlpatterns = [
    # User endpoint (set preferred)
    path('session/<int:session_id>/participants/', SessionParticipantsView.as_view(), name="session_participants"),
]
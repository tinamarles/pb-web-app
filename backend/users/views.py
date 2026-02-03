import logging
logger = logging.getLogger(__name__)

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes

from .serializers import CustomTokenObtainPairSerializer, CustomUserUpdateSerializer, CustomUserRegistrationSerializer
from clubs.serializers import CustomUserSerializer, MemberUserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model

from leagues.models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from leagues.serializers import LeagueActivitySerializer, NextOccurrenceSerializer
from courts.models import UserCourtBooking
from courts.serializers import UserCourtBookingSerializer
from public.constants import LeagueParticipationStatus, LeagueAttendanceStatus, ActivityType

# Get the active user model
User = get_user_model()

# Create your views here.
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # 🔍 LOG WHAT DJANGO RECEIVES
        logger.info("=" * 50)
        logger.info("🔵 TOKEN REQUEST RECEIVED")
        logger.info(f"🔵 Request method: {request.method}")
        logger.info(f"🔵 Request path: {request.path}")
        logger.info(f"🔵 Origin header: {request.headers.get('Origin', 'NOT SET')}")
        logger.info(f"🔵 Content-Type: {request.headers.get('Content-Type', 'NOT SET')}")
        logger.info(f"🔵 Request body data: {request.data}")
        logger.info("=" * 50)
        
        # Call the parent class method (does the actual work)
        response = super().post(request, *args, **kwargs)
        
        # 🔍 LOG THE RESPONSE
        logger.info(f"🔵 Response status: {response.status_code}")
        if response.status_code != 200:
            logger.error(f"❌ Error response data: {response.data}")
        else:
            logger.info("✅ Success! Tokens generated")
        logger.info("=" * 50)
        
        return response
    
class LogoutAndBlacklistRefreshToken(APIView):
    permission_classes = () # We don't need authentication to log out

    @transaction.atomic # Ensures that the token is blacklisted and deleted together
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            
            # The refresh token is the key to blacklisting.
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Optional: Delete the outstanding token from the database
            # This is not strictly necessary as blacklisting prevents its use,
            # but it helps keep the OutstandingTokens table clean.
            OutstandingToken.objects.get(token=str(token)).delete()

            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class UserProfileUpdateView(RetrieveUpdateAPIView):
    serializer_class = CustomUserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the current authenticated user's profile
        return self.request.user
    
class UserRegistrationView(APIView):
    """
    API endpoint for user registration that also returns a JWT token.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomUserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        # Pass the request data to the serializer for validation and user creation
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Call the serializer's create method, which returns the new user object
        user = serializer.save()

        # Generate the refresh and access tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Add custom claims to the access token payload, mirroring the login serializer
        access['username'] = user.username
        access['email'] = user.email

        # Set the user_role to 'public' for all new users
        user_role_value = 'public'
        access['user_role'] = user_role_value
        
        # Build the final response payload to match the login serializer
        response_data = {
            'refresh': str(refresh),
            'access': str(access),
            'user_role': user_role_value,
            'detail': "Registration successful."
        }

        return Response(response_data, status=status.HTTP_201_CREATED)

class UserDetailsView(RetrieveAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Returns the current authenticated user
        return self.request.user

    def get_serializer_class(self):
        '''
        Dynamically returns the correct serializer based on whether
        the user is a member (has clubs) or is a public user (no memberships)
        '''
        user = self.get_object()
        if (user.club_memberships.exists()): 
            return MemberUserSerializer
        return CustomUserSerializer
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activities_view(request):
    """
    Returns ALL activities for the authenticated user:
    - League sessions (as captain OR participant)
    - Court bookings (as organizer OR participant)
    
    CRITICAL RULES:
    1. Captain sees ALL sessions (playing or not)
    2. Participant sees ONLY ATTENDING sessions
    3. Captain + playing = ONE entry with both flags
    4. Past activities INCLUDED
    5. Pre-sorted by date → time
    6. Flat response (no separate arrays)
    
    ENDPOINT: /api/profile/activities/
    RESPONSE: { activities: [...] }
    """
    user = request.user
    activities = []
    
    # ========================================
    # PART 1: LEAGUE SESSIONS
    # ========================================
    
    # Get leagues where user is captain
    captain_leagues = League.objects.filter(captain=user, is_active=True)
    captain_league_ids = list(captain_leagues.values_list('id', flat=True))
    
    # Get leagues where user is participant
    # ✅ Just get IDs - we don't need the participation objects!
    participant_league_ids = list(LeagueParticipation.objects.filter(
        member=user,
        status=LeagueParticipationStatus.ACTIVE
    ).values_list('league_id', flat=True))
    
    # ✅ Convert to sets for O(1) lookup!
    captain_league_ids_set = set(captain_league_ids)
    participant_league_ids_set = set(participant_league_ids)

    # Combine to get ALL leagues user is involved with
    all_league_ids = set(captain_league_ids + participant_league_ids)
    
    if all_league_ids:
        # ✅ Simple query - no annotations needed!
        leagues = League.objects.filter(
            id__in=all_league_ids,
            is_active=True
        ).select_related('captain', 'club')
        
        for league in leagues:
            # ✅ Simple set membership checks - O(1) lookup!
            user_is_captain = league.id in captain_league_ids_set
            user_is_participant = league.id in participant_league_ids_set
            
            # ✅ Different logic for captains vs participants!
            if user_is_captain:
                # CAPTAIN: Show ALL sessions (they manage the league!)
                sessions = SessionOccurrence.objects.filter(
                    league=league,
                    is_cancelled=False
                ).select_related(
                    'league_session__court_location'
                ).order_by('session_date', 'start_datetime')
                
            elif user_is_participant:
                # PARTICIPANT: Show ONLY sessions they're attending!
                # ✅ Use reverse relation (related_name='attendances') to filter!
                sessions = SessionOccurrence.objects.filter(
                    league=league,
                    is_cancelled=False,
                    attendances__league_participation__member=user,
                    attendances__status=LeagueAttendanceStatus.ATTENDING
                ).distinct().select_related(
                    'league_session__court_location'
                ).order_by('session_date', 'start_datetime')
                
            else:
                # Should never happen (league in all_league_ids but user not captain/participant?)
                continue
            
            # ✅ Build event info ONCE (reused for all sessions in this league)
            # ✅ USE SERIALIZER! (DRY principle)
            # ✅ Pass user flags via context!
            event_serializer = LeagueActivitySerializer(league, context={
                'user_is_captain': user_is_captain,
                'user_is_participant': user_is_participant
            })
            event_data = event_serializer.data
            
            for session in sessions:
                # ✅ Get attendance status
                # For CAPTAINS: Need to check if they're also attending
                # For PARTICIPANTS: We already filtered, so they're always attending
                if user_is_captain:
                    # Check if captain is also attending (from prefetch or separate query)
                    user_is_attending = LeagueAttendance.objects.filter(
                        session_occurrence=session,
                        league_participation__member=user,
                        status=LeagueAttendanceStatus.ATTENDING
                    ).exists()
                else:
                    # Participant - already filtered by attendance!
                    user_is_attending = True
                
                # ✅ Get attendance status
                user_attendance_status = LeagueAttendanceStatus.ATTENDING if user_is_attending else None
                
                # ✅ Serialize session (pass attendance via context!)
                session_data = NextOccurrenceSerializer(session, context={
                    'user_attendance_status': user_attendance_status  # Just pass the boolean!
                }).data
                
                activities.append({
                    'type': ActivityType.EVENT,
                    'event': event_data,
                    'session': session_data
                })
    # ========================================
    # PART 2: COURT BOOKINGS
    # ========================================
    
    # Get bookings where user is the booker OR a player
    # NOTE: No status field! If booking exists, it's confirmed.
    bookings = UserCourtBooking.objects.filter(
        Q(user=user) | Q(with_players=user)
    ).select_related(
        'court_location',
        'user'  # The person who created the booking
    ).prefetch_related('with_players').distinct().order_by('booking_date', 'start_time')
    
    for booking in bookings:
        serializer = UserCourtBookingSerializer(booking)
        booking_data = serializer.data
        participants_count = len(booking_data['with_players'])
        
        activities.append({
            'type': ActivityType.BOOKING,
            'event': {
                'id': booking_data['id'],
                'booking_type': booking_data['booking_type'],
                'captain_info': booking_data['captain_info'],
                'user_is_organizer': booking.user == user,
                'court_number': booking_data.get('court_number'),
                'with_players': booking_data['with_players'],
                'external_booking_reference': booking_data.get('external_booking_reference'),
                'notes': booking_data.get('notes', ''), 
            },
            'session': {
                'id': booking_data['id'],
                'date': booking_data['date'],
                'start_time': booking_data['start_time'],
                'end_time': booking_data['end_time'],
                'court_info': booking_data['court_info'],
                'participants_count': participants_count,
                'user_attendance_status': LeagueAttendanceStatus.ATTENDING,
                'registration_open': False,
                'max_participants': None,
            }
        })
  
    # ========================================
    # PART 3: SORT AND RETURN
    # ========================================
    
    # Sort ALL activities by date → time
    def get_activity_datetime(activity):
        
        date = activity['session']['date']
        time = activity['session']['start_time']
        return (date, time)
    
    activities.sort(key=get_activity_datetime)
    
    return Response({
        'activities': activities
    })
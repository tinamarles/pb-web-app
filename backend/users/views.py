import logging
logger = logging.getLogger(__name__)

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import CustomTokenObtainPairSerializer, CustomUserUpdateSerializer, CustomUserRegistrationSerializer
from clubs.serializers import CustomUserSerializer, MemberUserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.db import transaction
from django.contrib.auth import get_user_model



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
    

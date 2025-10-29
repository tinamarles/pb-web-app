# members/views.py

from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
# from django.contrib.auth.models import User
from .models import Member
from .serializers import MemberSerializer, CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.db import transaction


# This view will handle GET requests to list all members and POST requests to create a new member.
class MemberListCreateAPIView(generics.ListCreateAPIView):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

# This view will handle GET, PUT, PATCH, and DELETE requests for a single member.
class MemberRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
'''
class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        # Use the serializer to validate incoming data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Retrieve validated data
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')
        username = serializer.validated_data.get('username', email)

        # Check if a Member record already exists for this email
        try:
            member = Member.objects.get(email=email)
            # Scenario A: Member exists, so we link the new User record
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            member.user = user  # Link the new user to the existing member
            member.save()
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                {"message": "Account claimed successfully. You are now a registered user linked to your member profile."},
                status=status.HTTP_201_CREATED,
                headers=headers
            )

        except Member.DoesNotExist:
            # Scenario B: Member does not exist, create a User record only
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                {"message": "Registration successful. You are a registered user with access to public features."},
                status=status.HTTP_201_CREATED,
                headers=headers
            )
'''

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
# members/serializers.py

from rest_framework import serializers
# from django.contrib.auth.models import User
from .models import Member
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Call the parent class's validate method to get the tokens
        data = super().validate(attrs)

        # Add custom data to the response payload
        user = self.user

        # Concatenate first and last name if they exist, otherwise use the username
        full_name = ''
        if user.first_name and user.last_name:
            full_name = f"{user.first_name} {user.last_name}"
        elif user.first_name:
            full_name = user.first_name
        else:
            full_name = user.username
        
        data['full_name'] = full_name
        data['is_member'] = hasattr(user, 'member_profile')
        data['has_clubs'] = False
        data['has_leagues'] = False

        # If the user has a linked Member record, check for club and league memberships
        if data['is_member']:
            data['has_clubs'] = user.member_profile.clubs_as_member.exists()
            data['has_leagues'] = user.member_profile.leagues_as_participant.exists()

        return data
    
class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'
'''
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "username", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
'''
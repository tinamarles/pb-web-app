# pickleball/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, Role, ClubMembershipType, ClubMembershipSkillLevel
from public.serializers import AddressSerializer
from users.serializers import CustomUserSerializer
from django_typomatic import ts_interface

# Get the active user model
User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 
                  'name', 
                  'description'
                  ] 

class ClubMembershipTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMembershipType
        fields = [
            'id', 
            'name', 
            'description',
            'registration_open_date',
            'registration_close_date',
            'requires_approval',
            'annual_fee',
            'current_member_count',
            'is_at_capacity']

class ClubMembershipSkillLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMembershipSkillLevel
        fields = [
            'id', 
            'level', 
            'description']

class NestedClubSerializer(serializers.ModelSerializer):
    '''
    A lightweight serializer for Club details without having all the 
    member-id's 
    '''
    address = AddressSerializer(read_only=True)

    class Meta:
        model = Club
        fields = [
            'id',
            'name',
            'banner_url',
            'club_type',
            'short_name',
            'description',
            'phone_number',
            'email',
            'website_url',
            'logo_url',
            'address',
            'autoapproval',
        ]

class ClubSerializer(serializers.ModelSerializer):
    '''
    Serializer for the Club model.
    '''
    address = AddressSerializer(read_only=True)

    class Meta:
        model = Club
        # Use '__all__' to include every field in the model.
        # Alternatively, you can list the fields you want to expose.
        # For example: fields = ('id', 'name', 'description', 'address', 'phone_number', 'email', 'website_url', 'logo_url')
        fields = '__all__'

        # Make 'members' and 'club_location' read-only on creation
        read_only_fields = ('members', 'address', 'created_at', 'updated_at')

    def create(self, validated_data):
        # We handle the creation of the Address and ClubMembership
        # in the perform_create() method of the ViewSet, so this
        # serializer's create method will be overridden.
        return super().create(validated_data)
    
    

# Serializer for member users, including related information
# This is the serializer used for Member Users 
# - via api endpoint api/auth/user that points to the UserDetailsView in users/views.py
@ts_interface()
class MemberUserSerializer(CustomUserSerializer):
    # Use the defined related_name here
    club_memberships = serializers.SerializerMethodField()

    class Meta(CustomUserSerializer.Meta):
        # Add the field name to the list of fields to be serialized
        fields = CustomUserSerializer.Meta.fields + ['club_memberships']

    def get_club_memberships(self, obj):
        # Retrieve all ClubMembership objects using the related_name
        club_memberships_queryset = obj.club_memberships.all()
        # Instantiate your existing ClubMembershipSerializer with the queryset
        serializer = ClubMembershipSerializer(club_memberships_queryset, many=True, context=self.context)
        return serializer.data

@ts_interface()
class ClubMembershipSerializer(serializers.ModelSerializer):
    # This will now correctly use the CustomUserSerializer
    club = NestedClubSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    type = ClubMembershipTypeSerializer(read_only=True)
    levels = ClubMembershipSkillLevelSerializer(many=True, read_only=True)

    class Meta:
        model = ClubMembership
        fields = ['id', 
                  'club', 
                  'roles', 
                  'type', 
                  'levels', 
                  'membership_number', 
                  'is_preferred_club',
                  'status',
                  'registration_start_date',
                  'registration_end_date',
                  'can_manage_club', 
                  'can_manage_members', 
                  'can_create_training',
                  'can_manage_leagues', 
                  'can_manage_league_sessions',
                  'can_cancel_league_sessions', 
                  'can_manage_courts',
                  ]
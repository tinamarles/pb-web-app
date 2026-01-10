# pickleball/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, Role, ClubMembershipType, ClubMembershipSkillLevel
from public.serializers import AddressSerializer
from public.constants import MembershipStatus   
from users.serializers import CustomUserSerializer
from notifications.serializers import NotificationSerializer
from leagues.serializers import LeagueSerializer
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
    Used for: ClubMembership.club, Club list views
    '''
    address = AddressSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()  # ✅ NEW!

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
            'member_count',  # ✅ NEW!
        ]
    def get_member_count(self, obj):
        """Count active club members"""
        return obj.members.filter(
        club_memberships__status=MembershipStatus.ACTIVE
    ).distinct().count()

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
    
# ========================================
# CLUB MEMBER SERIALIZER (for members tab)
# ========================================

class ClubMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for ClubMember data (combines User + ClubMembership).
    
    USED FOR:
    - GET /api/clubs/{id}/members/ (members tab)
    - GET /api/clubs/{id}/home/ (top members in home tab)
    
    TypeScript: ClubMember
    """
    # User fields (from member)
    id = serializers.IntegerField(source='member.id', read_only=True)
    first_name = serializers.CharField(source='member.first_name', read_only=True)
    last_name = serializers.CharField(source='member.last_name', read_only=True)
    profile_picture_url = serializers.CharField(source='member.profile_picture_url', read_only=True)
    email = serializers.EmailField(source='member.email', read_only=True)
    location = serializers.CharField(source='member.location', read_only=True)
    
    # ClubMembership fields
    membership_id = serializers.IntegerField(source='id', read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    levels = ClubMembershipSkillLevelSerializer(many=True, read_only=True)
    
    class Meta:
        model = ClubMembership
        fields = [
            # User fields
            'id',
            'first_name',
            'last_name',
            'profile_picture_url',
            'email',
            'location',
            # ClubMembership fields
            'membership_id',
            'roles',
            'levels',
            'type',
            'status',
            'joined_at',
            'is_preferred_club',
            # 'tags',  # TODO: Add tags if needed
        ]

# ========================================
# HOME TAB SERIALIZER
# ========================================

class ClubDetailHomeSerializer(serializers.Serializer):
    """
    Serializer for Home Tab data.
    ✅ Receives a DICTIONARY from the view!
    The dictionary has keys: 
        'club', 
        'latest_announcement', 
        'top_members', etc.
    
    USED FOR:
    - GET /api/clubs/{id}/home/
    
    TypeScript: ClubDetailHome
    
    Returns basic club data + home tab specific data:
    - Latest announcement
    - All announcements
    - Top members
    - Next event
    - Photos (optional)
    """
    # These fields tell DRF what to expect in the dictionary
    # Club data (reuse NestedClubSerializer)
    club = NestedClubSerializer(read_only=True)
    
    # Home tab specific data
    latest_announcement = NotificationSerializer(read_only=True, allow_null=True)
    all_announcements = NotificationSerializer(many=True, read_only=True, allow_null=True)
    top_members = ClubMemberSerializer(many=True, read_only=True, allow_null=True)
    next_event = LeagueSerializer(read_only=True, allow_null=True)
    # photos = PhotoSerializer(many=True, read_only=True, allow_null=True)  # TODO
    
    def to_representation(self, instance):
        """
        Flatten the structure so TypeScript gets:
        { id, name, ..., latestAnnouncement, topMembers, ... }
        
        Instead of:
        { club: {...}, latest_announcement: {...}, ... }
        
        ✅ instance is the DICTIONARY passed from the view!
        
        instance = {
            'club': <Club object>,
            'latest_announcement': <Notification object> or None,
            'all_announcements': <QuerySet>,
            'top_members': <QuerySet>,
            'next_event': <League object> or None,
        }
        """

        # ========================================
        # SERIALIZE THE CLUB DATA
        # ========================================
        club_data = NestedClubSerializer(instance['club']).data
        
        # ========================================
        # SERIALIZE THE HOME TAB DATA
        # ========================================
        home_data = {
            # ✅ instance.get('latest_announcement') gets the Notification from the dict!
            'latest_announcement': NotificationSerializer(instance.get('latest_announcement')).data if instance.get('latest_announcement') else None,
            'all_announcements': NotificationSerializer(instance.get('all_announcements', []), many=True).data,
            'top_members': ClubMemberSerializer(instance.get('top_members', []), many=True).data,
            'next_event': LeagueSerializer(instance.get('next_event')).data if instance.get('next_event') else None,
        }
        # ========================================
        # MERGE CLUB + HOME DATA (FLATTEN!)
        # ========================================
        # Merge club data + home data (club fields first, then home tab fields)
        return {**club_data, **home_data}


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
        
class UserClubMembershipUpdateSerializer(serializers.Serializer):
    """
    Serializer for USER updating their preferred club.
    
    KEY DIFFERENCE: Returns ALL user's memberships (not just one)
    
    Use case:
    - User on /profile/memberships page
    - User clicks "Set as Preferred"
    - Frontend needs to re-render entire list
    
    Input:
    - membership_id (in URL)
    - is_preferred_club: true (in body)
    
    Output:
    - Array of ALL user's ClubMemberships (with updated is_preferred states)
    """
    
    is_preferred_club = serializers.BooleanField(required=True)
    
    def update(self, instance, validated_data):
        """
        Update preferred club.
        
        Steps:
        1. Unset is_preferred_club on ALL user's memberships
        2. Set is_preferred_club on target membership
        3. Return the instance
        """
        is_preferred = validated_data.get('is_preferred_club')
        
        if is_preferred:
            user = instance.member
            
            # Unset all preferred clubs for this user
            ClubMembership.objects.filter(
                member=user,
                is_preferred_club=True
            ).update(is_preferred_club=False)
            
            # Set THIS membership as preferred
            instance.is_preferred_club = True
            instance.save()
        
        return instance
    
    def to_representation(self, user):
        """
        Custom representation: Return ALL memberships for this user.
        
        Note: This is called directly from the view with a User object.
        We bypass serializer.data because it can't handle list returns.
        """
        # Fetch ALL memberships for this user
        memberships = ClubMembership.objects.filter(member=user).select_related('club')
        
        # Return serialized array of memberships
        return ClubMembershipSerializer(memberships, many=True).data
    
class AdminClubMembershipUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for ADMIN updating membership details.
    
    KEY DIFFERENCE: Returns ONLY the updated membership
    
    Use case:
    - Admin on /admin/members/[membershipId] page
    - Admin editing membership details
    - Frontend only needs that ONE membership
    
    ACTUAL FIELDS FROM ClubMembership MODEL:
    - type (FK to ClubMembershipType) - Admin can change membership type
    - roles (ManyToMany to Role) - Admin can assign/remove roles
    - levels (ManyToMany to ClubMembershipSkillLevel) - Admin can assign skill levels
    - tags (ManyToMany to Tag) - Admin can add/remove tags (for subscription eligibility)
    - status (IntegerField with MembershipStatus choices) - Admin can change status
    - registration_start_date (DateField) - Admin can override
    - registration_end_date (DateField) - Admin can override
    - notes (TextField) - NEW field to add for admin notes (not in model yet!)
    
    CANNOT UPDATE:
    - is_preferred_club - OWNER-ONLY field!
    
    Input:
    - membership_id (in URL)
    - Any of the admin-editable fields (in body)
    - CANNOT include is_preferred_club!
    
    Output:
    - Single ClubMembership object (the one that was updated)
    """
    
    class Meta:
        model = ClubMembership
        fields = [
            'type',                      # FK to ClubMembershipType - Admin can change
            'roles',                     # ManyToMany to Role - Admin can assign roles
            'levels',                    # ManyToMany to ClubMembershipSkillLevel - Admin can assign levels
            'tags',                      # ManyToMany to Tag - Admin can add tags
            'status',                    # IntegerField - Admin can change status
            'registration_start_date',   # DateField - Admin can override
            'registration_end_date',     # DateField - Admin can override
            # 'notes',                   # TODO: Add this field to ClubMembership model
        ]
        read_only_fields = [
            'id',
            'member',                    # Can't reassign user
            'club',                      # Can't reassign club
            'is_preferred_club',         # OWNER-ONLY! Admin can't change!
            'membership_number',         # System-generated
            'created_at',
            'updated_at',
        ]
    
    def validate(self, attrs):
        """
        Ensure admin is not trying to update is_preferred_club.
        """
        if 'is_preferred_club' in self.initial_data:
            raise serializers.ValidationError({
                'is_preferred_club': 'Only membership owner can set preferred club'
            })
        return attrs
    
    def update(self, instance, validated_data):
        """
        Standard update - just updates the fields and returns the instance.
        
        Handles ManyToMany fields (roles, levels, tags) properly.
        """
        # Extract ManyToMany fields
        roles = validated_data.pop('roles', None)
        levels = validated_data.pop('levels', None)
        tags = validated_data.pop('tags', None)
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update ManyToMany fields
        if roles is not None:
            instance.roles.set(roles)
        if levels is not None:
            instance.levels.set(levels)
        if tags is not None:
            instance.tags.set(tags)
        
        return instance
    
    def to_representation(self, instance):
        """
        Return full ClubMembership serialization.
        """
        return ClubMembershipSerializer(instance).data
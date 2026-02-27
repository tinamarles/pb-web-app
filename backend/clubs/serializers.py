# pickleball/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, Role, ClubMembershipType, ClubMembershipSkillLevel
from public.serializers import AddressSerializer
from public.constants import MembershipStatus   
from users.serializers import CustomUserSerializer, UserInfoSerializer, UserDetailSerializer
from notifications.serializers import AnnouncementSerializer
from leagues.models import League

from leagues.mixins import CaptainInfoMixin
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
            'is_at_capacity',
            'is_registration_open', # ✅ ADDED: Send the computed property!]
            'created_at',
            'updated_at']  

class ClubMembershipSkillLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMembershipSkillLevel
        fields = [
            'id', 
            'level', 
            'description']

class ClubInfoSerializer(serializers.ModelSerializer):
    """
    Reusable minimal club data serializer.
    
    ✅ USE THIS instead of duplicating get_club_info()!
    
    Matches frontend TypeScript type:
    interface ClubInfo {
      id: number;
      name: string;
      logoUrl: string;  // ← snake_case in backend!
    }
    
    Usage:
    class MySerializer(serializers.ModelSerializer):
        club_info = ClubInfoSerializer(source='club')
    """
    class Meta:
        model = Club
        fields =['id',
                 'name',
                 'logo_url',
                 'club_type',
                 'short_name',
                 ]
        
    # id = serializers.IntegerField()
    # name = serializers.CharField()
    # logo_url = serializers.CharField()

class ClubDetailSerializer(ClubInfoSerializer):
    '''
    A lightweight serializer for Club details without having all the 
    member-id's  

    USED FOR:
    - GET /api/clubs/{id}/ (layout.tsx - basic club data)
    - Nested inside ClubMembership
    
    TypeScript: ClubDetail
    '''
    address = AddressSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()  # ✅ NEW!

    class Meta(ClubInfoSerializer.Meta):
        fields = ClubInfoSerializer.Meta.fields + [
            'description',
            'address',
            'phone_number',
            'email',
            'website_url',
            'logo_url',
            'banner_url',
            'autoapproval',
            'member_count',  # ✅ NEW!
        ]
    def get_member_count(self, obj):
        """Count active club members"""
        return obj.members.filter(
            club_memberships__status=MembershipStatus.ACTIVE  # ✅ INTEGER constant!
        ).distinct().count()

class ClubSerializer(ClubDetailSerializer):
    '''
    Full serializer for the Club model (admin/create/update only).
    Inherits all the fields and methods from ClubDetailSerializer
    
    USED FOR:
    - POST /api/clubs/ (create)
    - PATCH /api/clubs/{id}/ (update)
    
    TypeScript: Club
    '''
    class Meta(ClubDetailSerializer.Meta):
        fields = ClubDetailSerializer.Meta.fields + [
            'members',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('members', 'created_at', 'updated_at')

    def create(self, validated_data):
        # We handle the creation of the Address and ClubMembership
        # in the perform_create() method of the ViewSet, so this
        # serializer's create method will be overridden.
        return super().create(validated_data)
    
# ========================================
# HOME TAB SERIALIZER
# ========================================

class ClubHomeSerializer(serializers.Serializer):
    """
    Main serializer for Club Home Tab endpoint.
    
    Aggregates data from multiple sources:
    - club: Basic club info
    - latest_announcement: Most recent announcement
    - top_members: Top 10 members (by join date)
    - next_event: Event with earliest upcoming session
    
    View passes a dict with:
    {
        'club': Club instance,
        'latest_announcement': Announcement instance or None,
        'top_members': QuerySet of ClubMembership,
        'next_event': League instance or None,
        'next_occurrence': SessionOccurrence instance or None,
    }
    
    Returns snake_case (frontend converts to camelCase in actions.ts)
    """
    club_info = serializers.SerializerMethodField()
    latest_announcement = serializers.SerializerMethodField()
    top_members = serializers.SerializerMethodField()
    next_event = serializers.SerializerMethodField()
    
    def get_club_info(self, instance):
        """Return minimal club data using ClubInfoSerializer""" 
        from clubs.serializers import ClubInfoSerializer
        club = instance.get('club')
        return ClubInfoSerializer(club).data
    
    def get_latest_announcement(self, instance):
        """
        Serialize latest announcement.
        Returns None if no announcements exist.
        
        CRITICAL: REUSE existing AnnouncementSerializer!
        Don't create duplicate serializers!
        """
        latest_announcement = instance.get('latest_announcement')
        
        if not latest_announcement:
            return None
        
        # REUSE existing serializer from notifications app!
        return AnnouncementSerializer(latest_announcement).data
    
    def get_top_members(self, instance):
        """
        Serialize top members list.
        Returns empty array if no members.
        """
        top_members = instance.get('top_members')
        
        if not top_members:
            return []
        
        # return TopMemberSerializer(top_members, many=True).data
        return ClubMemberProfileSerializer(top_members, many=True).data
    
    def get_next_event(self, instance):
        """
        Serialize next event with its next session info.
        Returns None if no upcoming events.
        
        CRITICAL: Pass next_occurrence in context to EventLightSerializer!
        This avoids re-querying for participants count.
        """
        next_event = instance.get('next_event')
        
        if not next_event:
            return None
        
        # Pass next_occurrence in context so EventLightSerializer can use it!
        from leagues.serializers import LeagueSerializer
        serializer = LeagueSerializer(next_event)
        
        return serializer.data

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

class ClubMemberProfileSerializer(serializers.Serializer):
    """
    Wrapper serializer to convert ClubMembership → User data.
    
    PROBLEM: 
    - Views return ClubMembership QuerySets (has .member FK to User)
    - Frontend needs User data (not ClubMembership data)
    
    SOLUTION:
    - Accept ClubMembership objects as input
    - Extract the .member (User) from each
    - Serialize with UserDetailSerializer
    - Return User data to frontend
    
    USAGE:
    top_members = ClubMembership.objects.filter(...)
    TopMemberSerializer(top_members, many=True).data
    
    RETURNS:
    Array of UserDetail objects (see UserDetailSerializer)
    
    FUTURE:
    Can add ClubMembership-specific fields like:
    - joined_date (from ClubMembership.created_at)
    - membership_status (from ClubMembership.status)
    """
    
    def to_representation(self, instance):
        """
        Serialize the member (User) using CustomUserSerializer.
        Add computed fields that aren't in CustomUserSerializer.
        
        instance = ClubMembership object
        instance.member = User object
        """
        # Serialize the User with CustomUserSerializer
        user_data = UserDetailSerializer(instance.member).data
        
        # Add joined_date from ClubMembership
        # user_data['joined_date'] = instance.created_at.isoformat() if instance.created_at else None
        
        return user_data
@ts_interface()
class ClubMembershipSerializer(serializers.ModelSerializer):
    # This will now correctly use the CustomUserSerializer
    club = ClubDetailSerializer(read_only=True)
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

class UserClubMembershipSerializer(serializers.ModelSerializer):
    club_info = ClubInfoSerializer(source='club')
    roles = RoleSerializer(many=True, read_only=True)
    type = ClubMembershipTypeSerializer(read_only=True)
    levels = ClubMembershipSkillLevelSerializer(many=True, read_only=True)
    member_detail = UserDetailSerializer(source='member')

    class Meta:
        model = ClubMembership
        fields = ['id', 
                  'club_info',
                  'member_detail',
                  'type',
                  'roles',
                  'levels',
        ]

class AdminClubMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for ADMIN updating membership details.
    
    KEY FEATURES:
    - Admin can update ALL fields when updating THEIR OWN membership
    - Admin can update ALL fields EXCEPT is_preferred_club for OTHER members
    - ViewSet handles the ownership check (not serializer!)
    
    Use case:
    - Admin on /admin/members/[membershipId] page
    - Admin editing membership details
    - Frontend only needs that ONE membership
    
    FIELDS ADMIN CAN UPDATE:
    ✅ type (FK to ClubMembershipType) - Change membership type
    ✅ roles (ManyToMany to Role) - Assign/remove roles
    ✅ levels (ManyToMany to ClubMembershipSkillLevel) - Assign skill levels
    ✅ status (IntegerField) - Change membership status
    ✅ registration_start_date (DateField) - Override dates
    ✅ registration_end_date (DateField) - Override dates
    ✅ is_preferred_club (BooleanField) - ONLY on own membership! (ViewSet enforces)
    🔮 tags (ManyToMany to Tag) - Add/remove tags (FUTURE!)
    🔮 notes (TextField) - Admin notes (FUTURE!)
    
    CANNOT UPDATE:
    ❌ id - Primary key
    ❌ member - Can't reassign user
    ❌ club - Can't reassign club
    ❌ membership_number - System-generated
    ❌ created_at / updated_at - Timestamps
    
    PERMISSION LOGIC:
    - Handled in ViewSet.partial_update(), NOT in serializer!
    - Serializer is "dumb" - just defines fields
    - ViewSet is "smart" - checks ownership and blocks is_preferred_club for others
    """
    # Nested read-only fields for display
    club_info = ClubInfoSerializer(source='club', read_only=True)
    member_detail = UserDetailSerializer(source='member', read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    type = ClubMembershipTypeSerializer(read_only=True)
    levels = ClubMembershipSkillLevelSerializer(many=True, read_only=True)
    # tags = TagSerializer(many=True, read_only=True)  # TODO: Uncomment when Tag model exists

    # Write-only fields for updates
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=ClubMembershipType.objects.all(),
        source='type',
        write_only=True,
        required=False
    )
    role_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Role.objects.all(),
        source='roles',
        write_only=True,
        required=False
    )
    level_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ClubMembershipSkillLevel.objects.all(),
        source='levels',
        write_only=True,
        required=False
    )
    # tag_ids = serializers.PrimaryKeyRelatedField(
    #     many=True,
    #     queryset=Tag.objects.all(),
    #     source='tags',
    #     write_only=True,
    #     required=False
    # )  # TODO: Uncomment when Tag model exists

    class Meta:
        model = ClubMembership
        fields = [
            # Read-only nested objects
            'id',
            'club_info',
            'member_detail',
            'type',                      # FK to ClubMembershipType - Admin can change
            'roles',                     # ManyToMany to Role - Admin can assign roles
            'levels',                    # ManyToMany to ClubMembershipSkillLevel - Admin can assign levels
            #'tags',                     # ManyToMany to Tag - Admin can add tags

            # Admin-editable fields
            'is_preferred_club',
            'status',                    # IntegerField - Admin can change status
            'registration_start_date',   # DateField - Admin can override
            'registration_end_date',     # DateField - Admin can override
            'membership_number',
            # 'notes',                   # TODO: Add this field to ClubMembership model

            # Write-only IDs for updates
            'type_id',
            'role_ids',
            'level_ids',
            # 'tag_ids', # TODO: Add when field exists
        ]
        read_only_fields = [
            'id',
            'member_detail',   # Nested object - Can't reassign user
            'club_info',     # Nested object - Can't reassign club
            'roles',         # Nested object (use role_ids to write)
            'type',          # Nested object (use type_id to write)
            'levels',        # Nested object (use level_ids to write)
            # 'tags',        # Nested object (use tag_ids to write)
        ]
    
    def update(self, instance, validated_data):
        """
        Standard update - just updates the fields and returns the instance.
        
        Handles ManyToMany fields (roles, levels, tags) properly.
        """
        # Extract ManyToMany fields
        roles = validated_data.pop('roles', None)
        levels = validated_data.pop('levels', None)
        # tags = validated_data.pop('tags', None)
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update ManyToMany fields
        if roles is not None:
            instance.roles.set(roles)
        if levels is not None:
            instance.levels.set(levels)
        # if tags is not None:
        #     instance.tags.set(tags)
        
        return instance
    
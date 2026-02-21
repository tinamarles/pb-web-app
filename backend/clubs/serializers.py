# pickleball/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, Role, ClubMembershipType, ClubMembershipSkillLevel
from public.serializers import AddressSerializer
from public.constants import MembershipStatus   
from users.serializers import CustomUserSerializer, UserInfoSerializer
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

class ClubInfoSerializer(serializers.Serializer):
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
    id = serializers.IntegerField()
    name = serializers.CharField()
    logo_url = serializers.CharField()

class NestedClubSerializer(serializers.ModelSerializer):
    '''
    A lightweight serializer for Club details without having all the 
    member-id's  

    USED FOR:
    - GET /api/clubs/{id}/ (layout.tsx - basic club data)
    - Nested inside ClubMembership
    
    TypeScript: MemberClub
    '''
    address = AddressSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()  # ✅ NEW!

    class Meta:
        model = Club
        fields = [
            'id',
            'club_type',
            'name',
            'short_name',
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

class ClubSerializer(NestedClubSerializer):
    '''
    Full serializer for the Club model (admin/create/update only).
    Inherits all the fields and methods from NestedClubSerializer
    
    USED FOR:
    - POST /api/clubs/ (create)
    - PATCH /api/clubs/{id}/ (update)
    
    TypeScript: Club
    '''
    class Meta(NestedClubSerializer.Meta):
        fields = NestedClubSerializer.Meta.fields + [
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
# CLUB MEMBER SERIALIZER (for members tab)
# ========================================

class ClubMemberSerializer(serializers.Serializer):
    """
    Serializer for ClubMember data (combines User + ClubMembership).
    
    USED FOR:
    - GET /api/clubs/{id}/members/ (members tab)
    - GET /api/clubs/{id}/home/ (top members in home tab)
    Extends TopMemberSerializer (User + full_name + joined_date).
    Adds additional ClubMembership fields.
    
    REUSES:
    - CustomUserSerializer (all user fields)
    - full_name computation
    - joined_date (from TopMemberSerializer)
    
    ADDS:
    - membership_id
    - roles
    - levels
    - type
    - status
    - is_preferred_club
    
    TypeScript: DjangoClubMember
    """
    def to_representation(self, instance):
        """
        Start with TopMemberSerializer, add more ClubMembership fields.
        
        instance = ClubMembership object
        """
        # Get all fields from TopMemberSerializer
        # (User fields + full_name + joined_date)
        data = TopMemberSerializer(instance).data
        
        # Add additional ClubMembership fields
        data['membership_id'] = instance.id
        data['club_info'] = ClubInfoSerializer(instance.club).data
        data['roles'] = RoleSerializer(instance.roles.all(), many=True).data
        data['levels'] = ClubMembershipSkillLevelSerializer(instance.levels.all(), many=True).data
        data['type'] = instance.type_id
        data['status'] = instance.status
        data['is_preferred_club'] = instance.is_preferred_club
        
        # Note: created_at is already in data as 'joined_date' from TopMemberSerializer
        
        return data

# ========================================
# HOME TAB SERIALIZER
# ========================================

class TopMemberSerializer(serializers.Serializer):
    """
    Serializer for top members list.
    
    Data comes from ClubMembership objects.
    We extract the User (member) and add joined_date from membership.
    
    STRATEGY:
    - Use to_representation to serialize the User with CustomUserSerializer
    - Add full_name (computed field) to the output
    - Add joined_date from ClubMembership
    - Frontend gets all User fields + computed fields!

    NOTE: this serializer is reused for the ClubMemberSerializer
    """
    
    def to_representation(self, instance):
        """
        Serialize the member (User) using CustomUserSerializer.
        Add computed fields that aren't in CustomUserSerializer.
        
        instance = ClubMembership object
        instance.member = User object
        """
        # Serialize the User with CustomUserSerializer
        user_data = CustomUserSerializer(instance.member).data
        
        # Add joined_date from ClubMembership
        user_data['joined_date'] = instance.created_at.isoformat() if instance.created_at else None
        
        return user_data

class EventLightSerializer(CaptainInfoMixin, serializers.ModelSerializer):
    """
    Lightweight event serializer for Home Tab.
    
    Includes next session info and participants count.
    NOTE: this serializer is reused in leagues.LeagueSerializer
    
    CRITICAL: 
    - View already filters is_event=True, so this ONLY receives events!
    - Use next_occurrence from context for participants count (avoid re-query!)
    - Count LeagueAttendance for next session
    
    Returns snake_case (frontend converts to camelCase in actions.ts)
    """
    
    club = serializers.SerializerMethodField()
    minimum_skill_level = serializers.IntegerField(
                  source='minimum_skill_level.level',
                  allow_null=True,
                  read_only=True
            )
    # Next session info (from next_occurrence object passed in context!)
    next_session_date = serializers.SerializerMethodField()
    next_session_start_time = serializers.SerializerMethodField()
    next_session_end_time = serializers.SerializerMethodField()
    next_session_location = serializers.SerializerMethodField()
    next_session_registration_open = serializers.SerializerMethodField()
    
    # Participants info
    participants_count = serializers.SerializerMethodField()
    
    # Captain info -> uses CaptainInfoMixin now
    captain_info = serializers.SerializerMethodField()
    
    class Meta:
        model = League
        fields = [
            'id',
            'club',
            'name',
            'description',
            'is_event',
            'max_participants',
            'allow_reserves',
            'image_url',
            'registration_opens_hours_before',
            'registration_closes_hours_before',
            'registration_open',
            'league_type',
            'minimum_skill_level',
            'next_session_date',
            'next_session_start_time',
            'next_session_end_time',
            'next_session_location',
            'next_session_registration_open',
            'participants_count',
            'captain_info',
        ]
    
    def get_club(self, obj):
        """Return minimal club data (id, name)"""
        return {
            'id': obj.club.id,
            'name': obj.club.name,
        }
    
    
    # ========================================
    # NEXT SESSION INFO
    # ========================================
    def get_next_session_date(self, obj):
        """
        Get next session date from SessionOccurrence passed in context.
        View already fetched this - reuse it!
        """
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.session_date.isoformat()
        return None
    
    def get_next_session_start_time(self, obj):
        """Get next session start time (format: HH:MM)"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.start_datetime.strftime('%H:%M')
        return None
    
    def get_next_session_end_time(self, obj):
        """Get next session end time (format: HH:MM)"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.end_datetime.strftime('%H:%M')
        return None
    
    def get_next_session_location(self, obj):
        """Get next session location name"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence and next_occurrence.league_session.court_location:
            return next_occurrence.league_session.court_location.name
        return None
    
    def get_next_session_registration_open(self, obj):
        """Get next session registration_open flag"""
        next_occurrence = self.context.get('next_occurrence')
        if next_occurrence:
            return next_occurrence.registration_open
        return None
    
    # ========================================
    # PARTICIPANTS COUNT
    # ========================================
    def get_participants_count(self, obj):
        """
        Count participants for next session.
        
        Uses SessionOccurrence.current_participants_count property!
        This avoids re-querying - the property handles it efficiently.
        """
        next_occurrence = self.context.get('next_occurrence')
        
        if not next_occurrence:
            return 0
        
        # Use the SessionOccurrence's @property!
        return next_occurrence.current_participants_count

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
    club = serializers.SerializerMethodField()
    latest_announcement = serializers.SerializerMethodField()
    top_members = serializers.SerializerMethodField()
    next_event = serializers.SerializerMethodField()
    
    def get_club(self, instance):
        """Return minimal club data (id, name)"""
        club = instance.get('club')
        return {
            'id': club.id,
            'name': club.name,
        }
    
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
        
        return TopMemberSerializer(top_members, many=True).data
    
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
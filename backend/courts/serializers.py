from rest_framework import serializers
from .models import CourtLocation, UserCourtBooking
from public.serializers import AddressSerializer
from users.serializers import UserInfoSerializer
from django.contrib.auth import get_user_model

class CourtLocationInfoSerializer(serializers.ModelSerializer):
    """
    Reusable minimal CourtLocation data serializer.
    
    ✅ USE THIS instead of duplicating get_club_info()!
    
    Matches frontend TypeScript type:
    interface CourtLocationInfo {
      // TODO
    }

    Usage:
    class MySerializer(serializers.ModelSerializer):
        court_location_info = CourtLocationInfoSerializer(source='club')
    """
    address = AddressSerializer(read_only=True)

    class Meta:
        model = CourtLocation
        fields = [
            'id',
            'name',
            'address',
        ]

class CourtLocationSerializer(CourtLocationInfoSerializer):
    """
    Serializer for CourtLocation model.
    Used when displaying court info in bookings or league sessions.
    """
    class Meta(CourtLocationInfoSerializer.Meta):
        # ✅ Extend parent fields with additional league fields
        fields = CourtLocationInfoSerializer.Meta.fields + [
            'number_of_courts',
            'booking_website',
            'description',
            'photo',
        ]

class UserCourtBookingSerializer(serializers.ModelSerializer):
    """
    Serializer for UserCourtBooking model.
    
    Used for:
    - User activities endpoint (/api/user/activities/)
    - Court bookings CRUD endpoints (future)
    
    Fields:
    - user: Organizer info (nested UserInfoSerializer)
    - court_location: Court details (nested CourtLocationSerializer)
    - with_players: Invited players (nested UserInfoSerializer)
    - booking_type: Integer choice (1=Practice, 2=Match, 3=Lesson, etc.)
    
    IMPORTANT:
    - User sees bookings they organized (user=current_user)
    - User sees bookings they're invited to (with_players__contains=current_user)
    - Frontend should indicate if user is organizer vs invited player
    """
    captain_info = serializers.SerializerMethodField()
    # captain_info = UserInfoSerializer(read_only=True)  # Organizer
    court_info = serializers.SerializerMethodField()
    with_players = UserInfoSerializer(many=True, read_only=True)  # Invited players
    date = serializers.DateField(source='booking_date')

    class Meta:
        model = UserCourtBooking
        fields = [
            'id',
            'date',
            'start_time',
            'end_time',
            'captain_info',  # Organizer -> UserInfoSerializer
            'court_info', # -> CourtLocationInfoSerializer 
            'court_number',
            'booking_type',  # Integer choice field
            'with_players',  # List of invited users
            'external_booking_reference',
            'booking_fee',
            'notes',
            'send_reminder',
            'reminder_minutes_before',
        ]
        read_only_fields = ['id']

    def get_captain_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        from users.serializers import UserInfoSerializer
        return UserInfoSerializer(obj.user).data
    
    def get_court_info(self, obj):
        """Return minimal club data using ClubInfoSerializer"""
        return CourtLocationInfoSerializer(obj.court_location).data
    
    def to_representation(self, instance):
        """
        Customize output representation.
        
        Could add computed fields here like:
        - duration_minutes
        - is_upcoming (bool)
        - user_role ('organizer' | 'invited')
        """
        data = super().to_representation(instance)
        
        # Optional: Add computed fields
        # (Uncomment if needed for frontend)
        
        # from datetime import datetime
        # start = datetime.combine(instance.booking_date, instance.start_time)
        # end = datetime.combine(instance.booking_date, instance.end_time)
        # data['duration_minutes'] = int((end - start).total_seconds() / 60)
        
        return data

class UserCourtBookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for CREATING court bookings.
    
    Differences from read serializer:
    - court_location is integer (ID) not nested object
    - with_players is list of IDs not nested objects
    - user is set automatically from request.user
    
    Usage in view:
    ```python
    serializer = UserCourtBookingCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
    ```
    """
    court_location = serializers.PrimaryKeyRelatedField(
        queryset=CourtLocation.objects.all()
    )
    with_players = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=get_user_model().objects.all(),
        required=False
    )
    
    class Meta:
        model = UserCourtBooking
        fields = [
            'court_location',  # ID
            'court_number',
            'booking_date',
            'start_time',
            'end_time',
            'booking_type',
            'with_players',  # List of user IDs
            'external_booking_reference',
            'notes',
            'send_reminder',
            'reminder_minutes_before',
        ]
    
    def validate(self, attrs):
        """
        Validate booking data.
        """
        # Ensure end_time is after start_time
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time'
            })
        
        # Optional: Add more validations
        # - Check if court is available (if you track availability)
        # - Check if booking_date is not in the past
        # - Validate reminder_minutes_before if send_reminder is True
        
        return attrs


# ==========================================
# FUTURE: Court Availability (TBD)
# ==========================================

# class CourtAvailabilitySerializer(serializers.Serializer):
#     """
#     For checking court availability (future feature).
#     
#     Input:
#     - court_location_id
#     - date
#     - start_time
#     - end_time
#     
#     Output:
#     - available: bool
#     - conflicting_bookings: List of bookings during that time
#     """
#     pass
from rest_framework import serializers # only needed for any additional serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password

# Get the current active user model
User = get_user_model()

class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Serializer that validates a user and returns a JWT token pair.
    Allows authentication with either a username or an email address.
    """
    identifier = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'} 
    )

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            username=attrs['identifier'],
            password=attrs['password']
        )
        
        if not user or not user.is_active:
            raise serializers.ValidationError('No active account found with the given credentials')

        # Generate the refresh and access tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Add custom claims to the access token
        access['username'] = user.username
        access['email'] = user.email

        # Determine user_role based on logic
        if user.club_memberships.exists():
            user_role_value = 'member'
        else:
            user_role_value = 'public'

        # Add the user_role claim directly to the access token payload
        access['user_role'] = user_role_value # <--- Add this line!
        
        # Prepare the response data
        data = {
            'refresh': str(refresh),
            'access': str(access)
        }

        data['user_role'] = user_role_value
       
        data['detail'] = "Authentication successful."
        
        return data
    
class CustomUserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    
    class Meta:
        model = User
        fields = ('username', 
                  'email', 
                  'first_name', 
                  'last_name',
                  'skill_level',
                  'profile_picture_url',
                  'is_coach',
                  'home_phone',
                  'mobile_phone',
                  'work_phone',
                  'location',
                  'dob',
                  'gender',
                  'bio',
                )
        read_only_fields = ('username', )

class CustomUserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        # This function will run Django's default password validators
        # and raise a ValidationError if the password doesn't meet the rules.
        validate_password(value) # This is Django's password validator
        return value
    
    def create(self, validated_data):
        # Calling Django's create_user method which does the following:
        # 1. Create a new user instance without a password
        # user = self.model(username=username, email=email, **extra_fields)
        # 
        # 2. Call the set_password() method to hash the password
        # user.set_password(password)
        #
        # 3. Save the new user record to the database
        # user.save(using=self.db)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        return user
    
# The CustomUserSerializer will also be used for a Public User with no
# Club memberships
class CustomUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    full_name = serializers.ReadOnlyField(source='get_full_name')
    
    class Meta:
        # Use the variable User which holds the active user model
        model = User
        fields = ['id', 
                  'first_name', 
                  'last_name', 
                  'full_name',
                  'username',
                  'profile_picture_url',
                  'email', 
                  'skill_level',
                  'is_coach',
                  'home_phone',
                  'mobile_phone',
                  'work_phone',
                  'location',
                  'dob',
                  'gender',
                  'bio',
                  'created_at',
                  'updated_at'
                  ]
        read_only_fields = ['email']

# Lightweight User Info Serializer: 
# will be used where ever basic user information is required
# - BaseFeedItemSerializer

class UserInfoSerializer(serializers.ModelSerializer):
    """Lightweight serializer for person info (used in creator_info, etc.)"""
    full_name = serializers.ReadOnlyField(source='get_full_name')
    
    class Meta:
        model = User
        fields = ['id', 
                  'first_name', 
                  'last_name', 
                  'full_name', 
                  'username',
                  'profile_picture_url']



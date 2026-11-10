from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomerProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'is_senior', 'preferred_language',
            'address', 'latitude', 'longitude', 'avatar',
            'is_suspended', 'is_email_verified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

UserProfileSerializer = UserSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    location = serializers.CharField(required=False, allow_blank=True, write_only=True)
    languages = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'phone', 'is_senior', 'preferred_language',
            'address', 'latitude', 'longitude', 'location', 'languages'
        ]

    def create(self, validated_data):
        location = validated_data.pop('location', '')
        languages = validated_data.pop('languages', ['en'])
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        user.set_password(password)
        user.is_email_verified = True
        user.save()

        if user.role == User.Role.CUSTOMER:
            CustomerProfile.objects.create(
                user=user,
                location=location or user.address or '',
                latitude=user.latitude,
                longitude=user.longitude,
                languages=languages
            )
        elif user.role == User.Role.PROVIDER:
            from marketplace.models import ProviderProfile
            ProviderProfile.objects.create(
                user=user,
                bio='Elder Artisan & Provider',
                location=location or user.address or 'Chennai, TN',
                latitude=user.latitude,
                longitude=user.longitude,
                languages=languages,
                skills=['Traditional Craft']
            )
        return user

UserRegistrationSerializer = RegisterSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        data['token'] = data['access']
        return data

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ['id', 'user', 'bio', 'location', 'latitude', 'longitude', 'languages', 'preferences', 'created_at']

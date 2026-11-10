from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Category, ProviderProfile, Service, Product, haversine_km

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_location = serializers.CharField(source='provider.location', read_only=True)
    provider_rating = serializers.DecimalField(source='provider.rating', max_digits=3, decimal_places=2, read_only=True)
    provider_trust_score = serializers.IntegerField(source='provider.trust_score', read_only=True)
    provider_user_id = serializers.IntegerField(source='provider.user.id', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'provider_name', 'provider_location', 'provider_rating',
            'provider_trust_score', 'provider_user_id', 'category', 'category_name',
            'category_slug', 'title', 'description', 'price', 'pricing_unit',
            'duration', 'image_url', 'languages', 'is_available', 'rating',
            'review_count', 'created_at'
        ]
        read_only_fields = ['id', 'provider', 'rating', 'review_count', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_location = serializers.CharField(source='provider.location', read_only=True)
    provider_rating = serializers.DecimalField(source='provider.rating', max_digits=3, decimal_places=2, read_only=True)
    provider_user_id = serializers.IntegerField(source='provider.user.id', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'provider', 'provider_name', 'provider_location', 'provider_rating',
            'provider_user_id', 'category', 'category_name', 'category_slug', 'title',
            'description', 'price', 'quantity', 'image_url', 'is_available', 'rating',
            'review_count', 'created_at'
        ]
        read_only_fields = ['id', 'provider', 'rating', 'review_count', 'created_at']

class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user', 'display_name', 'bio', 'skills', 'experience_years',
            'languages', 'location', 'latitude', 'longitude', 'availability',
            'rating', 'review_count', 'completed_jobs_count', 'is_verified',
            'trust_score', 'skill_passport', 'skill_passport_id', 'services',
            'products', 'distance_km', 'created_at'
        ]

    def get_distance_km(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if lat and lng and obj.latitude and obj.longitude:
            return haversine_km(lat, lng, obj.latitude, obj.longitude)
        return None

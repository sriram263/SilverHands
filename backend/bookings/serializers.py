from rest_framework import serializers
from .models import Booking, Order
from marketplace.serializers import ServiceSerializer, ProductSerializer
from accounts.serializers import UserSerializer

class BookingSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    service_price = serializers.DecimalField(source='service.price', max_digits=10, decimal_places=2, read_only=True)
    service_image = serializers.CharField(source='service.image_url', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_phone = serializers.CharField(source='provider.user.phone', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'service',
            'service_title', 'service_price', 'service_image', 'provider',
            'provider_name', 'provider_phone', 'preferred_date', 'preferred_time',
            'message', 'location', 'status', 'total_price', 'is_scam_flagged',
            'scam_score', 'scam_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'provider', 'total_price', 'is_scam_flagged', 'scam_score', 'scam_reason', 'created_at', 'updated_at']

class OrderSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.CharField(source='product.image_url', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'product',
            'product_title', 'product_image', 'provider', 'provider_name',
            'quantity', 'unit_price', 'total_price', 'status', 'message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'provider', 'unit_price', 'total_price', 'created_at', 'updated_at']

from rest_framework import serializers
from .models import Review
from marketplace.models import ProviderProfile, Service, Product

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    provider = serializers.PrimaryKeyRelatedField(queryset=ProviderProfile.objects.all(), required=False)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), required=False, allow_null=True)
    service_title = serializers.CharField(source='service.title', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False, allow_null=True)
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'provider',
            'provider_name', 'service', 'service_title', 'product', 'product_title',
            'booking', 'order', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'customer', 'created_at']

    def validate(self, attrs):
        # Auto-fill provider from product or service if not supplied
        if not attrs.get('provider'):
            if attrs.get('product'):
                attrs['provider'] = attrs['product'].provider
            elif attrs.get('service'):
                attrs['provider'] = attrs['service'].provider
            elif attrs.get('booking'):
                attrs['provider'] = attrs['booking'].provider
                attrs['service'] = attrs['booking'].service
            elif attrs.get('order'):
                attrs['provider'] = attrs['order'].provider
                attrs['product'] = attrs['order'].product
            else:
                raise serializers.ValidationError({"provider": "Provider or target item is required."})
        return attrs



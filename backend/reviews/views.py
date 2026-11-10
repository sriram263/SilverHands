from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
from marketplace.models import ProviderProfile, Service, Product

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.all().select_related('customer', 'provider', 'service', 'product')
        provider_id = self.request.query_params.get('provider')
        service_id = self.request.query_params.get('service')
        product_id = self.request.query_params.get('product')
        customer_id = self.request.query_params.get('customer')
        booking_id = self.request.query_params.get('booking')
        order_id = self.request.query_params.get('order')

        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        if service_id:
            qs = qs.filter(service_id=service_id)
        if product_id:
            qs = qs.filter(product_id=product_id)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if booking_id:
            qs = qs.filter(booking_id=booking_id)
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs

    def perform_create(self, serializer):
        kwargs = {'customer': self.request.user}
        
        # Auto-resolve provider if not explicitly sent
        data = self.request.data
        if 'product' in data and not data.get('provider'):
            try:
                prod = Product.objects.get(pk=data['product'])
                kwargs['provider'] = prod.provider
            except Exception:
                pass
        elif 'service' in data and not data.get('provider'):
            try:
                srv = Service.objects.get(pk=data['service'])
                kwargs['provider'] = srv.provider
            except Exception:
                pass

        serializer.save(**kwargs)

class ProviderReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        provider_id = self.kwargs.get('provider_id')
        return Review.objects.filter(provider_id=provider_id).select_related('customer', 'provider', 'service', 'product')

class ProductReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return Review.objects.filter(product_id=product_id).select_related('customer', 'provider', 'service', 'product')

class ServiceReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        service_id = self.kwargs.get('service_id')
        return Review.objects.filter(service_id=service_id).select_related('customer', 'provider', 'service', 'product')


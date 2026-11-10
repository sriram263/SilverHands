from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.db import transaction
from .models import Booking, Order
from .serializers import BookingSerializer, OrderSerializer
from marketplace.models import Product
from ai_engine.services.scam_detection import detect_scam_message

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return Booking.objects.all().order_by('-created_at')

        view_mode = self.request.query_params.get('view')
        if view_mode == 'my_requests':
            return Booking.objects.filter(customer=user).order_by('-created_at')
        elif view_mode == 'incoming':
            return Booking.objects.filter(service__provider__user=user).order_by('-created_at')

        return Booking.objects.filter(
            Q(customer=user) | Q(service__provider__user=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        msg = self.request.data.get('message', '')
        is_scam = False
        scam_score = 0
        scam_reason = ''
        if msg:
            scam_res = detect_scam_message(msg)
            is_scam = scam_res.get('is_scam', False) or scam_res.get('risk_level') == 'HIGH'
            scam_score = scam_res.get('risk_score', 0)
            scam_reason = scam_res.get('explanation', '')

        service = serializer.validated_data['service']
        provider = service.provider
        total_price = service.price

        serializer.save(
            customer=self.request.user,
            provider=provider,
            total_price=total_price,
            is_scam_flagged=is_scam,
            scam_score=scam_score,
            scam_reason=scam_reason
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            booking.status = new_status
            booking.save()
            return Response(BookingSerializer(booking).data)
        return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'COMPLETED':
            return Response({'error': 'Cannot cancel an already completed booking'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'CANCELLED'
        booking.save()
        return Response({
            'message': 'Service booking cancelled successfully',
            'booking': BookingSerializer(booking).data
        })

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return Order.objects.all().order_by('-created_at')

        view_mode = self.request.query_params.get('view')
        if view_mode == 'my_purchases':
            return Order.objects.filter(customer=user).order_by('-created_at')
        elif view_mode == 'incoming':
            return Order.objects.filter(product__provider__user=user).order_by('-created_at')

        return Order.objects.filter(
            Q(customer=user) | Q(product__provider__user=user)
        ).order_by('-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)

        # 1. Lock and validate stock availability
        product = Product.objects.select_for_update().get(id=product.id)
        if not product.is_available or product.quantity <= 0:
            raise serializers.ValidationError({"error": f"Sorry, '{product.title}' is currently sold out."})

        if product.quantity < quantity:
            raise serializers.ValidationError({"error": f"Only {product.quantity} items remaining in stock for '{product.title}'."})

        # 2. Deduct inventory and update availability if exhausted
        product.quantity -= quantity
        if product.quantity == 0:
            product.is_available = False
        product.save()

        # 3. Save order record
        provider = product.provider
        unit_price = product.price
        total_price = unit_price * quantity

        serializer.save(
            customer=self.request.user,
            provider=provider,
            unit_price=unit_price,
            total_price=total_price
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            # If transitioning to CANCELLED, restock inventory!
            if new_status == 'CANCELLED' and order.status != 'CANCELLED':
                prod = Product.objects.select_for_update().get(id=order.product.id)
                prod.quantity += order.quantity
                prod.is_available = True
                prod.save()

            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    @transaction.atomic
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status in ['DELIVERED', 'COMPLETED']:
            return Response({'error': 'Cannot cancel an already delivered or completed order'}, status=status.HTTP_400_BAD_REQUEST)

        if order.status != 'CANCELLED':
            # Restock inventory
            prod = Product.objects.select_for_update().get(id=order.product.id)
            prod.quantity += order.quantity
            prod.is_available = True
            prod.save()

            order.status = 'CANCELLED'
            order.save()

        return Response({
            'message': 'Order cancelled and product stock returned to marketplace inventory.',
            'order': OrderSerializer(order).data
        })

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum

from .models import Opportunity, OpportunityResponse, Notification, Report
from .serializers import (
    OpportunitySerializer,
    OpportunityResponseSerializer,
    NotificationSerializer,
    ReportSerializer
)
from marketplace.models import ProviderProfile, Service, Product, haversine_km
from marketplace.serializers import ServiceSerializer, ProductSerializer
from bookings.models import Booking, Order
from bookings.serializers import BookingSerializer, OrderSerializer

User = get_user_model()

class IsAdminUserOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respond(self, request, pk=None):
        opp = self.get_object()
        resp = OpportunityResponse.objects.create(
            opportunity=opp,
            provider=request.user,
            message=request.data.get('message', 'I am interested in this request!'),
            proposed_price=request.data.get('proposed_price')
        )
        return Response(OpportunityResponseSerializer(resp).data, status=status.HTTP_201_CREATED)

class RadarFeedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = float(request.query_params.get('lat', 13.0827))
        lng = float(request.query_params.get('lng', 80.2707))
        radius = float(request.query_params.get('radius', 15.0))

        opps = Opportunity.objects.filter(is_active=True).order_by('-created_at')
        radar_results = []
        for opp in opps:
            dist = haversine_km(lat, lng, opp.latitude, opp.longitude)
            if dist <= radius:
                data = OpportunitySerializer(opp).data
                data['distance_km'] = dist
                data['match_score'] = 92
                data['match_reasons'] = [f"{dist} km from your area", "Matches verified elder skills", "Direct gig request"]
                radar_results.append(data)

        return Response({'opportunities': radar_results, 'center': {'lat': lat, 'lng': lng}})

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked_read'})

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN' or self.request.user.is_staff:
            return Report.objects.all().order_by('-created_at')
        return Report.objects.filter(reporter=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class AdminStatsView(APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        return Response({
            'total_users': User.objects.count(),
            'total_customers': User.objects.filter(role=User.Role.CUSTOMER).count(),
            'total_providers': User.objects.filter(role=User.Role.PROVIDER).count(),
            'total_services': Service.objects.count(),
            'total_products': Product.objects.count(),
            'total_bookings': Booking.objects.count(),
            'total_orders': Order.objects.count(),
            'pending_reports': Report.objects.filter(status='PENDING').count(),
            'active_opportunities': Opportunity.objects.filter(is_active=True).count(),
        })

class AdminDataOverviewView(APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        bookings = Booking.objects.all().order_by('-created_at')[:50]
        orders = Order.objects.all().order_by('-created_at')[:50]
        services = Service.objects.all().order_by('-created_at')[:50]
        products = Product.objects.all().order_by('-created_at')[:50]
        reports = Report.objects.all().order_by('-created_at')[:50]

        return Response({
            'bookings': BookingSerializer(bookings, many=True).data,
            'orders': OrderSerializer(orders, many=True).data,
            'services': ServiceSerializer(services, many=True).data,
            'products': ProductSerializer(products, many=True).data,
            'reports': ReportSerializer(reports, many=True).data,
        })

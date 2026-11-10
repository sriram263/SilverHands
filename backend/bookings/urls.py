from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, OrderViewSet

router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='booking')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]

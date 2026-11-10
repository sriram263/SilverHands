from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OpportunityViewSet,
    RadarFeedView,
    NotificationViewSet,
    ReportViewSet,
    AdminStatsView,
    AdminDataOverviewView
)

router = DefaultRouter()
router.register('opportunities', OpportunityViewSet, basename='opportunity')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('reports', ReportViewSet, basename='report')

urlpatterns = [
    path('radar/', RadarFeedView.as_view(), name='radar_feed'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/data-overview/', AdminDataOverviewView.as_view(), name='admin_data_overview'),
    path('', include(router.urls)),
]

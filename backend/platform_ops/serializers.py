from rest_framework import serializers
from .models import Opportunity, OpportunityResponse, Notification, Report
from accounts.serializers import UserSerializer

class OpportunitySerializer(serializers.ModelSerializer):
    match_score = serializers.IntegerField(required=False, read_only=True)
    distance_km = serializers.FloatField(required=False, read_only=True)
    match_reasons = serializers.ListField(child=serializers.CharField(), required=False, read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            'id', 'title', 'category', 'description', 'budget', 'customer_name',
            'customer_user', 'location_name', 'latitude', 'longitude', 'is_active',
            'match_score', 'distance_km', 'match_reasons', 'created_at'
        ]

class OpportunityResponseSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)

    class Meta:
        model = OpportunityResponse
        fields = ['id', 'opportunity', 'provider', 'provider_name', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'provider', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class ReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    reported_username = serializers.CharField(source='reported_user.username', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_name', 'reported_user', 'reported_username',
            'reported_service', 'category', 'description', 'status', 'admin_notes', 'created_at'
        ]
        read_only_fields = ['id', 'reporter', 'created_at']

from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import UserSerializer
from marketplace.serializers import ProviderProfileSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_username', 'text', 'is_read', 'is_mine', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False

class ConversationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_id_val = serializers.IntegerField(source='provider.id', read_only=True)
    latest_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'provider',
            'provider_name', 'provider_id_val', 'latest_message', 'created_at', 'updated_at'
        ]

    def get_latest_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return MessageSerializer(msg, context=self.context).data
        return None

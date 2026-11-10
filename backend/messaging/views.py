from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from marketplace.models import ProviderProfile

class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if hasattr(user, 'provider_profile'):
            convs = Conversation.objects.filter(Q(customer=user) | Q(provider=user.provider_profile))
        else:
            convs = Conversation.objects.filter(customer=user)
        return Response(ConversationSerializer(convs, many=True, context={'request': request}).data)

    def post(self, request):
        provider_id = request.data.get('provider')
        if not provider_id:
            return Response({'error': 'Provider ID required'}, status=status.HTTP_400_BAD_REQUEST)
        provider = ProviderProfile.objects.get(id=provider_id)
        conv, _ = Conversation.objects.get_or_create(customer=request.user, provider=provider)
        return Response(ConversationSerializer(conv, context={'request': request}).data)

class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        conv = Conversation.objects.get(pk=pk)
        messages = conv.messages.all().order_by('created_at')
        return Response({
            'conversation': ConversationSerializer(conv, context={'request': request}).data,
            'messages': MessageSerializer(messages, many=True, context={'request': request}).data
        })

class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conv = Conversation.objects.get(pk=pk)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Message text cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            text=text
        )
        conv.save() # Updates updated_at
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

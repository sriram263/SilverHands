from django.conf import settings
from django.db import models
from marketplace.models import ProviderProfile

class Conversation(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_conversations')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='provider_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('customer', 'provider')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.customer.username} <-> {self.provider.display_name}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.text[:40]}"

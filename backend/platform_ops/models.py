from django.conf import settings
from django.db import models
from marketplace.models import Service

class Opportunity(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # Traditional Cooking, Tailoring, Gardening, Tutoring, Crafts
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    customer_name = models.CharField(max_length=100, default='Local Customer')
    customer_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    location_name = models.CharField(max_length=255, default='Chennai, TN')
    latitude = models.FloatField(default=13.0827)
    longitude = models.FloatField(default=80.2707)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Opportunity: {self.title} (₹{self.budget})"

class OpportunityResponse(models.Model):
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='responses')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='opportunity_responses')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, default='RESPONDED') # RESPONDED, SAVED, DISMISSED
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class Notification(models.Model):
    TYPE_CHOICES = (
        ('booking', 'Booking Alert'),
        ('opportunity', 'Opportunity Radar Alert'),
        ('message', 'Message Alert'),
        ('safety', 'Scam & Safety Warning'),
        ('review', 'New Review'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='booking')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

class Report(models.Model):
    CATEGORY_CHOICES = (
        ('SUSPICIOUS_USER', 'Suspicious User Profile'),
        ('INAPPROPRIATE_LISTING', 'Inappropriate Service Listing'),
        ('UNSAFE_MESSAGE', 'Unsafe Payment / Scam Request'),
        ('ABUSIVE_BEHAVIOR', 'Abusive Behavior'),
        ('OTHER', 'Other Platform Concern'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('REVIEWING', 'Under Review'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    )
    
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='filed_reports')
    reported_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_against')
    reported_service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='SUSPICIOUS_USER')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} [{self.status}] - {self.category}"

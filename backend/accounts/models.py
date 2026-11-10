import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer / Buyer'
        PROVIDER = 'PROVIDER', 'Provider / Senior / Homemaker'
        ADMIN = 'ADMIN', 'Platform Administrator'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=25, blank=True, null=True)
    is_senior = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='en') # en, ta, hi
    address = models.TextField(blank=True, null=True)
    latitude = models.FloatField(default=13.0827) # Default Chennai lat
    longitude = models.FloatField(default=80.2707) # Default Chennai lon
    is_suspended = models.BooleanField(default=False)
    avatar = models.TextField(blank=True, null=True)
    
    # Email verification
    is_email_verified = models.BooleanField(default=True) # Defaults to true for hackathon ease
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_customer(self):
        return (self.role or '').upper() == self.Role.CUSTOMER

    @property
    def is_provider(self):
        return (self.role or '').upper() == self.Role.PROVIDER or (self.role or '').upper() == self.Role.ADMIN or self.is_staff

    @property
    def is_admin_user(self):
        return (self.role or '').upper() == self.Role.ADMIN or self.is_staff or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.role})"


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    bio = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    latitude = models.FloatField(default=13.0827)
    longitude = models.FloatField(default=80.2707)
    languages = models.JSONField(default=list, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Customer Profile: {self.user.get_full_name() or self.user.username}"

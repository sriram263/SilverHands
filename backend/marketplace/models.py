import math
from decimal import Decimal
from django.conf import settings
from django.db import models

def haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    try:
        lat1, lon1, lat2, lon2 = map(float, (lat1, lon1, lat2, lon2))
        r = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        return round(r * 2 * math.asin(math.sqrt(a)), 1)
    except Exception:
        return None

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, default='✨')
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class ProviderProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_profile')
    bio = models.TextField(blank=True, default='')
    skills = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=5)
    languages = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=255, blank=True, default='Chennai, TN')
    latitude = models.FloatField(default=13.0827)
    longitude = models.FloatField(default=80.2707)
    availability = models.JSONField(default=dict, blank=True)
    
    # SilverTrust & Verification
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'))
    review_count = models.PositiveIntegerField(default=0)
    completed_jobs_count = models.PositiveIntegerField(default=12)
    is_verified = models.BooleanField(default=True)
    trust_score = models.PositiveIntegerField(default=95)
    skill_passport = models.JSONField(default=dict, blank=True)
    skill_passport_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating', '-trust_score']

    def __str__(self):
        return self.display_name

    @property
    def display_name(self):
        return self.user.get_full_name() or self.user.username

class Service(models.Model):
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='services')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_unit = models.CharField(max_length=50, default='per service') # per hour, per service, per piece
    duration = models.CharField(max_length=50, blank=True, default='1-2 hours')
    image_url = models.TextField(blank=True, default='')
    languages = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'))
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.provider.display_name}"

class Product(models.Model):
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=10)
    image_url = models.TextField(blank=True, default='')
    is_available = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'))
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (₹{self.price})"

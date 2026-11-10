from decimal import Decimal
from django.conf import settings
from django.db import models
from marketplace.models import Service, Product, ProviderProfile

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        UPCOMING = 'UPCOMING', 'Upcoming'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='received_bookings')
    
    preferred_date = models.CharField(max_length=50, default='Tomorrow')
    preferred_time = models.CharField(max_length=50, default='10:00 AM')
    message = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Scam analysis
    is_scam_flagged = models.BooleanField(default=False)
    scam_score = models.IntegerField(default=0)
    scam_reason = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.total_price and self.service:
            self.total_price = self.service.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking #{self.id}: {self.service.title} by {self.customer.username}"

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_orders')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='received_orders')
    
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    message = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.unit_price and self.product:
            self.unit_price = self.product.price
        if not self.total_price:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id}: {self.product.title} x{self.quantity}"

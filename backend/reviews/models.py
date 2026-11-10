from decimal import Decimal
from django.conf import settings
from django.db import models
from django.db.models import Avg
from bookings.models import Booking, Order
from marketplace.models import ProviderProfile, Service, Product

class Review(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_reviews')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='reviews')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.service.title if self.service else (self.product.title if self.product else self.provider.display_name)
        return f"{self.rating}★ by {self.customer.username} for {target}"

    def save(self, *args, **kwargs):
        # Auto-populate provider if missing but service/product is provided
        if not self.provider_id:
            if self.service:
                self.provider = self.service.provider
            elif self.product:
                self.provider = self.product.provider
            elif self.booking:
                self.provider = self.booking.provider
                self.service = self.booking.service
            elif self.order:
                self.provider = self.order.provider
                self.product = self.order.product

        super().save(*args, **kwargs)
        self._update_ratings()

    def _update_ratings(self):
        # Update provider average rating
        if self.provider_id:
            count_p = Review.objects.filter(provider=self.provider).count()
            agg_p = Review.objects.filter(provider=self.provider).aggregate(avg=Avg('rating'))
            avg_p = agg_p['avg'] if count_p > 0 else 0.0
            ProviderProfile.objects.filter(pk=self.provider_id).update(
                rating=Decimal(str(round(avg_p, 2))),
                review_count=count_p
            )

        # Update service average rating
        if self.service_id:
            count_s = Review.objects.filter(service=self.service).count()
            agg_s = Review.objects.filter(service=self.service).aggregate(avg=Avg('rating'))
            avg_s = agg_s['avg'] if count_s > 0 else 0.0
            Service.objects.filter(pk=self.service_id).update(
                rating=Decimal(str(round(avg_s, 2))),
                review_count=count_s
            )

        # Update product average rating
        if self.product_id:
            count_pr = Review.objects.filter(product=self.product).count()
            agg_pr = Review.objects.filter(product=self.product).aggregate(avg=Avg('rating'))
            avg_pr = agg_pr['avg'] if count_pr > 0 else 0.0
            Product.objects.filter(pk=self.product_id).update(
                rating=Decimal(str(round(avg_pr, 2))),
                review_count=count_pr
            )

def recalculate_all_ratings():
    """Recalculates all real ratings from customer reviews for Services, Products, and Providers."""
    for s in Service.objects.all():
        count = Review.objects.filter(service=s).count()
        agg = Review.objects.filter(service=s).aggregate(avg=Avg('rating'))
        avg = agg['avg'] if count > 0 else 0.0
        Service.objects.filter(pk=s.id).update(rating=Decimal(str(round(avg, 2))), review_count=count)

    for p in Product.objects.all():
        count = Review.objects.filter(product=p).count()
        agg = Review.objects.filter(product=p).aggregate(avg=Avg('rating'))
        avg = agg['avg'] if count > 0 else 0.0
        Product.objects.filter(pk=p.id).update(rating=Decimal(str(round(avg, 2))), review_count=count)

    for prov in ProviderProfile.objects.all():
        count = Review.objects.filter(provider=prov).count()
        agg = Review.objects.filter(provider=prov).aggregate(avg=Avg('rating'))
        avg = agg['avg'] if count > 0 else 0.0
        ProviderProfile.objects.filter(pk=prov.id).update(rating=Decimal(str(round(avg, 2))), review_count=count)



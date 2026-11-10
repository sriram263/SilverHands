from django.urls import path
from .views import ReviewListCreateView, ProviderReviewsView, ProductReviewsView, ServiceReviewsView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsView.as_view(), name='provider-reviews'),
    path('products/<int:product_id>/reviews/', ProductReviewsView.as_view(), name='product-reviews'),
    path('services/<int:service_id>/reviews/', ServiceReviewsView.as_view(), name='service-reviews'),
]


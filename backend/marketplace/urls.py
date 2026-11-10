from django.urls import path
from .views import (
    CategoryListView, ProviderListView, ProviderDetailView, ProviderMeProfileView,
    ServiceListView, ServiceDetailView, ProductListView, ProductDetailView,
    UnifiedSearchView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('providers/me/', ProviderMeProfileView.as_view(), name='provider-me'),
    path('providers/', ProviderListView.as_view(), name='provider-list'),
    path('providers/<int:pk>/', ProviderDetailView.as_view(), name='provider-detail'),
    path('services/', ServiceListView.as_view(), name='service-list'),
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('search/', UnifiedSearchView.as_view(), name='unified-search'),
]

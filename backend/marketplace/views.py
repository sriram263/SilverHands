from rest_framework import generics, permissions, status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, ProviderProfile, Service, Product, haversine_km
from .serializers import (
    CategorySerializer, ProviderProfileSerializer, ServiceSerializer, ProductSerializer
)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

def calculate_profile_completion(profile):
    score = 0
    missing_items = []
    
    if profile.user.first_name or profile.user.last_name:
        score += 10
    else:
        missing_items.append("Add your full name (+10%)")
        
    if getattr(profile.user, 'phone', None):
        score += 10
    else:
        missing_items.append("Add your phone number (+10%)")
        
    if profile.location and len(profile.location) > 3:
        score += 15
    else:
        missing_items.append("Set your service location area (+15%)")
        
    if profile.experience_years > 0:
        score += 10
    else:
        missing_items.append("Add your experience years (+10%)")
        
    if profile.bio and len(profile.bio.strip()) > 10:
        score += 15
    else:
        missing_items.append("Write a brief bio about your craft (+15%)")
        
    if profile.skills and len(profile.skills) > 0:
        score += 10
    else:
        missing_items.append("Add or discover your skills with AI (+10%)")
        
    if profile.languages and len(profile.languages) > 0:
        score += 10
    else:
        missing_items.append("Add spoken languages (+10%)")
        
    if profile.availability and (profile.availability.get('days') or profile.availability.get('available_days')):
        score += 10
    else:
        missing_items.append("Set your weekly availability schedule (+10%)")
        
    if profile.services.filter(is_available=True).exists() or profile.products.filter(is_available=True).exists():
        score += 10
    else:
        missing_items.append("Publish at least one service or handmade product (+10%)")
        
    return min(100, score), missing_items


class ProviderMeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer = ProviderProfileSerializer(profile)
        data = serializer.data
        score, missing = calculate_profile_completion(profile)
        data['profile_completion_score'] = score
        data['missing_checklist'] = missing
        return Response(data)

    def patch(self, request):
        user = request.user
        profile, _ = ProviderProfile.objects.get_or_create(user=user)
        
        bio = request.data.get('bio')
        skills = request.data.get('skills')
        experience_years = request.data.get('experience_years')
        languages = request.data.get('languages')
        location = request.data.get('location')
        availability = request.data.get('availability')
        skill_passport = request.data.get('skill_passport')
        
        if bio is not None: profile.bio = bio
        if skills is not None: profile.skills = skills
        if experience_years is not None: profile.experience_years = int(experience_years)
        if languages is not None: profile.languages = languages
        if location is not None: profile.location = location
        if availability is not None: profile.availability = availability
        if skill_passport is not None: profile.skill_passport = skill_passport
        
        profile.save()
        
        serializer = ProviderProfileSerializer(profile)
        data = serializer.data
        score, missing = calculate_profile_completion(profile)
        data['profile_completion_score'] = score
        data['missing_checklist'] = missing
        return Response(data)


class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ProviderProfile.objects.select_related('user').prefetch_related('services', 'products')
        cat = self.request.query_params.get('category')
        skill = self.request.query_params.get('skill')
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        lang = self.request.query_params.get('language')
        verified = self.request.query_params.get('verified')

        if cat:
            qs = qs.filter(services__category__slug=cat).distinct()
        if skill:
            qs = qs.filter(Q(skills__icontains=skill) | Q(bio__icontains=skill) | Q(user__first_name__icontains=skill))
        if search:
            qs = qs.filter(
                Q(skills__icontains=search) |
                Q(bio__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(location__icontains=search)
            )
        if lang:
            qs = qs.filter(languages__icontains=lang)
        if verified == 'true':
            qs = qs.filter(is_verified=True)
        return qs

class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.select_related('user').prefetch_related('services', 'products')
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        score, missing = calculate_profile_completion(instance)
        data['profile_completion_score'] = score
        return Response(data)

class ServiceListView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            qs = Service.objects.select_related('provider__user', 'category').filter(
                Q(provider__id=provider_id) | Q(provider__user__id=provider_id)
            )
        else:
            qs = Service.objects.select_related('provider__user', 'category').filter(is_available=True)

        cat = self.request.query_params.get('category')
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        min_price = self.request.query_params.get('min_price') or self.request.query_params.get('minPrice')
        max_price = self.request.query_params.get('max_price') or self.request.query_params.get('maxPrice')

        if cat:
            qs = qs.filter(category__slug=cat)
        if search:
            search_str = search.strip()
            qs = qs.filter(
                Q(title__icontains=search_str) |
                Q(description__icontains=search_str) |
                Q(category__name__icontains=search_str) |
                Q(provider__user__first_name__icontains=search_str) |
                Q(provider__user__last_name__icontains=search_str)
            )
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER':
            raise exceptions.PermissionDenied("Customers are not permitted to publish services. Please register as a Provider or Homemaker Artisan.")

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer.save(provider=provider_prof)

class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related('provider__user', 'category')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            # For the provider dashboard: return all products (available & sold out)
            qs = Product.objects.select_related('provider__user', 'category').filter(
                Q(provider__id=provider_id) | Q(provider__user__id=provider_id)
            )
        else:
            # For general marketplace: strictly available items with stock > 0
            qs = Product.objects.select_related('provider__user', 'category').filter(
                is_available=True, quantity__gt=0
            )

        cat = self.request.query_params.get('category')
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        min_price = self.request.query_params.get('min_price') or self.request.query_params.get('minPrice')
        max_price = self.request.query_params.get('max_price') or self.request.query_params.get('maxPrice')
        ordering = self.request.query_params.get('ordering')

        if cat:
            qs = qs.filter(category__slug=cat)
        if search:
            search_str = search.strip()
            qs = qs.filter(
                Q(title__icontains=search_str) |
                Q(description__icontains=search_str) |
                Q(category__name__icontains=search_str) |
                Q(provider__user__first_name__icontains=search_str) |
                Q(provider__user__last_name__icontains=search_str)
            )
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        if ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER':
            raise exceptions.PermissionDenied("Customers are not permitted to sell products. Please register as a Provider or Homemaker Artisan.")

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer.save(provider=provider_prof)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('provider__user', 'category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class UnifiedSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'services': [], 'products': [], 'providers': []})

        services = Service.objects.filter(is_available=True).filter(
            Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q)
        )[:10]

        products = Product.objects.filter(is_available=True, quantity__gt=0).filter(
            Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q)
        )[:10]

        providers = ProviderProfile.objects.filter(
            Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q) | Q(bio__icontains=q) | Q(skills__icontains=q)
        )[:10]

        return Response({
            'services': ServiceSerializer(services, many=True).data,
            'products': ProductSerializer(products, many=True).data,
            'providers': ProviderProfileSerializer(providers, many=True).data
        })

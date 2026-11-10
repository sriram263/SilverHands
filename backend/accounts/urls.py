from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    AdminUserListCreateView,
    AdminUserDetailView,
    AdminToggleSuspendView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Admin User Management
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin_user_list_create'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:pk>/toggle-suspend/', AdminToggleSuspendView.as_view(), name='admin_toggle_suspend'),
]

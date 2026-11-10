from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    CustomerProfileSerializer
)
from .models import CustomerProfile

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = CustomTokenObtainPairSerializer.get_token(user)
            return Response({
                'user': UserProfileSerializer(user).data,
                'token': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Dedicated Admin User Management Endpoints ---

class IsAdminUserOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == 'ADMIN' or request.user.is_staff or 
                request.user.is_superuser or request.user.username == 'admin'
            )
        )

class AdminUserListCreateView(APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        username = data.get('username')
        password = data.get('password', 'demo1234')
        role = data.get('role', User.Role.CUSTOMER)
        email = data.get('email', f"{username}@silverhands.org")

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            role=role,
            address=data.get('address', 'Chennai, TN'),
            is_senior=data.get('is_senior', False)
        )
        if role == User.Role.PROVIDER:
            from marketplace.models import ProviderProfile
            ProviderProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': data.get('bio', 'Newly added elder provider'),
                    'location': data.get('address', 'Chennai, TN'),
                    'experience_years': data.get('experience_years', 10),
                    'skills': data.get('skills', ['Traditional Craft'])
                }
            )
        elif role == User.Role.CUSTOMER:
            CustomerProfile.objects.get_or_create(
                user=user,
                defaults={'location': data.get('address', 'Chennai, TN')}
            )

        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)

class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            return Response(UserProfileSerializer(user).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            serializer = UserProfileSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.username == 'admin':
                return Response({'error': 'Cannot delete root admin account'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminToggleSuspendView(APIView):
    permission_classes = [IsAdminUserOnly]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_suspended = not user.is_suspended
            user.is_active = not user.is_suspended
            user.save()
            return Response({
                'id': user.id,
                'username': user.username,
                'is_suspended': user.is_suspended,
                'is_active': user.is_active,
                'message': f"User {'suspended' if user.is_suspended else 'reactivated'} successfully"
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

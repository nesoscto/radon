from django.urls import path
from dj_rest_auth.registration.views import RegisterView
from .views import ProfileView, PasswordChangeView, PasswordResetView, DeviceListCreateView, DeviceDetailView, SensorReadingIngestView, DeviceDashboardView, PasswordResetConfirmAPIView
from django.contrib.auth import views as auth_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('password-change/', PasswordChangeView.as_view(), name='password_change'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmAPIView.as_view(), name='password_reset_confirm_api'),
    path('devices/', DeviceListCreateView.as_view(), name='device-list-create'),
    path('devices/<int:pk>/', DeviceDetailView.as_view(), name='device-detail'),
    path('devices/<str:serial_number>/dashboard/', DeviceDashboardView.as_view(), name='device-dashboard'),
] 
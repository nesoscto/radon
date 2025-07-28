from decimal import Decimal as D

from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserProfileSerializer, PasswordChangeSerializer, DeviceSerializer, DeviceDashboardSerializer
from .models import UserProfile, Device, SensorReading
from .auth import CentralCollectorAPIKeyAuthentication
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordResetForm
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework.permissions import IsAuthenticated
from .exceptions import SensorException
from .sensor import process_message

# Create your views here.

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return UserProfile.objects.select_related('user').get(user=self.request.user)

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PasswordChangeSerializer(data=request.data)
        user = request.user
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            update_session_auth_hash(request, user)
            return Response({'detail': 'Password updated successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'email': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        form = PasswordResetForm({'email': email})
        if form.is_valid():
            frontend_url = settings.FRONTEND_URL
            form.save(
                request=request,
                use_https=False,
                from_email=None,
                email_template_name='core_password_reset_email.html',
                extra_email_context={'frontend_url': frontend_url},
            )
            return Response({'detail': 'Password reset e-mail has been sent.'})
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        new_password1 = request.data.get('new_password1')
        new_password2 = request.data.get('new_password2')
        if new_password1 != new_password2:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'error': 'Invalid link.'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password1)
        user.save()
        return Response({'detail': 'Password has been reset.'})

class DeviceListCreateView(generics.ListCreateAPIView):
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.devices.all()


    def post(self, request, *args, **kwargs):
        serial_number = request.data.get('serial_number')
        if not serial_number:
            return Response({'serial_number': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if device := Device.objects.filter(serial_number=serial_number).first():
            if self.request.user in device.users.all():
                return Response({'detail': 'Device already added.'}, status=status.HTTP_400_BAD_REQUEST)
            device.users.add(self.request.user)
            serializer = self.get_serializer(device)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return self.create(request, *args, **kwargs)
        
    def perform_create(self, serializer):
        serializer.save(users=[self.request.user])

class DeviceDetailView(generics.RetrieveAPIView):
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.devices.all()

class DeviceDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, serial_number):
        try:
            device = self.request.user.devices.get(serial_number=serial_number)
        except Device.DoesNotExist:
            return Response({'detail': 'Device not found.'}, status=status.HTTP_404_NOT_FOUND)
        now = timezone.now()
        readings = SensorReading.objects.filter(device=device).order_by('-timestamp')
        recent = readings.first()
        # Averages
        def avg_for_days(days):
            since = now - timedelta(days=days)
            vals = readings.filter(timestamp__gte=since).values_list('value', flat=True)
            return D(sum(vals)/len(vals)).quantize(D('0.01')) if vals else None
        averages = {
            '24_hours': avg_for_days(1),
            '7_days': avg_for_days(7),
            '30_days': avg_for_days(30),
        }
        # Trend: last 30 days, sorted by timestamp asc
        trend_qs = readings.filter(timestamp__gte=now - timedelta(days=30)).order_by('timestamp')
        trend = [
            {'timestamp': r.timestamp.isoformat(), 'value': r.value, 'rssi': r.rssi}
            for r in trend_qs
        ]
        data = {
            'recent_reading': {
                'value': recent.value if recent else None,
                'rssi': recent.rssi if recent else None,
                'timestamp': recent.timestamp.isoformat() if recent else None,
            },
            'averages': averages,
            'trend': trend,
        }
        serializer = DeviceDashboardSerializer(data)
        return Response(serializer.data)

class SensorReadingIngestView(APIView):
    authentication_classes = [CentralCollectorAPIKeyAuthentication]
    permission_classes = []

    def post(self, request, *args, **kwargs):
        obj = request.data
        try:
            process_message(obj)
        except SensorException as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Reading stored.'}, status=status.HTTP_201_CREATED)

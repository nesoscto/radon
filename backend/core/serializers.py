from rest_framework import serializers
from .models import UserProfile, Device
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model


User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = UserProfile
        fields = ['email', 'address', 'phone', 'alert_email_enabled']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'serial_number', 'date_created', 'date_updated', "users"]
        read_only_fields = ['id', 'date_created', 'date_updated']
        extra_kwargs = {'users': {'required': False}}

class DeviceDashboardSerializer(serializers.Serializer):
    recent_reading = serializers.DictField()
    averages = serializers.DictField()
    trend = serializers.ListField() 
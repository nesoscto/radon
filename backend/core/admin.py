from django.contrib import admin
from .models import UserProfile, Device, SensorReading

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Device)
admin.site.register(SensorReading)

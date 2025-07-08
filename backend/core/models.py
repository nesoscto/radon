from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

class TimeStampedModel(models.Model):
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    alert_email_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

class Device(TimeStampedModel):
    # alphanumeric EUI-64
    serial_number = models.CharField(max_length=64, unique=True)
    users = models.ManyToManyField(User, related_name='devices', blank=True)

    def __str__(self):
        return f"{self.serial_number}"

class SensorReading(TimeStampedModel):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    value = models.FloatField()
    rssi = models.FloatField()
    timestamp = models.DateTimeField()
    deduplicationId = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return f"{self.device.serial_number} @ {self.timestamp}: {self.value} ({self.rssi})"

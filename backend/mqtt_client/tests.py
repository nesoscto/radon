import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Device, SensorReading
from mqtt_client.mqtt_client import on_message
from pathlib import Path
from types import SimpleNamespace

# Create your tests here.

class MqttClientTestCase(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass', email='test@example.com')
        self.device = Device.objects.create(serial_number='0123456789abcd13')
        self.device.users.add(self.user)
        # Ensure user profile exists and alert_email_enabled is True
        self.user.profile.alert_email_enabled = True
        self.user.profile.save()
        # Load sample message
        sample_path = Path(__file__).parent / 'files' / 'mqtt_example.json'
        with open(sample_path) as f:
            self.sample_data = json.load(f)
        self.sample_payload = json.dumps(self.sample_data).encode()

    def test_on_message_processes_and_writes_sensor_reading(self):
        # Simulate MQTT message object
        message = SimpleNamespace()
        message.payload = self.sample_payload
        message.topic = 'application/50c4db63-0f74-4b5a-8d4c-964f238a786d/device/0123456789abcd13/event/up'
        # Call on_message
        on_message(None, None, message)
        # Assert SensorReading was created
        reading = SensorReading.objects.get(deduplicationId=self.sample_data['deduplicationId'])
        self.assertEqual(reading.device, self.device)
        self.assertEqual(reading.value, int(self.sample_data['object']['hexdata']))
        self.assertEqual(reading.rssi, self.sample_data['rxInfo'][0]['rssi'])
        self.assertEqual(str(reading.timestamp), self.sample_data['time'].replace('T', ' '))

from django.core import mail
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import UserProfile, Device, SensorReading
from .sensor import process_message
from .exceptions import SensorException
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import AccessToken

# Create your tests here.

class ProfileViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.profile = self.user.profile
        self.access_token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        self.url = reverse('profile')

    def test_get_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('address', response.data)
        self.assertIn('phone', response.data)
        self.assertIn('alert_email_enabled', response.data)
        self.assertTrue(response.data['alert_email_enabled'])

    def test_update_profile(self):
        data = {'address': '123 Main St', 'phone': '555-1234', 'alert_email_enabled': False}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.address, '123 Main St')
        self.assertEqual(self.profile.phone, '555-1234')
        self.assertFalse(self.profile.alert_email_enabled)

class PasswordChangeViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='changepass', email='change@example.com', password='oldpass123')
        self.access_token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        self.url = reverse('password_change')

    def test_change_password_success(self):
        data = {'old_password': 'oldpass123', 'new_password': 'newpass456'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass456'))

    def test_change_password_wrong_old(self):
        data = {'old_password': 'wrongpass', 'new_password': 'newpass456'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpass123'))

class PasswordResetViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='resetuser', email='reset@example.com', password='resetpass123')
        self.url = reverse('password_reset')

    def test_password_reset_email_sent(self):
        response = self.client.post(self.url, {'email': 'reset@example.com'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('detail', response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('reset@example.com', mail.outbox[0].to)

    def test_password_reset_email_not_found(self):
        response = self.client.post(self.url, {'email': 'notfound@example.com'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

class DeviceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='devuser', email='dev@example.com', password='devpass123')
        self.access_token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        self.device1 = Device.objects.create(serial_number='SN123')
        self.device2 = Device.objects.create(serial_number='SN456')
        self.user.devices.add(self.device1, self.device2)
        self.url = reverse('device-list-create')

    def test_list_devices(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        serials = [d['serial_number'] for d in response.data]
        self.assertIn('SN123', serials)
        self.assertIn('SN456', serials)

    def test_create_device(self):
        data = {'serial_number': 'SN789'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 201, response.json())
        self.assertTrue(Device.objects.filter(serial_number='SN789', users=self.user).exists())

    def test_create_duplicate_device_fails(self):
        data = {'serial_number': 'SN123'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400, response.json())

    def test_create_device_different_user_same_serial_number(self):
        other_user = User.objects.create_user(username='devuser2', email='dev2@example.com', password='devpass123')
        other_access_token = str(AccessToken.for_user(other_user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + other_access_token)
        data = {'serial_number': 'SN123'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 201, response.json())
        self.assertEqual(list(self.device1.users.all().values_list('id', flat=True)), [self.user.id, other_user.id])

    def test_device_detail(self):
        detail_url = reverse('device-detail', args=[self.device1.pk])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['serial_number'], 'SN123')

    def test_cannot_access_others_device(self):
        other_user = User.objects.create_user(username='other', email='other@example.com', password='otherpass')
        other_device = Device.objects.create(serial_number='SN999')
        other_device.users.add(other_user)
        detail_url = reverse('device-detail', args=[other_device.pk])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 404)

class SensorReadingIngestTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='sensoruser', email='sensor@example.com', password='sensorpass')
        self.device = Device.objects.create(serial_number='0123456789abcd11')
        self.device.users.add(self.user)
        self.base_payload = {
            "deduplicationId": "test-dedup-id-1",
            "time": timezone.now().isoformat(),
            "deviceInfo": {
                "devEui": self.device.serial_number
            },
            "object": {
                "hexdata": "23"
            },
            "rxInfo": [
                {"rssi": -64}
            ]
        }

    def test_valid_ingest(self):
        process_message(self.base_payload)
        reading = SensorReading.objects.get(device=self.device, deduplicationId="test-dedup-id-1")
        self.assertEqual(reading.value, int(self.base_payload["object"]["hexdata"]))
        self.assertEqual(reading.rssi, self.base_payload["rxInfo"][0]["rssi"])
        self.assertEqual(reading.timestamp.isoformat(), self.base_payload["time"])

    def test_device_not_found(self):
        payload = self.base_payload.copy()
        payload["deviceInfo"] = {"devEui": "NOTFOUND"}
        payload["deduplicationId"] = "test-dedup-id-2"
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 0)

    def test_warning_triggered(self):
        payload = self.base_payload.copy()
        payload["object"] = {"hexdata": "151"}
        payload["deduplicationId"] = "test-dedup-id-3"
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('sensor@example.com', mail.outbox[0].to)
        self.assertIn('Sensor Alert', mail.outbox[0].subject)

    def test_alert_triggered(self):
        payload = self.base_payload.copy()
        payload["object"] = {"hexdata": "201"}
        payload["deduplicationId"] = "test-dedup-id-3"
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('sensor@example.com', mail.outbox[0].to)
        self.assertIn('Sensor Alert - Action Needed', mail.outbox[0].subject)

    def test_alert_triggered_multiple_users(self):
        user2 = User.objects.create_user(username='sensoruser2', email='sensor2@example.com', password='sensorpass2')
        self.device.users.add(user2)
        payload = self.base_payload.copy()
        payload["object"] = {"hexdata": "201"}
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 1)
        # Both users should receive an email (will fail until process_message is updated)
        self.assertEqual(len(mail.outbox), 2)
        recipients = [email for m in mail.outbox for email in m.to]
        self.assertIn('sensor@example.com', recipients)
        self.assertIn('sensor2@example.com', recipients)

    def test_alert_respects_profile_toggle(self):
        # Disable alert emails
        self.user.profile.alert_email_enabled = False
        self.user.profile.save()
        payload = self.base_payload.copy()
        payload["object"] = {"hexdata": "201"}
        payload["deduplicationId"] = "test-dedup-id-toggle"
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 1)
        self.assertEqual(len(mail.outbox), 0)

    def test_alert_respects_profile_toggle_multiple_users(self):
        user2 = User.objects.create_user(username='sensoruser2', email='sensor2@example.com', password='sensorpass2')
        self.device.users.add(user2)
        # Only user2 has alerts enabled
        self.user.profile.alert_email_enabled = False
        self.user.profile.save()
        user2.profile.alert_email_enabled = True
        user2.profile.save()
        payload = self.base_payload.copy()
        payload["object"] = {"hexdata": "201"}
        process_message(payload)
        self.assertEqual(SensorReading.objects.all().count(), 1)
        # Only user2 should receive an email (will fail until process_message is updated)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('sensor2@example.com', mail.outbox[0].to)
        self.assertNotIn('sensor@example.com', mail.outbox[0].to)

    def test_duplicate_deduplication_id(self):
        process_message(self.base_payload)
        process_message(self.base_payload)
        self.assertEqual(SensorReading.objects.filter(device=self.device, deduplicationId="test-dedup-id-1").count(), 1)

    def test_missing_fields(self):
        payload = self.base_payload.copy()
        del payload["deduplicationId"]
        with self.assertRaises(SensorException):
            process_message(payload)
        self.assertEqual(SensorReading.objects.filter(device=self.device).count(), 0)

    def test_empty_hexdata(self):
        payload = self.base_payload.copy()
        payload["object"]["hexdata"] = ""
        with self.assertLogs('core.sensor', level='ERROR') as cm:
            process_message(payload)
        self.assertTrue(any("Empty hexdata. Ignoring." in message for message in cm.output))
        self.assertEqual(SensorReading.objects.filter(device=self.device).count(), 0)
        

class DeviceDashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='dashuser', email='dash@example.com', password='dashpass')
        self.access_token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        self.device = Device.objects.create(serial_number='DASH123')
        self.device.users.add(self.user)
        self.url = reverse('device-dashboard', args=[self.device.serial_number])
        now = timezone.now()
        SensorReading.objects.create(device=self.device, value=10, rssi=80, timestamp=now - timedelta(hours=12), deduplicationId='dash-1')
        SensorReading.objects.create(device=self.device, value=20, rssi=70, timestamp=now - timedelta(days=2), deduplicationId='dash-2')
        SensorReading.objects.create(device=self.device, value=30, rssi=60, timestamp=now - timedelta(days=8), deduplicationId='dash-3')
        SensorReading.objects.create(device=self.device, value=40, rssi=50, timestamp=now - timedelta(days=25), deduplicationId='dash-4')

    def test_dashboard_success(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('recent_reading', response.data)
        self.assertIn('averages', response.data)
        self.assertIn('trend', response.data)
        self.assertEqual(response.data['recent_reading']['value'], 10)
        # 7 days: 10, 20 (avg 15.0)
        self.assertAlmostEqual(response.data['averages']['7_days'], 15.0)
        # 24 days: 10, 20, 30 (avg 20.0)
        self.assertAlmostEqual(response.data['averages']['24_hours'], 10.0)
        # 30 days: 10, 20, 30, 40 (avg 25.0)
        self.assertAlmostEqual(response.data['averages']['30_days'], 25.0)
        self.assertEqual(len(response.data['trend']), 4)

    def test_dashboard_device_not_found(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.access_token)
        url = reverse('device-dashboard', args=['NOTFOUND'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_dashboard_permission(self):
        other_user = User.objects.create_user(username='otherdash', email='otherdash@example.com', password='otherpass')
        other_access_token = str(AccessToken.for_user(other_user))
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + other_access_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)

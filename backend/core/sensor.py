from django.core.mail import send_mail
from django.conf import settings


from .exceptions import SensorException
from .models import Device, SensorReading


import logging
logger = logging.getLogger(__name__)


def process_message(obj):
    deduplicationId = obj.get('deduplicationId')
    timestamp = obj.get('time')
    device_info = obj.get('deviceInfo', {})
    serial_number = device_info.get('devEui')
    object_data = obj.get('object', {})
    hexdata = object_data.get('hexdata')
    rxInfo = obj.get('rxInfo', [])
    rssi = rxInfo[0]['rssi'] if rxInfo and 'rssi' in rxInfo[0] else None
    missing = []
    if not deduplicationId:
        missing.append('deduplicationId')
    if not timestamp:
        missing.append('time')
    if not serial_number:
        missing.append('deviceInfo.devEui')
    if hexdata is None:
        missing.append('object.hexdata')
    if rssi is None:
        missing.append('rxInfo[0].rssi')
    if missing:
        # FIXME do we need to raise? or ignore and warn?
        raise SensorException(f'Missing required field(s): {", ".join(missing)}')
    if hexdata == "":
        logger.error("Empty hexdata. Ignoring.")
        return
    value = int(hexdata)
    try:
        device = Device.objects.get(serial_number=serial_number)
    except Device.DoesNotExist:
        logger.info('Device not registered: %s', serial_number)
        return
    reading, created = SensorReading.objects.get_or_create(
        deduplicationId=deduplicationId,
        defaults=dict(
            device=device,
            value=value,
            rssi=rssi,
            timestamp=timestamp,
        )
    )
    if not created:
        logger.info('Duplicate deduplicationId: %s', deduplicationId)
        return
    # Alert logic
    threshold = getattr(settings, 'SENSOR_ALERT_THRESHOLD', 200)
    if reading.value > threshold:
        for user in device.users.filter(profile__alert_email_enabled=True):
            send_mail(
                subject='Sensor Alert',
                message=f'Sensor {device.serial_number} value {reading.value} exceeded threshold {threshold}.',
                from_email=settings.NOTIFICATIONS_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
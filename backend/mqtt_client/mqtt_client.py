import json
from functools import lru_cache
import paho.mqtt.client as mqtt
from django.conf import settings

import logging
logger = logging.getLogger(__name__)

# https://www.emqx.com/en/blog/how-to-use-mqtt-in-django

def on_connect(mqtt_client, userdata, flags, rc, properties):
    if rc == 0:
        logger.info('Connected successfully')
        mqtt_client.subscribe('application/50c4db63-0f74-4b5a-8d4c-964f238a786d/device/+/event/up')
    else:
        logger.error('Bad connection. Code:', rc)

def on_message(mqtt_client, userdata, message):
    payload = message.payload.decode()
    data = json.loads(payload)
    logger.debug(f"Received message {message.topic}: {payload}")
    from core import sensor
    sensor.process_message(data)

def on_disconnect(mqtt_client, userdata, rc):
    logger.info('Disconnected from MQTT broker')



@lru_cache
def set_up_client():
    logging.info('Setting up MQTT client')
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.enable_logger()
    import ssl
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)
    client.username_pw_set(settings.MQTT_BROKER_USERNAME, settings.MQTT_BROKER_PASSWORD)
    client.connect(
        host=settings.MQTT_BROKER_URL,
        port=settings.MQTT_BROKER_PORT,
        keepalive=settings.MQTT_KEEPALIVE
    )
    return client

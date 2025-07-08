from django.apps import AppConfig


class MqttClientConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mqtt_client'

    def ready(self):
        from . import mqtt_client
        mqtt_client.set_up_client()


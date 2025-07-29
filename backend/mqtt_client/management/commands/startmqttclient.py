from django.core.management.base import BaseCommand
from mqtt_client import mqtt_client
        

class Command(BaseCommand):
    help = "Starts the MQTT client"

    def handle(self, *args, **options):
        client = mqtt_client.set_up_client()
        client.loop_forever()

from rest_framework.authentication import BaseAuthentication
from django.conf import settings
from rest_framework import exceptions

class CentralCollectorAPIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('Authorization')
        if not api_key or not api_key.startswith('Api-Key '):
            raise exceptions.AuthenticationFailed('API key required')
        key = api_key.split(' ', 1)[1]
        if key != getattr(settings, 'CENTRAL_COLLECTOR_API_KEY', None):
            raise exceptions.AuthenticationFailed('Invalid API key')
        return (None, None)  # No user, but authenticated

    def authenticate_header(self, request):
        return 'Api-Key'

        
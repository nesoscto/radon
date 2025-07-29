#!/bin/bash

python manage.py migrate
gunicorn radon_backend.wsgi --bind 0.0.0.0:8000

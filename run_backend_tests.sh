#!/bin/bash

echo "Running backend tests in Docker container..."
docker compose run --rm backend python manage.py test "$@" 
# Radon Cursor IoT Webapp

## Project Structure

- `backend/` - Django + DRF backend
- `frontend/` - React frontend
- `docker-compose.yml` - Multi-service orchestration

## Services
- **backend**: Django REST API
- **db**: PostgreSQL
- **frontend**: React app
- **maildev**: Email testing (http://localhost:1080)

## Quick Start
- `docker-compose up --build`
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Maildev: http://localhost:1080 
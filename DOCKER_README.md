# 🐳 Docker Setup Guide

## Prerequisites

- Docker Desktop installed
- Docker Compose v2.0+
- At least 4GB RAM available for Docker

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.docker .env

# Edit .env file with your configuration
# Required: SUPABASE_URL, SUPABASE_KEY, SUPABASE_ANON_KEY
```

### 2. Development Setup
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run development setup
./scripts/dev-setup.sh
```

### 3. Production Deployment
```bash
# Run production deployment
./scripts/deploy.sh
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 8081 | React Native Web (Expo) |
| Backend | 8000 | FastAPI Application |
| Database | 5432 | PostgreSQL |
| Redis | 6379 | Cache & Task Queue |
| Nginx | 80/443 | Reverse Proxy |

## Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache
```

### Development Commands
```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Access backend shell
docker-compose exec backend bash

# Run migrations
docker-compose exec backend alembic upgrade head

# Access database
docker-compose exec postgres psql -U postgres -d synth_gen
```

### Troubleshooting
```bash
# Check service health
docker-compose ps

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart backend

# Clean up volumes (⚠️ Data loss!)
docker-compose down -v
```

## Architecture

```
┌─────────────────┐
│     Nginx       │ ← Port 80/443
│  (Reverse Proxy)│
└─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│Frontend │ │ Backend │
│  :8081  │ │  :8000  │
└─────────┘ └─────────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌─────────┐ ┌─────────┐
    │ Postgres│ │  Redis  │
    │  :5432  │ │  :6379  │
    └─────────┘ └─────────┘
```

## Environment Variables

### Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Service role key
- `SUPABASE_ANON_KEY`: Anonymous key

### Optional
- `POSTGRES_PASSWORD`: Database password (default: auto-generated)
- `SECRET_KEY`: JWT secret (default: auto-generated)
- `DEBUG`: Enable debug mode (default: False)

## Data Persistence

- Database data: `postgres_data` volume
- Redis data: `redis_data` volume
- Backend uploads: `backend_uploads` volume
- Worker data: `worker_data` volume

## Security Features

- Non-root containers
- Rate limiting (Nginx)
- Security headers
- Health checks
- Resource limits

## Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost/health

# Backend specific
curl http://localhost:8000/health
```

### Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Real-time logs
docker-compose logs -f
```

## Production Considerations

1. **SSL Certificates**: Add SSL certificates to `nginx/ssl/`
2. **Environment**: Set `DEBUG=False` in production
3. **Secrets**: Use Docker secrets or external secret management
4. **Backup**: Regular backup of PostgreSQL data
5. **Monitoring**: Add monitoring stack (Prometheus/Grafana)
6. **Scaling**: Use Docker Swarm or Kubernetes for scaling

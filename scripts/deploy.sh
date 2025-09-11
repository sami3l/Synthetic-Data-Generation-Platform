#!/bin/bash

# Docker deployment script for Synthetic Data Generation Platform

set -e

echo "🚀 Starting Docker deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Copying from .env.docker template..."
    cp .env.docker .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose pull

# Build images
echo "🔨 Building images..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose exec backend alembic upgrade head

# Show status
echo "📊 Service status:"
docker-compose ps

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:80"
echo "🔧 Backend API: http://localhost:80/api"
echo "📚 API Docs: http://localhost:80/api/docs"

# Show logs
echo "📝 Showing recent logs..."
docker-compose logs --tail=50

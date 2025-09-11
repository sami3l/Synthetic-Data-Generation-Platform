# Makefile for Synthetic Data Generation Platform

.PHONY: help build start stop restart logs clean dev prod migrate shell db-shell

# Default target
help:
	@echo "🐳 Synthetic Data Generation Platform - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build all Docker images"
	@echo "  make start        - Start all services"
	@echo "  make stop         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View logs from all services"
	@echo "  make logs-f       - Follow logs from all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make migrate-down - Rollback last migration"
	@echo "  make db-shell     - Access database shell"
	@echo "  make db-reset     - Reset database"
	@echo ""
	@echo "Maintenance:"
	@echo "  make shell        - Access backend shell"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make clean-all    - Clean everything including images"
	@echo "  make health       - Check service health"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Deploy production environment"

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
	@echo "⏳ Waiting for services to start..."
	@sleep 15
	@make migrate
	@echo "✅ Development environment ready!"
	@echo "🌐 Frontend: http://localhost:8081"
	@echo "🔧 Backend: http://localhost:8000"

# Production environment
prod:
	@echo "🚀 Deploying production environment..."
	@if [ ! -f .env ]; then \
		echo "⚠️ .env file not found. Creating from template..."; \
		cp .env.docker .env; \
		echo "📝 Please edit .env file with your configuration"; \
		exit 1; \
	fi
	docker-compose up --build -d
	@sleep 20
	@make migrate
	@echo "✅ Production deployment complete!"
	@echo "🌐 Application: http://localhost"

# Build images
build:
	@echo "🔨 Building Docker images..."
	docker-compose build --no-cache

# Start services
start:
	@echo "🚀 Starting services..."
	docker-compose up -d

# Stop services
stop:
	@echo "🛑 Stopping services..."
	docker-compose down

# Restart services
restart: stop start

# View logs
logs:
	docker-compose logs --tail=100

# Follow logs
logs-f:
	docker-compose logs -f

# Database migrations
migrate:
	@echo "🔄 Running database migrations..."
	docker-compose exec backend alembic upgrade head

# Rollback migration
migrate-down:
	@echo "⬇️ Rolling back last migration..."
	docker-compose exec backend alembic downgrade -1

# Access backend shell
shell:
	docker-compose exec backend bash

# Access database shell
db-shell:
	docker-compose exec postgres psql -U postgres -d synth_gen

# Reset database
db-reset:
	@echo "⚠️ This will delete all data. Are you sure? [y/N]" && read ans && [ $${ans:-N} = y ]
	docker-compose down
	docker volume rm synthetic-data-generation-platform_postgres_data || true
	docker-compose up -d postgres
	@sleep 10
	@make migrate

# Health check
health:
	@echo "🔍 Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "🌐 Frontend health:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "❌ Frontend unreachable"
	@echo ""
	@echo "🔧 Backend health:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "❌ Backend unreachable"

# Clean up
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v
	docker system prune -f

# Clean everything
clean-all:
	@echo "🧹 Cleaning everything (containers, volumes, images)..."
	docker-compose down -v --rmi all
	docker system prune -af

# Install dependencies (for development)
install:
	@echo "📦 Installing backend dependencies..."
	cd synth-backend && pip install -r requirements-minimal.txt
	@echo "📦 Installing frontend dependencies..."
	cd synthetic-data-platform && npm install

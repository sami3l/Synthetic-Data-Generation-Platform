#!/bin/bash

# Development setup script for Docker

set -e

echo "🔧 Setting up development environment..."

# Create .env from template if it doesn't exist
if [ ! -f .env ]; then
    cp .env.docker .env
    echo "📝 Created .env file from template"
fi

# Build and start services in development mode
echo "🚀 Starting development environment..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 15

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec backend alembic upgrade head

# Create superuser (optional)
read -p "🔑 Create admin user? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose exec backend python -c "
from app.db.database import get_db
from app.models.user import User
from passlib.context import CryptContext
from sqlalchemy.orm import Session

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = next(get_db())

admin = User(
    email='admin@example.com',
    username='admin',
    hashed_password=pwd_context.hash('admin123'),
    role='admin',
    is_active=True
)

db.add(admin)
db.commit()
print('Admin user created: admin@example.com / admin123')
"
fi

echo "✅ Development environment ready!"
echo "🌐 Frontend: http://localhost:8081"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️ Database: localhost:5432"

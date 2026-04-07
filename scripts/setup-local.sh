#!/usr/bin/env bash
set -euo pipefail

echo "=== MatForge Local Development Setup ==="

# Check prerequisites
for cmd in docker python3 node npm; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: $cmd is required but not installed."; exit 1; }
done

# Copy .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please review and update values."
fi

# Start infrastructure services
echo "Starting PostgreSQL and Redis..."
docker compose up -d db redis

# Wait for services
echo "Waiting for PostgreSQL..."
until docker compose exec -T db pg_isready -U matforge 2>/dev/null; do sleep 1; done
echo "PostgreSQL is ready."

echo "Waiting for Redis..."
until docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do sleep 1; done
echo "Redis is ready."

# Create Prisma schema in PostgreSQL
echo "Creating 'app' schema for Prisma..."
docker compose exec -T db psql -U matforge -d matforge_dev -c "CREATE SCHEMA IF NOT EXISTS app;" 2>/dev/null || true

# Install Python packages
echo "Installing Python packages..."
pip install -e ".[dev]"
cd backend && pip install -e ".[dev]" && cd ..
cd sdk && pip install -e ".[dev]" && cd ..

# Run Alembic migrations
echo "Running database migrations..."
cd backend && alembic upgrade head && cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Generate Prisma client and run migrations
echo "Setting up Prisma..."
cd frontend
npx prisma generate
PRISMA_DATABASE_URL="postgresql://matforge:matforge@localhost:5433/matforge_dev?schema=app" npx prisma migrate dev --name init 2>/dev/null || \
  PRISMA_DATABASE_URL="postgresql://matforge:matforge@localhost:5433/matforge_dev?schema=app" npx prisma db push
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start all services:  docker compose up"
echo ""
echo "Or start individually:"
echo "  Backend API:  cd backend && uvicorn app.main:app --reload --port 8000"
echo "  Worker:       cd backend && celery -A app.tasks.celery_app worker --loglevel=info --queues=default,campaigns --concurrency=2"
echo "  Frontend:     cd frontend && npm run dev"

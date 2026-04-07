#!/usr/bin/env bash
set -euo pipefail

COMMAND=${1:-upgrade}
TARGET=${2:-head}

case $COMMAND in
  upgrade)
    echo "Running Alembic upgrade: $TARGET"
    cd backend && alembic upgrade "$TARGET" && cd ..
    echo "Running Prisma migrations..."
    cd frontend && npx prisma migrate deploy && cd ..
    echo "All migrations applied."
    ;;
  downgrade)
    echo "Running Alembic downgrade: $TARGET"
    cd backend && alembic downgrade "$TARGET" && cd ..
    ;;
  generate)
    echo "Generating new Alembic migration: $TARGET"
    cd backend && alembic revision --autogenerate -m "$TARGET" && cd ..
    ;;
  prisma-push)
    echo "Pushing Prisma schema to database..."
    cd frontend && npx prisma db push && cd ..
    ;;
  prisma-migrate)
    echo "Creating Prisma migration: $TARGET"
    cd frontend && npx prisma migrate dev --name "$TARGET" && cd ..
    ;;
  status)
    echo "=== Alembic ==="
    cd backend && alembic current && cd ..
    echo ""
    echo "=== Prisma ==="
    cd frontend && npx prisma migrate status && cd ..
    ;;
  *)
    echo "Usage: $0 {upgrade|downgrade|generate|prisma-push|prisma-migrate|status} [target]"
    echo ""
    echo "Commands:"
    echo "  upgrade [head]       Run Alembic upgrade + Prisma migrate deploy"
    echo "  downgrade <target>   Run Alembic downgrade"
    echo "  generate <message>   Generate new Alembic migration"
    echo "  prisma-push          Push Prisma schema without migration"
    echo "  prisma-migrate <name> Create new Prisma migration"
    echo "  status               Show migration status for both ORMs"
    exit 1
    ;;
esac

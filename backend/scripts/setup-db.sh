#!/bin/bash

# Use PostgreSQL for production, SQLite for local development
# Detection: NODE_ENV=production OR DATABASE_URL starts with postgres

if [[ "$NODE_ENV" == "production" ]] || [[ "$DATABASE_URL" == postgres* ]] || [[ "$DATABASE_URL" == postgresql* ]]; then
  echo "Using PostgreSQL schema..."
  cp prisma/schema.postgres.prisma prisma/schema.prisma

  # Set dummy URL for prisma generate if not available yet (addon connects later)
  export DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}"
else
  echo "Using SQLite schema..."
  export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
fi

# Generate Prisma client
npx prisma generate

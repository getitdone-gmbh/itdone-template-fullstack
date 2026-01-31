#!/bin/bash

# Detect database type from DATABASE_URL and use appropriate schema
if [[ "$DATABASE_URL" == postgres* ]] || [[ "$DATABASE_URL" == postgresql* ]]; then
  echo "Using PostgreSQL schema..."
  cp prisma/schema.postgres.prisma prisma/schema.prisma
else
  echo "Using SQLite schema..."
  # schema.prisma already defaults to SQLite
fi

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push --skip-generate

#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy --schema=database/prisma/schema.prisma
echo "Starting API..."
exec node apps/backend/dist/main.js

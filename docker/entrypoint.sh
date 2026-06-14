#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/app.db}"
export PDF_STORAGE_PATH="${PDF_STORAGE_PATH:-/data/pdfs}"

mkdir -p /data/pdfs

cd /app/backend

echo "Applying database schema..."
npx prisma db push --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding sample data..."
  node dist/scripts/seed.js || echo "Seed skipped or already applied."
fi

echo "Starting API on port ${PORT:-3001}..."
node dist/index.js &

echo "Starting nginx on port 80..."
exec nginx -g 'daemon off;'

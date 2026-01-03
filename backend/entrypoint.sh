#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 2
done

echo "✅ PostgreSQL is ready"

echo "📦 Running DB migrations & seed..."
sh ./scripts/init-db.sh

echo "🚀 Starting backend server..."
node src/server.js

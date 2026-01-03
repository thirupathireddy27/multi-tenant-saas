#!/bin/sh
echo "⏳ Waiting for PostgreSQL..."

export PGPASSWORD="$DB_PASSWORD"

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"
do
  sleep 2
done

echo "✅ PostgreSQL is ready"

echo "🚀 Running migrations..."
for file in /app/database/migrations/*.sql
do
  echo "Running $file"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file"
done

echo "🌱 Running seed data..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/database/seeds/seed_data.sql

echo "✅ Database initialized"

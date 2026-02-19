#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 2
done

echo "✅ PostgreSQL is ready"

echo "📦 Installing dependencies..."
npm install

echo "📦 Running DB migrations & seed..."
npm run migrate
npm run seed

echo "🚀 Starting backend server..."
npm start

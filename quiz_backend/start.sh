#!/bin/bash
# Startup script that runs migrations before starting the server

set -e

echo "🚀 Running database migrations..."
python run_migration.py

# Use Railway's PORT environment variable if available, otherwise default to 8000
PORT=${PORT:-8000}

echo "✅ Starting application server on port $PORT..."
exec gunicorn backend.api:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT


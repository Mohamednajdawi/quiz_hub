#!/bin/bash
# Startup script that runs migrations before starting the server

set -e

echo "🚀 Running database migrations..."
python run_migration.py

echo "✅ Starting application server..."
exec gunicorn backend.api:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000


#!/bin/bash
# Startup script that runs migrations before starting the server

set -e

# Create data directory for Railway volume mounts if it doesn't exist
echo "📁 Setting up data directory..."
mkdir -p /app/data

# Ensure directory has write permissions (Railway volumes may have restrictive permissions)
# Try multiple permission levels
chmod 777 /app/data 2>/dev/null || chmod 755 /app/data 2>/dev/null || true

# Test write access
if touch /app/data/.test_write 2>/dev/null; then
    rm -f /app/data/.test_write
    echo "✅ Data directory is writable: /app/data"
    # Default DATABASE_URL to the volume-backed path if not already set
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="sqlite:////app/data/quiz_database.db"
        echo "ℹ️  DATABASE_URL not set. Defaulting to $DATABASE_URL"
    fi
else
    echo "⚠️  Warning: /app/data may not be writable"
    echo "Directory info:"
    ls -ld /app/data || true
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Cannot write to /app/data and DATABASE_URL not provided. Exiting."
        exit 1
    else
        echo "⚠️ DATABASE_URL already provided, continuing with its value."
    fi
fi

echo "🚀 Running database migrations..."
python run_migration.py

# Use Railway's PORT environment variable if available, otherwise default to 8000
PORT=${PORT:-8000}

echo "✅ Starting application server on port $PORT..."
exec gunicorn backend.api:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT


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
else
    echo "⚠️  Warning: /app/data may not be writable"
    echo "Directory info:"
    ls -ld /app/data || true
    echo "Trying to create database in current directory as fallback..."
    # Set fallback database path
    export DATABASE_URL="sqlite:///quiz_database.db"
fi

echo "🚀 Running database migrations..."
python run_migration.py

# Use Railway's PORT environment variable if available, otherwise default to 8000
PORT=${PORT:-8000}

echo "✅ Starting application server on port $PORT..."
exec gunicorn backend.api:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT


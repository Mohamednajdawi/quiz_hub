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
    chmod 777 /app/data 2>/dev/null || true
    # Default DATABASE_URL to the volume-backed path if not already set
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="sqlite:///app/data/quiz_database.db"
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

# Ensure the SQLite database path exists and is writable
python <<'PY'
import os
import pathlib
from urllib.parse import urlparse

database_url = os.environ.get("DATABASE_URL", "")
if database_url.startswith("sqlite"):
    parsed = urlparse(database_url)
    if parsed.scheme != "sqlite":
        raise SystemExit(0)

    # Handle sqlite:///absolute/path or sqlite:///relative/path
    # SQLite URLs: sqlite:///path (3 slashes) or sqlite:////path (4 slashes) both work
    if parsed.netloc and parsed.netloc != "":
        db_path = f"{parsed.netloc}{parsed.path}"
    else:
        db_path = parsed.path
    
    # Normalize any double slashes at the start (from sqlite:////path)
    if db_path.startswith("//"):
        db_path = db_path[1:]

    if not db_path:
        raise SystemExit("DATABASE_URL points to SQLite but has no path component.")

    # Normalise relative paths
    if not db_path.startswith("/"):
        db_path = os.path.abspath(db_path)

    db_file = pathlib.Path(db_path)
    try:
        db_file.parent.mkdir(parents=True, exist_ok=True)
    except PermissionError as exc:
        raise SystemExit(f"❌ Unable to create directory for database at {db_file.parent}: {exc}")

    try:
        db_file.touch(exist_ok=True)
    except PermissionError as exc:
        raise SystemExit(f"❌ Unable to create or touch database file at {db_file}: {exc}")

    print(f"✅ SQLite database verified at {db_file}")
PY

echo "🚀 Running database migrations..."
python run_migration.py

# Use Railway's PORT environment variable if available, otherwise default to 8000
PORT=${PORT:-8000}

echo "✅ Starting application server on port $PORT..."
# Set timeout to 300 seconds (5 minutes) to handle long-running quiz generation from PDFs
exec gunicorn backend.api:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300


FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Make startup script executable (before switching to non-root user)
RUN chmod +x start.sh

# Create a non-root user and switch to it for security
RUN useradd -m appuser
# Create data directory for Railway volume mounts with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application (with migrations)
CMD ["./start.sh"] 
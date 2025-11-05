# Docker Setup Guide

This guide explains how to build and run the Quiz Frontend application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)

## Building the Docker Image

### Option 1: Using Docker directly

```bash
# Build the image
docker build -t quiz-frontend .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  quiz-frontend
```

### Option 2: Using Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

## Environment Variables

The following environment variables can be configured:

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NODE_ENV` - Node environment (default: production)
- `PORT` - Port to run on (default: 3000)

### Example with custom environment variables:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  -e PORT=3000 \
  quiz-frontend
```

## Production Deployment

### Multi-stage Build

The Dockerfile uses a multi-stage build process:

1. **Dependencies Stage**: Installs npm dependencies
2. **Builder Stage**: Builds the Next.js application
3. **Runner Stage**: Creates a minimal production image with only necessary files

### Image Optimization

- Uses Alpine Linux for smaller image size
- Standalone Next.js output for minimal runtime requirements
- Non-root user for security
- Only copies necessary files to final image

### Health Checks

The docker-compose.yml includes a health check that verifies the application is running correctly.

## Troubleshooting

### Build fails with "standalone output not found"

Make sure `next.config.ts` has `output: 'standalone'` enabled. This is required for the Docker build.

### Port already in use

Change the port mapping:
```bash
docker run -p 3001:3000 quiz-frontend
```

### Cannot connect to backend API

1. Ensure the backend is running and accessible
2. Check the `NEXT_PUBLIC_API_URL` environment variable
3. If backend is in a different Docker network, use Docker networking or service names

### Permission issues

The container runs as a non-root user (nextjs:nodejs). If you encounter permission issues, check file ownership in the container.

## Development vs Production

### Development

For development, it's recommended to run locally:
```bash
npm run dev
```

### Production

For production, use Docker:
```bash
docker build -t quiz-frontend .
docker run -p 3000:3000 quiz-frontend
```

## Docker Compose with Backend

If you want to run both frontend and backend together:

```yaml
version: '3.8'

services:
  backend:
    # ... your backend configuration
    ports:
      - "8000:8000"
  
  frontend:
    build: ./quiz_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
```

## Image Size

The final image size should be around 150-200MB (Alpine-based). To check:
```bash
docker images quiz-frontend
```


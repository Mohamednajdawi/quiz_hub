# Railway CLI Deployment Guide

## Prerequisites

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

## Step-by-Step Deployment

### 1. Initialize Railway Project

```bash
# From project root
railway init
```

This will:
- Create a new Railway project (or link to existing)
- Ask for project name
- Generate `railway.json` if needed

### 2. Deploy Backend Service

```bash
cd quiz_backend

# Link to Railway project (if not already linked)
railway link

# Set required environment variables
railway variables set OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set other backend variables
railway variables set PORT=8000
railway variables set DEBUG=False

# Deploy
railway up
```

**Important**: Railway will auto-detect the Dockerfile in `quiz_backend/`

### 3. Get Backend URL

After deployment, get your backend URL:

```bash
# Get the service URL
railway domain

# Or check in dashboard
railway open
```

Copy the URL (e.g., `https://quiz-backend-production.up.railway.app`)

### 4. Set Up Database Volume (Backend)

For SQLite persistence, you need to add a volume:

```bash
# This needs to be done via Railway dashboard or CLI
railway volume create --mount /app/quiz_database.db
```

Or via dashboard:
1. Go to your backend service
2. Settings → Volumes
3. Create volume, mount at `/app/quiz_database.db`

### 5. Deploy Frontend Service

```bash
# From project root, create new service for frontend
cd quiz_frontend

# Create new service in same project
railway service create frontend

# Link to the service
railway link

# Set frontend environment variable (use your backend URL from step 3)
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app

# Deploy
railway up
```

### 6. Get Frontend URL

```bash
railway domain
```

Or generate a public domain:
```bash
railway domain --generate
```

## Useful Railway CLI Commands

### View Logs
```bash
railway logs
railway logs --follow  # Follow logs in real-time
```

### Check Status
```bash
railway status
```

### View Environment Variables
```bash
railway variables
```

### Open in Browser
```bash
railway open
```

### Run Commands in Service
```bash
railway run python --version  # Backend
railway run node --version    # Frontend
```

### View Service Info
```bash
railway service
```

## Complete Deployment Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

echo "📦 Deploying Backend..."
cd quiz_backend
railway link
railway variables set OPENAI_API_KEY=${OPENAI_API_KEY:-"your_key_here"}
railway up

echo "⏳ Waiting for backend to deploy..."
sleep 10

BACKEND_URL=$(railway domain | grep -o 'https://[^ ]*' | head -1)
echo "✅ Backend deployed at: $BACKEND_URL"

echo "📦 Deploying Frontend..."
cd ../quiz_frontend
railway service create frontend 2>/dev/null || railway link
railway variables set NEXT_PUBLIC_API_URL=$BACKEND_URL
railway up

FRONTEND_URL=$(railway domain | grep -o 'https://[^ ]*' | head -1)
echo "✅ Frontend deployed at: $FRONTEND_URL"

echo "🎉 Deployment complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
```

## Troubleshooting

### Service not found
```bash
railway service list
railway service create <name>
railway link
```

### Wrong directory
```bash
railway unlink
cd correct_directory
railway link
```

### View deployment logs
```bash
railway logs --deployment
```

### Redeploy
```bash
railway up --detach
```

## Quick Reference

```bash
# Login
railway login

# Initialize project
railway init

# Deploy backend
cd quiz_backend
railway link
railway variables set OPENAI_API_KEY=your_key
railway up

# Deploy frontend
cd ../quiz_frontend
railway service create frontend
railway link
railway variables set NEXT_PUBLIC_API_URL=https://backend-url
railway up

# View logs
railway logs --follow

# Open dashboard
railway open
```


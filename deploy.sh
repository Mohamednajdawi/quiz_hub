#!/bin/bash

# Railway CLI Deployment Script
# This script deploys both backend and frontend services to Railway

set -e

echo "🚀 Railway Deployment Script"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found."
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "⚠️  Not logged in to Railway."
    echo "Please run: railway login"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set in environment."
    read -p "Enter your OpenAI API key: " OPENAI_API_KEY
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ OpenAI API key is required"
        exit 1
    fi
fi

# Initialize Railway project if needed
if [ ! -f "railway.json" ]; then
    echo "📦 Initializing Railway project..."
    railway init --name quiz-hub || true
fi

echo ""
echo "📦 Step 1: Deploying Backend..."
echo "================================"
cd quiz_backend

# Link to Railway project
echo "Linking backend service..."
railway link 2>/dev/null || railway service create backend

# Set environment variables
echo "Setting environment variables..."
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
railway variables set PORT=8000
railway variables set DEBUG=False

# Deploy
echo "Deploying backend..."
railway up --detach

echo "⏳ Waiting for backend deployment..."
sleep 15

# Get backend URL
BACKEND_URL=$(railway domain 2>/dev/null | head -1 | xargs)
if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Could not get backend URL automatically."
    echo "Please check Railway dashboard and enter backend URL:"
    read -p "Backend URL: " BACKEND_URL
else
    echo "✅ Backend URL: $BACKEND_URL"
fi

cd ..

echo ""
echo "📦 Step 2: Deploying Frontend..."
echo "================================="
cd quiz_frontend

# Create or link frontend service
echo "Linking frontend service..."
railway service create frontend 2>/dev/null || railway link

# Set environment variable
echo "Setting NEXT_PUBLIC_API_URL..."
railway variables set NEXT_PUBLIC_API_URL="$BACKEND_URL"

# Deploy
echo "Deploying frontend..."
railway up --detach

echo "⏳ Waiting for frontend deployment..."
sleep 15

# Get frontend URL
FRONTEND_URL=$(railway domain 2>/dev/null | head -1 | xargs)
if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  Could not get frontend URL automatically."
    echo "Please check Railway dashboard."
else
    echo "✅ Frontend URL: $FRONTEND_URL"
fi

cd ..

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "⚠️  Important: Don't forget to:"
echo "1. Add volume for database persistence (Railway dashboard → Backend service → Volumes)"
echo "2. Mount volume at: /app/quiz_database.db"
echo "3. Update CORS in backend to allow only your frontend domain (for production)"
echo ""
echo "View logs: railway logs --follow"
echo "Open dashboard: railway open"


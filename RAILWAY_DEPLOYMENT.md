# Railway Deployment Guide

## 📋 Overview

This application consists of **2 services** that need to be deployed:
1. **Backend API** (FastAPI/Python) - Port 8000
2. **Frontend** (Next.js/React) - Port 3000

## 🚀 Quick Start

### Option 1: Deploy via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy backend
cd quiz_backend
railway up

# Deploy frontend (in new terminal)
cd quiz_frontend
railway up
```

### Option 2: Deploy via Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add 2 services:
   - Backend: Connect GitHub repo, set root directory to `quiz_backend`
   - Frontend: Connect GitHub repo, set root directory to `quiz_frontend`

## 📦 What Gets Deployed

### Backend Service (`quiz_backend/`)
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **Port**: 8000
- **Database**: SQLite (file-based, persisted via Railway volumes)
- **Start Command**: Runs `start.sh` which executes migrations then starts Gunicorn

### Frontend Service (`quiz_frontend/`)
- **Runtime**: Node.js 20
- **Framework**: Next.js 16
- **Port**: 3000
- **Build**: Static + Server-side rendering
- **Start Command**: `npm start` (after build)

## 🔧 Required Environment Variables

### Backend Environment Variables

#### Required:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

#### Optional (with defaults):
```bash
DATABASE_URL=sqlite:///quiz_database.db
HOST=0.0.0.0
PORT=8000
DEBUG=False
OPENAI_MODEL=gpt-4.1-2025-04-14  # Optional: override model
ENABLE_RATE_LIMITING=true
```

#### Payment Integration (if using Stripe):
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id
```

#### Firebase Auth (if using):
```bash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
```

### Frontend Environment Variables

#### Required:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

**Note**: Replace `your-backend-service.railway.app` with your actual Railway backend URL after deployment.

## 📝 Step-by-Step Deployment

### 1. Prepare Your Repository
- Ensure all code is committed and pushed to GitHub
- Verify Dockerfiles are present in both `quiz_backend/` and `quiz_frontend/`

### 2. Deploy Backend

#### Via Railway Dashboard:
1. Create new project in Railway
2. Click "New Service" → "GitHub Repo"
3. Select your repository
4. **Important**: Set **Root Directory** to `quiz_backend`
5. Railway will auto-detect Python and use the Dockerfile
6. Add environment variables (see above)
7. Deploy

#### Via Railway CLI:
```bash
cd quiz_backend
railway init
railway link  # Link to existing project or create new
railway variables set OPENAI_API_KEY=your_key_here
railway up
```

### 3. Get Backend URL
After backend deploys:
1. Go to backend service settings
2. Generate a public domain (or use Railway's auto-generated URL)
3. Copy the URL (e.g., `https://quiz-backend-production.up.railway.app`)

### 4. Deploy Frontend

#### Via Railway Dashboard:
1. In the same Railway project, click "New Service"
2. Select "GitHub Repo" → same repository
3. **Important**: Set **Root Directory** to `quiz_frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
5. Deploy

#### Via Railway CLI:
```bash
cd quiz_frontend
railway init
railway link  # Link to same project
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
railway up
```

### 5. Configure Database Persistence (Backend)

SQLite database needs persistent storage:
1. Go to backend service → Settings → Volumes
2. Create new volume
3. Mount path: `/app/quiz_database.db`
4. This ensures database persists across deployments

### 6. Set Up Custom Domains (Optional)

#### Backend:
1. Service → Settings → Domains
2. Add custom domain or use Railway's generated domain

#### Frontend:
1. Service → Settings → Domains
2. Add custom domain (e.g., `app.yourdomain.com`)
3. Update `NEXT_PUBLIC_API_URL` to point to your backend domain

## 🔍 Verification Checklist

- [ ] Backend service is running (check `/health` endpoint)
- [ ] Frontend service is running
- [ ] Frontend can connect to backend (check browser console)
- [ ] Database volume is mounted (backend)
- [ ] All environment variables are set
- [ ] OpenAI API key is configured
- [ ] CORS is configured (backend allows frontend origin)

## 🐛 Troubleshooting

### Backend Issues:
- **Port conflicts**: Railway auto-assigns `PORT` env var, ensure your app uses `os.getenv('PORT', '8000')`
- **Database not persisting**: Ensure volume is mounted at `/app/quiz_database.db`
- **Migrations failing**: Check logs, ensure Alembic is configured correctly

### Frontend Issues:
- **API connection errors**: Verify `NEXT_PUBLIC_API_URL` matches backend URL
- **Build failures**: Check Node.js version (should be 20)
- **CORS errors**: Ensure backend CORS allows frontend origin

### Common Railway Issues:
- **Build timeout**: Increase build timeout in service settings
- **Memory limits**: Upgrade plan if hitting memory limits
- **Cold starts**: Consider using Railway's always-on option

## 📊 Monitoring

Railway provides:
- Real-time logs
- Metrics (CPU, Memory, Network)
- Deployment history
- Error tracking

Access via Railway dashboard → Your Service → Metrics/Logs

## 🔄 Continuous Deployment

Railway auto-deploys on:
- Push to main/master branch (if connected to GitHub)
- Manual deployments via CLI or dashboard

To disable auto-deploy:
- Service → Settings → Source → Disable auto-deploy

## 💰 Cost Considerations

Railway pricing:
- **Hobby Plan**: $5/month + usage-based pricing
- **Pro Plan**: $20/month + usage-based pricing

**Tips to reduce costs**:
- Use Railway's sleep feature for dev environments
- Optimize Docker images (multi-stage builds already implemented)
- Monitor OpenAI API usage (main cost driver)

## 🔐 Security Best Practices

1. **Never commit secrets**: Use Railway environment variables
2. **Use production Stripe keys**: Switch from test to live keys
3. **Enable HTTPS**: Railway provides free SSL certificates
4. **Set CORS properly**: Restrict to your frontend domain in production
5. **Database backups**: Consider periodic backups of SQLite file

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🎯 Summary

**What to deploy:**
- ✅ Backend service from `quiz_backend/` directory
- ✅ Frontend service from `quiz_frontend/` directory

**Minimum required env vars:**
- Backend: `OPENAI_API_KEY`
- Frontend: `NEXT_PUBLIC_API_URL` (pointing to backend)

**Key points:**
- Use Railway volumes for database persistence
- Set root directories correctly (`quiz_backend` and `quiz_frontend`)
- Update frontend API URL after backend deployment
- Both services auto-deploy from GitHub


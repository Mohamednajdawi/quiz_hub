# 🚀 Railway Deployment Summary

## Quick Overview

**What needs to be deployed:** 2 services
1. **Backend** (Python/FastAPI) - `quiz_backend/` directory
2. **Frontend** (Next.js/React) - `quiz_frontend/` directory

## Essential Information

### Backend Service
- **Location**: `quiz_backend/`
- **Port**: 8000 (Railway will auto-assign via `PORT` env var)
- **Database**: SQLite (needs Railway volume for persistence)
- **Required Env Var**: `OPENAI_API_KEY`
- **Start Command**: `./start.sh` (runs migrations then starts server)

### Frontend Service
- **Location**: `quiz_frontend/`
- **Port**: 3000
- **Required Env Var**: `NEXT_PUBLIC_API_URL` (must point to backend URL)
- **Build**: Automatic via Dockerfile

## Minimum Setup Steps

1. **Deploy Backend**
   - Root directory: `quiz_backend`
   - Set env: `OPENAI_API_KEY=your_key`
   - Add volume: `/app/quiz_database.db` (for database persistence)

2. **Get Backend URL**
   - Copy Railway-generated URL (e.g., `https://backend-production.up.railway.app`)

3. **Deploy Frontend**
   - Root directory: `quiz_frontend`
   - Set env: `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app`

4. **Done!** ✅

## Environment Variables Quick Reference

### Backend (Required)
```
OPENAI_API_KEY=sk-...
```

### Backend (Optional)
```
PORT=8000                    # Auto-set by Railway
DATABASE_URL=sqlite:///...   # Default works
OPENAI_MODEL=gpt-4.1-2025-04-14
```

### Frontend (Required)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Important Notes

⚠️ **Root Directories**: Must set `quiz_backend` and `quiz_frontend` as root directories in Railway

⚠️ **Database**: SQLite file needs Railway volume mounted at `/app/quiz_database.db`

⚠️ **CORS**: Backend currently allows all origins (`*`). For production, restrict to your frontend domain.

⚠️ **Port**: Railway auto-assigns `PORT` env var. Backend now uses it (updated in `start.sh`).

## Cost Estimate

- **Hobby Plan**: ~$5-15/month (depending on usage)
- Main cost: OpenAI API calls (not Railway)
- Railway provides generous free tier for testing

## Full Documentation

See `RAILWAY_DEPLOYMENT.md` for complete deployment guide with troubleshooting, security tips, and advanced configuration.


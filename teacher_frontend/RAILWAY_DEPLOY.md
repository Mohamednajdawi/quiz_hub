# Railway Deployment Guide for Teacher Frontend

## Prerequisites
- Railway account
- Railway CLI (optional, can use web interface)

## Important: Root Directory Configuration

**CRITICAL**: When deploying to Railway, you MUST set the **Root Directory** to `teacher_frontend` in the Railway service settings. This tells Railway where to find the Dockerfile.

## Deployment Steps

### 1. Environment Variables
Set the following environment variable in Railway:
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-api.railway.app`)

### 2. Deploy via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or upload code)
4. **IMPORTANT**: After selecting your repo, go to the service settings
5. Under **Settings** → **Root Directory**, set it to: `teacher_frontend`
6. Railway will now find the Dockerfile at `teacher_frontend/Dockerfile`
7. Add the environment variable `NEXT_PUBLIC_API_URL` in the **Variables** tab
8. Deploy!

### 3. Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project (from repo root)
railway init

# Link to existing project (if needed)
railway link

# Set root directory (if deploying from repo root)
railway variables set RAILWAY_ROOT_DIRECTORY=teacher_frontend

# Set environment variable
railway variables set NEXT_PUBLIC_API_URL=https://your-api.railway.app

# Deploy
railway up
```

## Dockerfile Location

The Dockerfile is located at: `teacher_frontend/Dockerfile`

Railway will look for the Dockerfile relative to the **Root Directory** you set:
- If Root Directory = `teacher_frontend` → looks for `Dockerfile` ✅
- If Root Directory = `.` (repo root) → looks for `teacher_frontend/Dockerfile` ❌ (won't work with current setup)

## Configuration Files

- `Dockerfile` - Multi-stage Docker build for optimized production image
- `.dockerignore` - Files to exclude from Docker build
- `railway.json` - Railway-specific configuration
- `next.config.ts` - Next.js config with standalone output enabled

## Port Configuration

The app runs on port 3000 by default. Railway will automatically assign a port and expose it via the `PORT` environment variable. The Dockerfile is configured to use the `PORT` environment variable.

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (20) is compatible
- Check build logs in Railway dashboard

### App Won't Start
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that the API URL is accessible
- Review Railway logs for errors

### Can't Find Dockerfile
- Ensure Dockerfile is in the `teacher_frontend` directory
- Check that Railway is pointing to the correct directory
- Verify the file is committed to git

## Notes

- The Dockerfile uses multi-stage builds for smaller image size
- Standalone output is enabled in `next.config.ts` for optimal Docker deployment
- The app will automatically use the `PORT` environment variable from Railway

# Fix Frontend Backend URL

## Problem
Frontend is using `http://localhost:8000` instead of your deployed backend.

## Solution: Set Environment Variable

### Option 1: Via Railway Dashboard (Easiest)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **frontend service**
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://quizhub-production-1ddf.up.railway.app`
6. Click **Add**
7. **Important**: Redeploy the frontend service (Railway will auto-redeploy when you add variables, or click "Redeploy" button)

### Option 2: Via Railway CLI

```bash
cd quiz_frontend
railway link  # Make sure you're linked to the frontend service
railway variables set NEXT_PUBLIC_API_URL=https://quizhub-production-1ddf.up.railway.app
railway up  # Redeploy
```

## Why This Happens

Next.js environment variables prefixed with `NEXT_PUBLIC_` are embedded at **build time**, not runtime. This means:

1. ✅ The variable must be set **before** building
2. ✅ If you set it after deployment, you need to **redeploy** (rebuild)
3. ✅ Railway will automatically rebuild when you add/modify variables

## Verify It's Working

After redeploying:

1. Open your frontend URL in browser
2. Open browser DevTools (F12) → Console
3. Try to login or make any API call
4. Check Network tab - requests should go to `https://quizhub-production-1ddf.up.railway.app` not `localhost:8000`

## Quick Fix Command

```bash
cd quiz_frontend
railway variables set NEXT_PUBLIC_API_URL=https://quizhub-production-1ddf.up.railway.app
railway up
```

This will:
1. Set the environment variable
2. Trigger a rebuild and redeploy
3. Frontend will now use the correct backend URL


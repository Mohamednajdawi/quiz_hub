# Fix Database Volume Mount Issue

## Problem
Railway error: "Cannot mount volume to `/app/quiz_database.db` because it is a file in the container."

## Solution
Railway volumes must mount to a **directory**, not a file. We've updated the code to use `/app/data/` directory.

## Steps to Fix

### 1. Update Railway Volume Mount

In Railway Dashboard:
1. Go to your **backend service**
2. Settings → **Volumes**
3. If you have a volume mounted to `/app/quiz_database.db`, **remove it**
4. Create new volume:
   - **Mount Path**: `/app/data` (directory, not file)
   - **Size**: 1GB (or as needed)

### 2. Set Environment Variable (Optional but Recommended)

In Railway Dashboard → Backend Service → Variables:
```
DATABASE_URL=sqlite:////app/data/quiz_database.db
```

### 3. Redeploy Backend

The code has been updated to automatically use `/app/data/quiz_database.db` when the `/app/data` directory exists.

## What Changed

- Database path now uses `/app/data/quiz_database.db` when `/app/data` exists
- Falls back to default location for local development
- Works with Railway volume mounts

## Verify

After redeploying:
1. Check logs - should see migrations running successfully
2. Database file will be created at `/app/data/quiz_database.db`
3. Data will persist across deployments


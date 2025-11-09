# Railway Volume Mount Fix - Quick Guide

## ✅ Code Changes Made

1. **Database path updated** to use `/app/data/quiz_database.db`
2. **Startup script** creates `/app/data` directory if needed
3. **Dockerfile** creates `/app/data` directory with proper permissions

## 🔧 Railway Configuration Steps

### 1. Remove Old Volume (if exists)
In Railway Dashboard → Backend Service → Settings → Volumes:
- Remove any volume mounted to `/app/quiz_database.db` (file path)

### 2. Create New Volume
1. Go to **Volumes** tab
2. Click **+ New Volume**
3. **Mount Path**: `/app/data` (directory, not file)
4. **Size**: 1GB (or adjust as needed)
5. Click **Create**

### 3. Optional: Set Environment Variable
In **Variables** tab, add:
```
DATABASE_URL=sqlite:////app/data/quiz_database.db
```

### 4. Redeploy
The backend will automatically:
- Create `/app/data` directory if it doesn't exist
- Use `/app/data/quiz_database.db` for the database
- Persist data across deployments via the volume

## ✅ Verification

After redeploying, check logs:
- Should see: "📁 Creating /app/data directory..." (if needed)
- Migrations should run successfully
- Database file will be at `/app/data/quiz_database.db`

## 📝 Summary

**Before**: Tried to mount volume to file `/app/quiz_database.db` ❌  
**After**: Mount volume to directory `/app/data`, database at `/app/data/quiz_database.db` ✅

The code now automatically detects if `/app/data` exists and uses it, otherwise falls back to default location for local development.


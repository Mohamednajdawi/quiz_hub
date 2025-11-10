# Railway Volume Mount Fix - Quick Guide

## ✅ Code Changes Made

1. **Database path** now defaults to `/app/data/quiz_database.db` (or whatever you set via env var)
2. **Startup script** creates `/app/data` directory if needed and aborts if it cannot write to it
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

### 3. Set Environment Variables

In **Variables** tab, add (or confirm):

```
DATABASE_URL=sqlite:////app/data/quiz_database.db
# Optional: override explicit SQLite path if you prefer not to set DATABASE_URL
# DATABASE_SQLITE_PATH=/app/data/quiz_database.db
# Optional: PDF storage directory (defaults to the same volume)
# PDF_STORAGE_DIR=/app/data/student_project_pdfs
```

### 4. Redeploy

The backend will automatically:

- Create `/app/data` directory if it doesn't exist
- Validate the directory is writable (fails fast if not)
- Use `/app/data/quiz_database.db` for the database
- Persist PDFs and database across deployments via the volume

## ✅ Verification

After redeploying, check logs:

- Should see: "📁 Creating /app/data directory..." (if needed)
- Migrations should run successfully
- Database file will be at `/app/data/quiz_database.db`

## 📝 Summary

**Before**: Tried to mount volume to file `/app/quiz_database.db` ❌  
**After**: Mount volume to directory `/app/data`, database at `/app/data/quiz_database.db` ✅

> ℹ️ If `/app/data` is not writable and you haven't provided `DATABASE_URL`, the backend now stops during startup instead of silently writing to ephemeral storage. This prevents losing projects on redeploys.

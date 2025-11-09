# Fix Database Permissions Issue

## Problem
`unable to open database file` - The `/app/data` directory exists but isn't writable.

## Root Cause
Railway volumes may mount with restrictive permissions that prevent the `appuser` from writing files.

## Solution Applied

1. **Updated startup script** to:
   - Create `/app/data` directory if it doesn't exist
   - Set permissions (777 or 755)
   - Test write access
   - Fallback to current directory if not writable

2. **Updated database path logic** to:
   - Check if `/app/data` exists AND is writable
   - Fallback to current directory if not writable

3. **Updated Dockerfile** to:
   - Create `/app/data` with 777 permissions

## Alternative: Use Environment Variable

If volume permissions can't be fixed, you can set:

```
DATABASE_URL=sqlite:///quiz_database.db
```

This will use the current directory instead of the volume.

## Railway Volume Permissions

Railway volumes should be writable by default, but if issues persist:

1. **Remove and recreate the volume** in Railway dashboard
2. **Check volume mount path** is `/app/data` (directory, not file)
3. **Try without volume first** to verify the app works, then add volume back

## Verification

After redeploying, check logs for:
- `✅ Data directory is writable: /app/data` - Good!
- `⚠️ Warning: /app/data may not be writable` - Will use fallback

The app will work either way, but with the volume it will persist data across deployments.


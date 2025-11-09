# Deploy Frontend to Railway

## Your Backend URL
```
https://quizhub-production-1ddf.up.railway.app
```

## Steps to Deploy Frontend

### 1. Navigate to Frontend Directory
```bash
cd quiz_frontend
```

### 2. Link to Railway Project
```bash
railway link
```
- Select your existing project (the same one where backend is deployed)
- If prompted, create a new service called "frontend"

### 3. Set Environment Variable
```bash
railway variables set NEXT_PUBLIC_API_URL=https://quizhub-production-1ddf.up.railway.app
```

### 4. Deploy
```bash
railway up
```

### 5. Get Frontend URL
After deployment completes:
```bash
railway domain
```

Or generate a public domain:
```bash
railway domain --generate
```

## Verify Deployment

1. Check frontend is running: Visit the frontend URL
2. Check backend connection: Open browser console, should see API calls to backend
3. Test login/registration: Should work if backend is properly configured

## Important: Database Volume

Don't forget to add a volume for the backend database:

1. Go to Railway dashboard
2. Select your backend service
3. Go to Settings → Volumes
4. Create new volume
5. Mount path: `/app/quiz_database.db`

This ensures your database persists across deployments.

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running (check logs: `railway logs`)
- Check CORS settings in backend (currently allows all origins)

### Build fails
- Check Node.js version (should be 20)
- Check Railway logs for specific errors

### Environment variable not working
- Rebuild frontend after setting env var: `railway up`
- Check variable is set: `railway variables`


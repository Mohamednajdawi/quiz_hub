#!/bin/bash
# Check Railway volumes for backend service

echo "Checking Railway volumes..."
echo ""
echo "To fix the volume issue:"
echo "1. Go to Railway Dashboard"
echo "2. Select your backend service"
echo "3. Go to Settings → Volumes"
echo "4. Remove any volume mounted to: /app/quiz_database.db"
echo "5. Create new volume with mount path: /app/data"
echo ""
echo "The code is already fixed - you just need to update the volume mount in Railway."


# Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with your GitHub account
3. Verify your email

## Step 2: Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your "resusync" repository
4. Select "Backend Service"

## Step 3: Configure Backend
### Root Directory
- Set to: `backend`

### Environment Variables
Add these in Railway dashboard:
```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://resumesync-user:resumesync@resumesync.6gbymr5.mongodb.net/resumesync?retryWrites=true&w=majority&appName=resumesync
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
FRONTEND_URL=https://resusync.me
```

## Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Copy the generated URL (e.g., https://resusync-backend-production.railway.app)

## Step 5: Custom Domain (Optional)
- In Railway project settings
- Add custom domain if needed for API
# Vercel Deployment Guide

## Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Import your "resusync" project

## Step 2: Configure Frontend
### Project Settings
- Framework Preset: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Environment Variables
Add in Vercel dashboard:
```
VITE_API_URL=https://your-railway-backend-url.railway.app
```
(Replace with your actual Railway backend URL)

## Step 3: Deploy
- Click "Deploy"
- Wait for build to complete
- You'll get a URL like: https://resusync-xyz.vercel.app

## Step 4: Connect Custom Domain
1. Go to Project Settings → Domains
2. Add domain: `resusync.me`
3. Add domain: `www.resusync.me`
4. Follow Vercel's DNS instructions
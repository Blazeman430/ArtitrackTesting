# Deployment Guide - Artitrack

This guide will walk you through deploying your Laravel backend to Railway and your React frontend to Vercel.

## Prerequisites

- GitHub account with your code pushed to a repository
- Railway account (sign up at https://railway.app)
- Vercel account (sign up at https://vercel.com)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository: `ArtitrackTesting`
6. **IMPORTANT**: Railway will detect the monorepo structure with `railway.json` and `nixpacks.toml` at the root
7. The configuration automatically points to the `backend/` directory

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a database and set environment variables

### Step 3: Configure Environment Variables

In your Railway backend service, go to **"Variables"** tab and add these:

```bash
# Application
APP_NAME=Artitrack
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend-app.railway.app  # Update after deployment

# Generate a new key: Run `php artisan key:generate --show` locally
APP_KEY=base64:YOUR_GENERATED_KEY_HERE

# Database (Railway auto-fills these from PostgreSQL service)
DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# CORS - Add your Vercel frontend URL after frontend deployment
FRONTEND_URL=https://artitrack-testing.vercel.app/

# Optional: Redis (if you add Redis service)
# REDIS_HOST=${{Redis.REDIS_HOST}}
# REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
# REDIS_PORT=${{Redis.REDIS_PORT}}
```

### Step 4: Deploy Backend

1. Railway will automatically deploy after you set variables
2. Wait for deployment to complete (check Deployments tab)
3. Once deployed, click on your service to get the public URL
4. Copy this URL - you'll need it for frontend configuration
5. Update the `APP_URL` variable with your actual Railway URL

### Step 5: Verify Backend Deployment

Visit your Railway URL in a browser. You should see your Laravel application running.

Test API endpoint: `https://your-backend-app.railway.app/api/health` (if you have one)

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com and log in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `ArtitrackTesting`
4. Vercel will auto-detect it's a Create React App

### Step 2: Configure Build Settings

In the import screen:

- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `build` (default)

### Step 3: Configure Environment Variables

Before deploying, add this environment variable:

```bash
REACT_APP_API_BASE=https://your-backend-app.railway.app
```

Replace `your-backend-app.railway.app` with your actual Railway backend URL from Part 1.

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, Vercel will give you a URL like: `https://your-app.vercel.app`

### Step 5: Update Backend CORS

Now that you have your Vercel URL, go back to Railway:

1. Open your backend service
2. Go to **"Variables"** tab
3. Update `FRONTEND_URL` with your Vercel URL:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Railway will automatically redeploy

---

## Part 3: Testing the Connection

### Test Backend API

1. Open your browser console (F12)
2. Visit your Vercel frontend URL
3. Check the Network tab for API calls
4. Verify requests are going to your Railway backend URL
5. Check for any CORS errors (there should be none)

### Test Authentication Flow

If your app uses authentication:

1. Try logging in from the frontend
2. Check that cookies are being set
3. Verify API calls include credentials
4. Test protected routes

### Common Issues & Solutions

#### CORS Errors
- **Problem**: "Access-Control-Allow-Origin" error
- **Solution**: Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly (including https://)

#### 500 Server Errors
- **Problem**: Backend returns 500 errors
- **Solution**: Check Railway logs (Deployments → View Logs)
- Common causes: Missing `APP_KEY`, database connection issues

#### Environment Variables Not Working
- **Problem**: Frontend can't connect to backend
- **Solution**: 
  - Ensure `REACT_APP_API_BASE` is set in Vercel
  - Redeploy frontend after changing variables
  - Check browser console for the actual API URL being used

#### Database Connection Failed
- **Problem**: Backend can't connect to database
- **Solution**: 
  - Verify PostgreSQL service is running in Railway
  - Check database variables are correctly referenced
  - Ensure migrations ran successfully

---

## Part 4: Custom Domains (Optional)

### Add Custom Domain to Railway (Backend)

1. In Railway project, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your custom domain (e.g., `api.yourdomain.com`)
4. Add the CNAME record to your DNS provider
5. Update `APP_URL` and redeploy

### Add Custom Domain to Vercel (Frontend)

1. In Vercel project, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow DNS configuration instructions
5. Update `FRONTEND_URL` in Railway backend

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_KEY` | Laravel encryption key | ✅ Yes |
| `APP_URL` | Your Railway backend URL | ✅ Yes |
| `DB_*` | Database credentials | ✅ Yes |
| `FRONTEND_URL` | Your Vercel frontend URL | ✅ Yes |
| `SESSION_DRIVER` | Session storage (database recommended) | ✅ Yes |

### Frontend (Vercel)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_BASE` | Your Railway backend URL | ✅ Yes |

---

## Monitoring & Logs

### Railway Logs
- Go to your service → **Deployments** → Click on a deployment → **View Logs**
- Monitor for errors, database queries, and API requests

### Vercel Logs
- Go to your project → **Deployments** → Click on a deployment → **Functions**
- Check build logs and runtime logs

---

## Continuous Deployment

Both Railway and Vercel support automatic deployments:

- **Railway**: Automatically deploys when you push to your main branch
- **Vercel**: Automatically deploys when you push to your main branch
- **Preview Deployments**: Vercel creates preview URLs for pull requests

---

## Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] Strong `APP_KEY` generated
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] HTTPS enabled (automatic on Railway & Vercel)
- [ ] Environment variables never committed to Git
- [ ] API rate limiting configured (if needed)

---

## Troubleshooting Commands

If you need to run commands on Railway:

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Run commands: `railway run php artisan migrate`

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Laravel Deployment**: https://laravel.com/docs/deployment

---

## Quick Reference URLs

After deployment, save these URLs:

- **Backend (Railway)**: `https://your-backend-app.railway.app`
- **Frontend (Vercel)**: `https://your-app.vercel.app`
- **Database**: Managed by Railway
- **GitHub Repo**: `https://github.com/Blazeman430/ArtitrackTesting`

---

## Next Steps After Deployment

1. Set up monitoring (Railway provides basic metrics)
2. Configure backups for your database
3. Set up error tracking (e.g., Sentry)
4. Configure email service if needed
5. Set up CI/CD pipelines for testing
6. Monitor performance and optimize as needed

Good luck with your deployment! 🚀

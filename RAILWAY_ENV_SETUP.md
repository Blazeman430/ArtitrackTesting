# Railway Environment Variables - CRITICAL SETUP

## 🚨 IMPORTANT: Required Environment Variables for Authentication

The 401 error you're experiencing is caused by missing environment variables in Railway. You MUST add these to your Railway backend service.

## Step-by-Step Setup

### 1. Go to Railway Dashboard
1. Open your Railway project
2. Click on your **backend service**
3. Go to the **Variables** tab

### 2. Add These CRITICAL Variables

Copy and paste these into Railway (update the URLs with your actual domains):

```bash
# ============================================
# CRITICAL: Session & Cookie Configuration
# ============================================

# Must be 'none' for cross-origin cookies
SESSION_SAME_SITE=none

# Must be 'true' for HTTPS (Railway uses HTTPS)
SESSION_SECURE_COOKIE=true

# Enable partitioned cookies for better security
SESSION_PARTITIONED_COOKIE=true

# Session domain - leave empty for Railway
SESSION_DOMAIN=

# ============================================
# CRITICAL: Sanctum Stateful Domains
# ============================================

# Add ALL domains that will access your API (comma-separated, NO SPACES)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,artitracktesting-production.up.railway.app,artitracktesting-proxy.up.railway.app

# ============================================
# CRITICAL: CORS Configuration
# ============================================

# Your frontend URL (update with your actual Vercel URL)
FRONTEND_URL=https://your-frontend-app.vercel.app

# ============================================
# Application Settings
# ============================================

APP_NAME=Artitrack
APP_ENV=production
APP_DEBUG=false
APP_URL=https://artitracktesting-production.up.railway.app

# Generate this locally: php artisan key:generate --show
APP_KEY=base64:YOUR_GENERATED_KEY_HERE

# ============================================
# Database (Railway auto-fills these)
# ============================================

DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# ============================================
# Session & Cache
# ============================================

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/

CACHE_STORE=database
QUEUE_CONNECTION=database
```

## 3. After Adding Variables

1. Railway will automatically redeploy
2. Wait 2-3 minutes for deployment to complete
3. Test your login again

## 4. Verify Configuration

After deployment, test these endpoints in your browser console:

```javascript
// 1. Test CSRF cookie endpoint
fetch('https://artitracktesting-production.up.railway.app/sanctum/csrf-cookie', {
  credentials: 'include'
}).then(r => console.log('CSRF:', r.status));

// 2. Check cookies were set
console.log('Cookies:', document.cookie);

// 3. Test login
fetch('https://artitracktesting-production.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '')
  },
  credentials: 'include',
  body: JSON.stringify({ email: 'your-test-email@sti.edu.ph' })
}).then(r => r.json()).then(console.log);
```

## 5. Common Issues & Solutions

### Issue: Still getting 401 errors
**Solution**: 
- Verify `SANCTUM_STATEFUL_DOMAINS` includes your exact domain (no https://, no trailing slash)
- Check Railway logs for any errors
- Ensure deployment completed successfully

### Issue: Cookies not being set
**Solution**:
- Verify `SESSION_SAME_SITE=none` is set
- Verify `SESSION_SECURE_COOKIE=true` is set
- Check browser console for cookie warnings

### Issue: CORS errors
**Solution**:
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Include https:// in the URL
- No trailing slash

## 6. How to Check Railway Logs

1. Go to your Railway backend service
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **View Logs**
5. Look for any errors related to sessions, CORS, or Sanctum

## 7. What Each Variable Does

| Variable | Purpose | Why It's Critical |
|----------|---------|-------------------|
| `SESSION_SAME_SITE=none` | Allows cookies to be sent cross-origin | Without this, browsers block cookies from different domains |
| `SESSION_SECURE_COOKIE=true` | Requires HTTPS for cookies | Required when `SameSite=none` |
| `SESSION_PARTITIONED_COOKIE=true` | Improves cookie security | Prevents cookie leaks in cross-site contexts |
| `SANCTUM_STATEFUL_DOMAINS` | Whitelist of allowed origins | Sanctum rejects requests from unlisted domains |
| `FRONTEND_URL` | CORS allowed origin | Laravel CORS middleware uses this |

## 8. Expected Authentication Flow

After proper configuration:

```
1. User visits login page
   └─> Frontend loads

2. User submits email
   └─> Frontend calls GET /sanctum/csrf-cookie
       └─> Backend sets XSRF-TOKEN cookie
       └─> Backend validates origin is in SANCTUM_STATEFUL_DOMAINS ✅

3. Frontend calls POST /api/auth/login with X-XSRF-TOKEN header
   └─> Backend validates CSRF token ✅
   └─> Backend validates origin ✅
   └─> Backend creates session ✅
   └─> Backend returns user data ✅

4. Frontend calls GET /api/auth/me
   └─> Backend validates session cookie ✅
   └─> Backend returns user data ✅
```

## 9. Quick Checklist

Before testing, verify:

- [ ] All environment variables added to Railway
- [ ] Railway deployment completed successfully (green checkmark)
- [ ] No errors in Railway logs
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Testing in incognito/private window (recommended)

## 10. Still Not Working?

If you've done everything above and still get 401 errors:

1. **Check the actual domain being used**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look at the request URL
   - Copy the exact domain (without https://)
   - Add it to `SANCTUM_STATEFUL_DOMAINS`

2. **Check Railway logs for specific errors**:
   - Look for "CSRF token mismatch"
   - Look for "Unauthenticated"
   - Look for "Origin not allowed"

3. **Verify your frontend is sending credentials**:
   - Check Network tab
   - Click on the failed request
   - Look at Request Headers
   - Verify `Cookie` header is present
   - Verify `X-XSRF-TOKEN` header is present

## Need Help?

If you're still stuck after following this guide:
1. Share your Railway logs
2. Share the Network tab screenshot showing the failed request
3. Share the exact error message from browser console

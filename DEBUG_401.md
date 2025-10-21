# Debug 401 Error - Step by Step

## Quick Diagnostic Commands

Open your browser console (F12) and run these commands one by one:

### Step 1: Test CSRF Cookie Endpoint
```javascript
fetch('https://artitracktesting-production.up.railway.app/sanctum/csrf-cookie', {
  credentials: 'include'
}).then(r => {
  console.log('CSRF Status:', r.status);
  console.log('CSRF Headers:', Object.fromEntries(r.headers.entries()));
});
```
**Expected:** Status 204, Set-Cookie headers

### Step 2: Check Cookies Were Set
```javascript
console.log('All Cookies:', document.cookie);
console.log('XSRF Token:', document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1]);
console.log('Session Cookie:', document.cookie.match(/laravel_session=([^;]+)/)?.[1]);
```
**Expected:** Both XSRF-TOKEN and laravel_session cookies

### Step 3: Test Login with Proper Headers
```javascript
const xsrfToken = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '');
console.log('Using XSRF Token:', xsrfToken);

fetch('https://artitracktesting-production.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-XSRF-TOKEN': xsrfToken
  },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@sti.edu.ph' })
}).then(r => {
  console.log('Login Status:', r.status);
  return r.json();
}).then(data => {
  console.log('Login Response:', data);
});
```
**Expected:** Status 200, user data returned

### Step 4: Test /api/auth/me After Login
```javascript
fetch('https://artitracktesting-production.up.railway.app/api/auth/me', {
  credentials: 'include',
  headers: {
    'Accept': 'application/json'
  }
}).then(r => {
  console.log('Me Status:', r.status);
  return r.json();
}).then(data => {
  console.log('Me Response:', data);
});
```
**Expected:** Status 200, user data returned

## Common Issues & Solutions

### Issue 1: CSRF endpoint returns 404 or 500
**Problem:** Railway environment variables not set
**Solution:** Add these to Railway Variables tab:
```
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=artitracktesting-production.up.railway.app,artitracktesting-proxy.up.railway.app
```

### Issue 2: No cookies set after CSRF call
**Problem:** CORS or session configuration
**Solution:** Verify Railway has:
```
SESSION_DOMAIN=
SESSION_PATH=/
```

### Issue 3: Login returns 419 (CSRF mismatch)
**Problem:** XSRF token not being sent or invalid
**Solution:** 
- Clear browser cache completely
- Try in incognito window
- Verify XSRF token is in the request headers

### Issue 4: Login succeeds but /me returns 401
**Problem:** Session not persisting
**Solution:** Check that login response sets new session cookie

## Railway Environment Variables Checklist

Go to Railway → Your Backend Service → Variables tab and verify these exist:

```bash
# Session Configuration
SESSION_DRIVER=database
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SESSION_PARTITIONED_COOKIE=true
SESSION_DOMAIN=
SESSION_PATH=/

# Sanctum Configuration  
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,artitracktesting-production.up.railway.app,artitracktesting-proxy.up.railway.app

# CORS Configuration
FRONTEND_URL=https://your-vercel-app.vercel.app

# App Configuration
APP_URL=https://artitracktesting-production.up.railway.app
APP_ENV=production
APP_DEBUG=false
```

## Quick Fix Steps

1. **Add missing Railway variables** (see checklist above)
2. **Wait for Railway to redeploy** (2-3 minutes)
3. **Clear browser cache** (Ctrl+Shift+Delete → All time)
4. **Test in incognito window**
5. **Run diagnostic commands** (see above)

## Still Not Working?

If you've done all the above and still get 401:

1. **Check Railway logs:**
   - Go to Railway → Deployments → Latest → View Logs
   - Look for session, CORS, or authentication errors

2. **Verify the exact domain:**
   - Check what domain your frontend is actually calling
   - Add that exact domain to SANCTUM_STATEFUL_DOMAINS

3. **Test with curl:**
   ```bash
   # Test CSRF cookie
   curl -v -X GET "https://artitracktesting-production.up.railway.app/sanctum/csrf-cookie" \
     -H "Origin: https://your-frontend-domain.com" \
     -c cookies.txt

   # Test login with cookie
   curl -v -X POST "https://artitracktesting-production.up.railway.app/api/auth/login" \
     -H "Content-Type: application/json" \
     -H "Origin: https://your-frontend-domain.com" \
     -H "X-XSRF-TOKEN: $(cat cookies.txt | grep XSRF-TOKEN | cut -f7)" \
     -b cookies.txt \
     -d '{"email":"test@sti.edu.ph"}'
   ```

The most common cause is missing Railway environment variables. Make sure you've added ALL the variables from the checklist above.

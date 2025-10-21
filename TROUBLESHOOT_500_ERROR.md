# 500 Error Troubleshooting Guide

## Step 1: Check Railway Logs (CRITICAL)

1. Go to Railway Dashboard
2. Click your backend service
3. Go to **Deployments** tab
4. Click latest deployment → **View Logs**
5. Look for PHP errors, database errors, or missing files

## Step 2: Required Railway Environment Variables

Add these to Railway → Variables tab:

```bash
# CRITICAL: Application Key (generate locally: php artisan key:generate --show)
APP_KEY=base64:YOUR_GENERATED_KEY_HERE

# Database & Session
SESSION_DRIVER=database
CACHE_STORE=database
DB_CONNECTION=pgsql

# Session Configuration for Cross-Origin
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SESSION_PARTITIONED_COOKIE=true
SESSION_DOMAIN=

# Sanctum Domains
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,artitracktesting-production.up.railway.app,artitracktesting-proxy.up.railway.app

# App Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=https://artitracktesting-production.up.railway.app
```

## Step 3: Test Endpoints Individually

Run these in browser console:

```javascript
// Test basic ping
fetch('https://artitracktesting-production.up.railway.app/api/_ping')
  .then(r => r.json())
  .then(data => console.log('Ping:', data))
  .catch(err => console.error('Ping failed:', err));

// Test CSV reload
fetch('https://artitracktesting-production.up.railway.app/api/auth/reload', {
  method: 'POST',
  headers: { 'Accept': 'application/json' }
}).then(r => r.json())
  .then(data => console.log('CSV reload:', data))
  .catch(err => console.error('CSV reload failed:', err));
```

## Step 4: Common 500 Error Causes

### Missing APP_KEY
**Error:** "No application encryption key has been specified"
**Fix:** Generate key locally and add to Railway:
```bash
php artisan key:generate --show
```

### Database Connection Issues
**Error:** "SQLSTATE[08006]" or database connection errors
**Fix:** Verify Railway PostgreSQL service is connected and variables are set

### Missing Storage Permissions
**Error:** "file_get_contents(): failed to open stream"
**Fix:** Railway should handle this automatically, but check logs

### Missing Dependencies
**Error:** "Class 'League\Csv\Reader' not found"
**Fix:** Already in composer.json, should auto-install

## Step 5: Alternative Authentication (If CSV Fails)

If CSV continues to fail, we can switch to database authentication:

```php
// In AuthController, replace csvUsers() method with:
protected function getAuthorizedUsers(): array
{
    return [
        'mejia.22834@munoz.sti.edu.ph' => [
            'email' => 'mejia.22834@munoz.sti.edu.ph',
            'name' => 'Maria Mejia',
            'role' => 'admin',
            'dept' => 'ICT',
            'account_no' => '22834',
            'is_active' => true
        ],
        'test@sti.edu.ph' => [
            'email' => 'test@sti.edu.ph',
            'name' => 'Test User',
            'role' => 'custodian',
            'dept' => 'ICT',
            'account_no' => '12345',
            'is_active' => true
        ]
    ];
}
```

## Step 6: Debug Checklist

- [ ] Railway deployment shows green checkmark
- [ ] All environment variables added to Railway
- [ ] Railway logs checked for specific errors
- [ ] Basic ping endpoint works
- [ ] CSV reload endpoint tested
- [ ] Browser cache cleared
- [ ] Testing in incognito window

## Step 7: What Railway Logs Should Show

**Good logs:**
- "Server running on http://0.0.0.0:8000"
- "Application cache cleared"
- No PHP fatal errors

**Bad logs (need fixing):**
- "No application encryption key"
- "SQLSTATE" database errors
- "Class not found" errors
- "Permission denied" errors

## Next Steps

1. **Check Railway logs first** - this will tell you the exact error
2. **Add missing environment variables** based on what logs show
3. **Test endpoints individually** to isolate the issue
4. **If CSV fails, switch to hardcoded authentication** as backup

The 500 error means something specific is broken - the logs will tell you exactly what.

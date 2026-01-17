# DNS Error Fix: api.ad-promoter.com

## Issue
You're seeing this error:
```
https://api.ad-promoter.com/api/v1/auth/google
This site can't be reached
Check if there is a typo in api.ad-promoter.com.
DNS_PROBE_FINISHED_NXDOMAIN
```

## Root Cause
The domain `api.ad-promoter.com` **does not exist** (DNS_PROBE_FINISHED_NXDOMAIN means the domain doesn't resolve). This domain is likely configured in one of these places:

1. **Environment Variable** - `NEXT_PUBLIC_API_BASE_URL` is set to `https://api.ad-promoter.com`
2. **Browser Cache** - Old redirects or cached URLs
3. **Backend Redirect** - The backend might be redirecting to this domain

## Solution

### Step 1: Check Your Environment Variables

Check if you have `NEXT_PUBLIC_API_BASE_URL` set incorrectly:

**For Local Development:**
Create or update `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

**For Production:**
Check `.env.production` (if it exists):
```bash
# Should be one of these:
NEXT_PUBLIC_API_BASE_URL=https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api
# OR
NEXT_PUBLIC_API_BASE_URL=https://add-promoter-backend.onrender.com
```

**❌ WRONG:**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.ad-promoter.com  # This domain doesn't exist!
```

### Step 2: Fix the Environment Variable

**If you're running locally:**
1. Create `.env.local` in the project root:
   ```bash
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > .env.local
   ```

2. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   yarn dev
   ```

**If you're in production:**
1. Check your deployment platform (Vercel, Firebase, etc.) environment variables
2. Update `NEXT_PUBLIC_API_BASE_URL` to one of the valid URLs:
   - `https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api` (Firebase Functions - Recommended)
   - `https://add-promoter-backend.onrender.com` (Render - if backend is deployed there)

### Step 3: Clear Browser Cache

The browser might have cached the old URL. Clear it:

1. **Chrome/Edge:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Or use Incognito/Private mode:**
   - Open a new incognito/private window
   - Try accessing the app again

### Step 4: Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab** - Look for any errors mentioning `api.ad-promoter.com`
2. **Network tab** - See what URLs are being requested
3. **Application/Storage tab** - Check localStorage/sessionStorage for cached URLs

## Valid API URLs

The app supports these backend URLs:

1. **Firebase Functions** (Recommended - Most Reliable):
   ```
   https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api
   ```

2. **Render** (If backend is deployed there):
   ```
   https://add-promoter-backend.onrender.com
   ```

3. **Local Development**:
   ```
   http://localhost:4000
   ```

## Quick Fix Command

If you're running locally and want to quickly fix it:

```bash
cd /Users/mac/ad-promoter-app-frontend-main
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > .env.local
# Then restart: yarn dev
```

## Verification

After fixing, verify the API URL is correct:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Type: `process.env.NEXT_PUBLIC_API_BASE_URL` (if available)
4. Or check **Network** tab - API requests should go to the correct URL

## Why This Happened

The domain `api.ad-promoter.com` was likely:
- Configured as a planned custom domain that was never set up
- Set in an old environment file
- Used in documentation but never actually deployed
- A typo or placeholder that wasn't updated

## Status
✅ **FIXED** - Once you update the environment variable and restart, the DNS error should be resolved.


# 🚨 URGENT: Login Not Working - api.ad-promoter.com DNS Error

## The Problem

Users cannot login because they're being redirected to:
```
https://api.ad-promoter.com/api/v1/auth/google
```

This domain **doesn't exist** and causes DNS errors, preventing login.

## Root Cause

The production deployment has `NEXT_PUBLIC_API_BASE_URL` environment variable set to `https://api.ad-promoter.com` (a non-existent domain).

## Immediate Fix

### For Production Deployment (Firebase Hosting/Vercel/etc.)

**The environment variable is set incorrectly in your deployment platform.**

#### Step 1: Check Current Environment Variable

**If using Firebase Hosting:**
1. Go to: https://console.firebase.google.com/project/ad-promoter-36ef7/hosting
2. Check environment variables (if supported in Firebase Hosting)

**If using Vercel:**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Find `NEXT_PUBLIC_API_BASE_URL`

**If using other platforms:**
- Check your deployment platform's environment variable settings

#### Step 2: Update Environment Variable

**Option A: Remove it (Recommended)**
- Delete `NEXT_PUBLIC_API_BASE_URL` from environment variables
- The app will use the default: `https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api`

**Option B: Set to Correct Value**
- Change `NEXT_PUBLIC_API_BASE_URL` to:
  ```
  https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api
  ```

**❌ DO NOT USE:**
```
https://api.ad-promoter.com  # This domain doesn't exist!
```

#### Step 3: Redeploy

After updating the environment variable, **redeploy the frontend**:

**Firebase Hosting:**
```bash
yarn firebase:deploy
```

**Vercel:**
```bash
# Push to git or use Vercel dashboard
git push
```

**Other platforms:**
- Trigger a new deployment

## Why This Happens

The frontend code uses Firebase OAuth directly, BUT:
- If `NEXT_PUBLIC_API_BASE_URL` is set to `api.ad-promoter.com`
- And the API proxy tries to handle any requests
- It constructs URLs with that base URL
- Which fails because the domain doesn't exist

## Verification

After fixing and redeploying:

1. **Clear browser cache** or use incognito mode
2. **Visit your production site**
3. **Click "Login with Google"**
4. **Should redirect to Firebase OAuth** (not `api.ad-promoter.com`)
5. **Login should work!** ✅

## Temporary Workaround (For Users)

Until the fix is deployed, users can:
1. Use **email/password login** instead of OAuth
2. Or access the site in **incognito/private mode** (sometimes bypasses cached redirects)

## Code Confirmation

The frontend code is **correct** - it uses Firebase OAuth directly:
- `pages/index.js` → redirects to `/login?provider=google`
- `pages/login.jsx` → calls `signInWithGoogle()` (Firebase Auth)
- No backend OAuth endpoints are called

The issue is **only** the environment variable configuration in production.

## Status

- ✅ Frontend code is correct (uses Firebase OAuth)
- ✅ OAuth flow is properly implemented
- ❌ Production environment variable is misconfigured
- 🔧 **Action Required:** Update `NEXT_PUBLIC_API_BASE_URL` in production deployment


# Legacy OAuth Endpoint Fix

## Issue
When trying to sign in, the application was making a request to:
```
https://add-promoter-backend.onrender.com/api/v1/auth/google
```
This was causing a **503 (Service Unavailable)** error because:
1. The backend API on Render is down or unavailable
2. This is a **legacy OAuth endpoint** that should no longer be used
3. The app now uses **Firebase OAuth** instead of backend OAuth

## Root Cause
The Next.js API proxy at `pages/api/v1/[...path].js` was forwarding **all** requests to `/api/v1/*` to the backend API, including legacy OAuth endpoints like:
- `/api/v1/auth/google`
- `/api/v1/auth/facebook`
- `/api/v1/auth/google-redirect`
- `/api/v1/auth/facebook/redirect`

When someone accessed these endpoints (either directly via URL, bookmark, or old code), the proxy would forward the request to the backend, which returned a 503 error.

## Solution
Updated the API proxy to **intercept legacy OAuth endpoints** and redirect them to the login page with Firebase OAuth instead of proxying to the backend.

### Changes Made
**File:** `pages/api/v1/[...path].js`

Added a check before proxying requests:
```javascript
// Handle legacy OAuth endpoints - redirect to login page with Firebase OAuth
if (pathString === 'auth/google' || 
    pathString === 'auth/facebook' ||
    pathString.startsWith('auth/google-redirect') ||
    pathString.startsWith('auth/facebook/redirect')) {
  // Determine provider from path
  let provider = 'google';
  if (pathString.includes('facebook')) {
    provider = 'facebook';
  }
  
  // Return a redirect response
  res.setHeader('Location', `/login?provider=${provider}`);
  return res.status(301).json({
    success: false,
    message: 'Legacy OAuth endpoint deprecated. Please use Firebase OAuth.',
    redirect: `/login?provider=${provider}`
  });
}
```

## Impact
✅ **No more 503 errors** - Legacy OAuth endpoints are handled gracefully  
✅ **Automatic redirect** - Users accessing legacy endpoints are redirected to Firebase OAuth  
✅ **Backward compatible** - Old links/bookmarks will still work (they'll just redirect)  
✅ **Cleaner console** - No more error messages for deprecated endpoints  

## How It Works Now

### Before (Broken):
1. User accesses `/api/v1/auth/google` (directly or via old link)
2. Next.js API proxy forwards request to backend: `https://add-promoter-backend.onrender.com/api/v1/auth/google`
3. Backend returns **503 Service Unavailable**
4. Error appears in console ❌

### After (Fixed):
1. User accesses `/api/v1/auth/google` (directly or via old link)
2. Next.js API proxy **intercepts** the request
3. Returns **301 redirect** to `/login?provider=google`
4. Login page handles Firebase OAuth ✅
5. No errors in console ✅

## Testing
To verify the fix:
1. Try accessing: `http://localhost:3000/api/v1/auth/google`
2. Should redirect to: `http://localhost:3000/login?provider=google`
3. Login page should trigger Firebase Google OAuth
4. No 503 errors should appear in the console

## Related Files
- `pages/api/v1/[...path].js` - API proxy (now handles legacy OAuth endpoints)
- `pages/v1/auth/google.js` - Frontend route handler (already redirects to login)
- `pages/_app.js` - Error interceptor (suppresses 503 errors in console)
- `services/api/socialAuth.js` - Backend OAuth sync (handles 503 gracefully)

## Status
✅ **FIXED** - Changes committed and pushed to Git


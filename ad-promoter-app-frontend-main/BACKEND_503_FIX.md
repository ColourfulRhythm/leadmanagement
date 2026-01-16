# Backend 503 Error Fix

## Issue
Backend API on Render (`https://add-promoter-backend.onrender.com`) is returning **503 Service Unavailable** errors, causing OAuth login to fail.

## Root Cause
- Render service is down or sleeping (free tier services sleep after inactivity)
- OAuth login was failing completely when backend was unavailable
- No graceful fallback to Firebase-only authentication

## Fixes Applied

### 1. ✅ Graceful 503 Error Handling
**File:** `services/api/socialAuth.js`

- Added 503 error detection in `attemptSignIn()` and `attemptSetup()`
- OAuth login now continues with Firebase authentication even if backend is down
- User can still login and use the app (Firebase features work)
- Backend JWT token is optional - Firebase token is used as fallback

**Before:**
```javascript
const response = await fetch(buildApiUrl(signInPath));
return parseResponse(response); // Would throw error on 503
```

**After:**
```javascript
const response = await fetch(buildApiUrl(signInPath));
if (response.status === 503) {
  console.warn('Backend service unavailable (503). OAuth login will continue with Firebase only.');
  throw new Error('Backend service temporarily unavailable');
}
// ... handles gracefully, allows Firebase-only login
```

### 2. ✅ Default API URL Changed to Firebase Functions
**File:** `lib/config.js`

- Changed default from `http://localhost:4000` to Firebase Functions URL
- Firebase Functions is more reliable than Render (doesn't sleep)
- Still allows override via environment variable

**Before:**
```javascript
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
```

**After:**
```javascript
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
  'https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api';
```

### 3. ✅ Improved Error Handling in Login Page
**File:** `pages/login.jsx`

- Backend failures no longer block OAuth login
- User-friendly error messages
- Firebase authentication works independently

## How It Works Now

### OAuth Login Flow (With Backend Down):

1. **User clicks "Login with Google"**
2. **Firebase Auth** authenticates user ✅
3. **Backend sync attempt** fails with 503 ❌
4. **Fallback:** Continue with Firebase token only ✅
5. **User logged in** with Firebase authentication ✅
6. **User can access app** (Firebase features work) ✅

### What Works Without Backend:
- ✅ Firebase Authentication (OAuth, email/password)
- ✅ Firestore database access
- ✅ Firebase Storage (image uploads)
- ✅ User profiles
- ✅ Basic app functionality

### What Needs Backend:
- ⚠️ Backend API calls (ads, dashboard data, etc.)
- ⚠️ Backend JWT tokens (Firebase tokens work for Firestore)
- ⚠️ Some advanced features

## API URL Priority

1. **Environment Variable** (`NEXT_PUBLIC_API_BASE_URL`) - Highest priority
2. **Firebase Functions** (default) - `https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api`
3. **Localhost** (if env var set to `http://localhost:4000`)

## Configuration

### For Local Development:
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### For Production (Firebase Functions):
No config needed - uses Firebase Functions by default

### For Production (Render):
Create `.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://add-promoter-backend.onrender.com
```

**Note:** Render free tier services sleep after inactivity, causing 503 errors. Firebase Functions is recommended for production.

## Testing

### Test OAuth with Backend Down:
1. Start app: `yarn dev`
2. Click "Login with Google"
3. Should login successfully even if backend returns 503
4. Check console - should see warning but login succeeds
5. User should be redirected to dashboard

### Test OAuth with Backend Up:
1. Ensure backend is running
2. Click "Login with Google"
3. Should login and get backend JWT token
4. Full functionality available

## Error Messages

### Console Warnings (Not Shown to User):
- `Backend service unavailable (503). OAuth login will continue with Firebase only.`
- `Backend unavailable for OAuth sync. Continuing with Firebase authentication only.`

### User Experience:
- ✅ Login succeeds
- ✅ No error messages shown
- ✅ App works with Firebase features
- ⚠️ Some backend features may not work

## Files Modified

1. ✅ `services/api/socialAuth.js` - Added 503 error handling
2. ✅ `lib/config.js` - Changed default to Firebase Functions
3. ✅ `pages/login.jsx` - Improved error handling

## Status

✅ **Fixed** - OAuth login now works even when backend is down
✅ **Graceful degradation** - App continues to work with Firebase
✅ **Better defaults** - Uses Firebase Functions (more reliable)


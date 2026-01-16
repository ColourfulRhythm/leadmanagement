# 🚀 Start Application on Localhost

## Quick Start Commands

Open your terminal and run these commands:

### 1. Navigate to Project Directory
```bash
cd /Users/mac/ad-promoter-app-frontend-main
```

### 2. Install Dependencies
```bash
yarn install
```

**OR if yarn doesn't work:**
```bash
npm install
```

### 3. Start Development Server
```bash
yarn dev
```

**OR if using npm:**
```bash
npm run dev
```

### 4. Open in Browser
The app will be available at: **http://localhost:3000**

---

## ⚙️ Environment Setup (Optional)

The app has fallback Firebase config, but for best results, create `.env.local`:

```bash
# Create .env.local file
touch .env.local
```

Add this content to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCBc0FHJSC7xxQJgGkiav4dUSCaGeL5YSA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ad-promoter-36ef7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ad-promoter-36ef7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ad-promoter-36ef7.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=289559962738
NEXT_PUBLIC_FIREBASE_APP_ID=1:289559962738:web:21c0d7f38a678c3d564eeb

# For local backend (if running)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use?
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 yarn dev
```

### Installation Errors?
```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf .next
yarn install
# or
npm install
```

### Module Not Found Errors?
```bash
# Reinstall dependencies
rm -rf node_modules yarn.lock package-lock.json
yarn install
```

### Firebase Connection Issues?
- Check browser console for errors
- Verify Firebase project is active
- Check network tab for failed requests

---

## ✅ What to Test After Starting

1. **Homepage:** http://localhost:3000
   - Should show landing page with signup options

2. **Signup:** http://localhost:3000/signup
   - Test password validation (now enforced!)
   - Create a new account

3. **Login:** http://localhost:3000/login
   - Test email/password login
   - Test route protection (should redirect if not logged in)

4. **Protected Routes:**
   - Try accessing `/placers` without login → Should redirect to `/login`
   - Try accessing `/promoters` without login → Should redirect to `/login`
   - Try accessing `/admin` without login → Should redirect to `/login`

5. **After Login:**
   - Access dashboard based on your role
   - Test ad creation
   - Test dashboard features

---

## 🔧 Backend Requirements

### What Works Without Backend:
- ✅ Email/password signup
- ✅ Email/password login
- ✅ Firebase authentication
- ✅ Basic UI/UX
- ✅ Route protection (newly fixed!)

### What Needs Backend:
- ⚠️ OAuth (Google/Facebook) - needs backend on localhost:4000
- ⚠️ API calls (ads, dashboard data, etc.)
- ⚠️ File uploads
- ⚠️ Payment processing

### To Run Backend Locally:
```bash
cd ADD-PROMOTER-BACKEND-main/ADD-PROMOTER-BACKEND-main
npm install
npm run start:dev
```

Backend will run on: **http://localhost:4000**

---

## 📝 Recent Fixes Applied

✅ **Route Protection Enabled** - All protected routes now require authentication  
✅ **Password Validation Enforced** - Strong passwords required  
✅ **RequireAuth Hook Fixed** - Properly renders components  

See `CRITICAL_FIXES_APPLIED.md` for details.

---

## 🎯 Expected Behavior

### On First Load:
1. Server starts on port 3000
2. Next.js compiles pages
3. Browser opens to http://localhost:3000
4. Landing page displays

### When Not Logged In:
- Accessing `/placers` → Redirects to `/login`
- Accessing `/promoters` → Redirects to `/login`
- Accessing `/admin` → Redirects to `/login`

### When Logged In:
- Accessing `/placers` → Shows placer dashboard (if role is 'placer')
- Accessing `/promoters` → Shows promoter dashboard (if role is 'promoter')
- Accessing `/admin` → Shows admin panel (if role is 'admin')

---

## 💡 Tips

- Keep terminal open to see compilation errors
- Check browser console (F12) for runtime errors
- Use Network tab to debug API calls
- Hot reload is enabled - changes auto-refresh

---

**Ready to start?** Run `yarn dev` in your terminal! 🚀


# Running on Localhost - Quick Setup Guide

## Prerequisites
- Node.js installed
- Yarn installed (or npm)

## Step 1: Install Dependencies

```bash
cd /Users/mac/ad-promoter-app-frontend-main
yarn install
```

## Step 2: (Optional) Create .env.local

Create a `.env.local` file in the root directory with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ad-promoter-36ef7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ad-promoter-36ef7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ad-promoter-36ef7.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=289559962738
NEXT_PUBLIC_FIREBASE_APP_ID=1:289559962738:web:21c0d7f38a678c3d564eeb

# Backend API URL (for local development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

**Note:** The app has fallback Firebase config values, so it will work without .env.local, but it's recommended to create one.

## Step 3: Start Development Server

```bash
yarn dev
```

The app will be available at: **http://localhost:3000**

## Troubleshooting

### Port 3000 already in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 yarn dev
```

### Dependencies installation fails?
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

### Firebase connection issues?
- Check your Firebase project settings
- Verify API keys in .env.local
- Check browser console for errors

## What to Test

After starting the server:

1. **Homepage:** http://localhost:3000
2. **Signup:** http://localhost:3000/signup
3. **Login:** http://localhost:3000/login
4. **Placer Dashboard:** http://localhost:3000/placers (requires login)
5. **Promoter Dashboard:** http://localhost:3000/promoters (requires login)

## Backend Required?

- **Email/Password Auth:** ✅ Works without backend
- **OAuth (Google/Facebook):** ⚠️ Needs backend running on localhost:4000
- **API Features:** ⚠️ Needs backend for full functionality

To run backend locally:
```bash
cd ADD-PROMOTER-BACKEND-main/ADD-PROMOTER-BACKEND-main
npm install
npm run start:dev
```


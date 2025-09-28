# Adparlay Backend - Vercel Serverless

This is the serverless backend for the Adparlay application, converted to run on Vercel.

## ✅ Conversion Complete

Your Express backend has been successfully converted to Vercel serverless functions!

## API Endpoints

- `GET /api` - Health check
- `POST /api/forms` - Create a new form
- `GET /api/forms/[id]` - Get a specific form
- `POST /api/forms/[id]/submissions` - Submit a form
- `GET /api/forms/[id]/submissions` - Get all submissions for a form
- `GET /api/forms/[id]/analytics` - Get analytics for a form

## Quick Deployment

1. **Set up environment variables in Vercel dashboard:**
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

2. **Deploy with one command:**
   ```bash
   ./deploy.sh
   ```

   Or manually:
   ```bash
   npm run deploy
   ```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Fill in your Firebase Admin SDK credentials

3. Run the development server:
   ```bash
   npm run dev
   ```

## Manual Deployment Steps

1. Login to Vercel (first time only):
   ```bash
   npx vercel login
   ```

2. Deploy:
   ```bash
   npx vercel --prod
   ```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add the Firebase environment variables

## Environment Variables

- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email from Firebase Admin SDK
- `FIREBASE_PRIVATE_KEY`: Private key from Firebase Admin SDK (with newlines as \n)

## Authentication

All endpoints (except health check) require Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## File Structure

```
backend/
├── api/
│   ├── _middleware.ts          # Authentication middleware
│   ├── index.ts               # Health check endpoint
│   └── forms/
│       ├── index.ts           # Create forms
│       ├── [id].ts            # Get specific form
│       └── [id]/
│           ├── submissions/
│           │   └── index.ts   # Form submissions
│           └── analytics.ts   # Form analytics
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── deploy.sh                 # Deployment script
└── README.md                 # This file
```

## What Changed

- ✅ Converted Express routes to Vercel serverless functions
- ✅ Maintained Firebase authentication
- ✅ Preserved all API endpoints
- ✅ Simplified dependencies
- ✅ Added deployment automation
- ✅ Updated TypeScript configuration 
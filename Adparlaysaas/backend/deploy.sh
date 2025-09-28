#!/bin/bash

echo "🚀 Deploying Adparlay Backend to Vercel..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found. Make sure to set environment variables in Vercel dashboard."
    echo "   Required variables:"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_CLIENT_EMAIL"
    echo "   - FIREBASE_PRIVATE_KEY"
    echo ""
fi

# Deploy to Vercel
echo "📦 Running deployment..."
npx vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your API will be available at: https://your-project-name.vercel.app/api" 
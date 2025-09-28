#!/bin/bash

# Adparlay Form Builder - Supabase Deployment Script

echo "🚀 Starting deployment process..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials:"
    echo "VITE_SUPABASE_URL=your_supabase_project_url"
    echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output is in the 'dist' folder"
    echo ""
    echo "🚀 Ready for deployment!"
    echo ""
    echo "Deploy to:"
    echo "• Vercel: Connect your GitHub repo and set environment variables"
    echo "• Netlify: Upload the 'dist' folder"
    echo "• Manual: Upload 'dist' folder to your hosting provider"
    echo ""
    echo "📋 Don't forget to:"
    echo "1. Set up your Supabase database with the provided SQL migrations"
    echo "2. Configure environment variables on your hosting platform"
    echo "3. Test the deployed application"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi

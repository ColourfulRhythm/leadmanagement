#!/bin/bash

echo "🚀 Deploying Firebase Security Rules..."

# Deploy Firestore security rules
firebase deploy --only firestore:rules

echo "✅ Firebase Security Rules deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Firebase Console: https://console.firebase.google.com/project/adparlaysaas"
echo "2. Navigate to Firestore Database"
echo "3. Create the following collections if they don't exist:"
echo "   - forms"
echo "   - form_responses" 
echo "   - analytics"
echo ""
echo "🔒 Security rules are now active and will:"
echo "   - Allow public read access to published forms"
echo "   - Allow form creators to manage their forms"
echo "   - Allow anyone to submit form responses (for lead collection)"
echo "   - Allow form creators to view responses and analytics"
echo ""
echo "🎯 Your form builder is now fully functional with Firebase!"

# Firebase Setup Guide for Adparlay Lead Capture

## 🔥 **Step 1: Get Your Firebase Credentials**

1. Go to your Firebase project: https://console.firebase.google.com/project/adparlaysaas/
2. Click on the **gear icon** (⚙️) next to "Project Overview" → **Project settings**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app, click **"Add app"** → **Web** (</>) 
5. Register your app with a nickname (e.g., "adparlay-lead-capture")
6. Copy the **config object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "adparlaysaas.firebaseapp.com",
  projectId: "adparlaysaas",
  storageBucket: "adparlaysaas.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 🔧 **Step 2: Update Environment Variables**

Update your `.env` file with the actual values from your Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your-actual-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=adparlaysaas.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=adparlaysaas
REACT_APP_FIREBASE_STORAGE_BUCKET=adparlaysaas.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-actual-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-actual-app-id
```

## 🔐 **Step 3: Enable Authentication**

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click **Save**

## 📊 **Step 4: Set Up Firestore Database**

1. Go to **Firestore Database** in the sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click **Done**

## 🛡️ **Step 5: Set Up Security Rules**

1. In Firestore Database → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own forms
    match /forms/{formId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow read: if resource.data.status == 'published';
    }
    
    // Anyone can submit to forms, but only form owners can read submissions
    match /form_submissions/{submissionId} {
      allow create: if true;
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/forms/$(resource.data.formId)) &&
        get(/databases/$(database)/documents/forms/$(resource.data.formId)).data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

## 🚀 **Step 6: Test Your Setup**

1. Restart your development server:
   ```bash
   npm start
   ```

2. Try to:
   - Register a new account
   - Login with existing account
   - Create a form
   - Submit a form

## 🔍 **Troubleshooting**

### **"Firebase: Error (auth/api-key-not-valid)"**
- Double-check your API key in the `.env` file
- Make sure you copied the entire key correctly

### **"Permission denied" errors**
- Check that your Firestore security rules are published
- Verify you're using the correct project ID

### **"Collection not found" errors**
- The collections will be created automatically when you first save data
- No need to manually create them

## 📱 **Next Steps**

Once Firebase is set up, you can:
1. Test the complete user flow
2. Customize the form builder
3. Set up analytics
4. Configure email notifications
5. Deploy to production

Your Firebase project is now ready! 🎉

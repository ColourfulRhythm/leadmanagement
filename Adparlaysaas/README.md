# AdParlay - Lead Capture Form Builder

A modern, interactive lead capture form builder with split-screen preview, conditional logic, and instant PNG summaries. Built with React, TypeScript, Firebase, and Tailwind CSS.

## 🚀 Features

### Core Features
- **Split-Screen Form Builder**: Real-time preview as you build
- **Conditional Logic**: Show/hide fields based on user responses
- **PNG Summaries**: Automatic generation of beautiful submission summaries
- **Mobile-First Design**: Responsive forms that work on all devices
- **Professional Themes**: Multiple design themes and customization options

### Form Types Supported
- Text, Email, Phone inputs
- Select dropdowns, Radio buttons, Checkboxes
- Text areas, Date pickers, File uploads
- Number inputs with validation

### User Management
- **Free Plan**: Up to 3 forms, 100 leads, basic analytics
- **Premium Plan**: Unlimited forms, unlimited leads, advanced analytics, AI-powered builder
- **Subscription Management**: ₦1,000/month for premium features

### Analytics & Insights
- Real-time form performance tracking
- Conversion rate analytics
- Lead quality metrics
- Submission history and trends

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Authentication, Firestore)
- **Image Generation**: HTML2Canvas
- **Routing**: React Router DOM
- **Build Tool**: Create React App

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adparlay-lead-capture
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase config

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Form)
├── pages/              # Main application pages
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── FormBuilder.tsx
│   └── FormPreview.tsx
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── firebase.ts         # Firebase configuration
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## 🎯 Key Components

### FormBuilder
- Split-screen interface with real-time preview
- Drag-and-drop field management
- Conditional logic configuration
- Theme customization
- Field validation settings

### FormPreview
- Public form display
- Form validation and submission
- Automatic PNG generation
- Success/error handling

### Dashboard
- Form management and analytics
- Subscription status
- Performance metrics
- Quick actions

## 🔧 Configuration

### Firebase Setup
1. Enable Authentication with Email/Password
2. Set up Firestore with the following collections:
   - `users`: User profiles and subscription data
   - `forms`: Form definitions and settings
   - `submissions`: Form submissions and responses

### Firestore Security Rules
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
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if resource.data.status == 'published';
    }
    
    // Anyone can submit to published forms
    match /submissions/{submissionId} {
      allow create: if true;
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Set environment variables in Netlify dashboard

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init hosting`
3. Build and deploy: `npm run build && firebase deploy`

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Mobile-first design approach
- Touch-friendly interfaces
- Optimized layouts for different screen sizes
- Progressive Web App capabilities

## 🔒 Security Features

- Firebase Authentication
- Firestore security rules
- Input validation and sanitization
- CORS protection
- Rate limiting (implemented on backend)

## 📊 Analytics Integration

- Form submission tracking
- User behavior analytics
- Conversion rate monitoring
- Performance metrics
- Real-time dashboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Updates

Stay updated with the latest features and improvements by:
- Following the repository
- Checking the releases page
- Reading the changelog

---

Built with ❤️ by the AdParlay team 
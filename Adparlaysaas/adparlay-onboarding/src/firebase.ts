import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD2xc7M7jzmMclR2T85-17Pff8Y7UtniME",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "adparlaysaas.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "adparlaysaas",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "adparlaysaas.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "552884113485",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:552884113485:web:64e2416884dfe311654c04",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-951B5WX7T6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// Initialize analytics only if in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app; 
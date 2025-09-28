import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD2xc7M7jzmMclR2T85-17Pff8Y7UtniME",
  authDomain: "adparlaysaas.firebaseapp.com",
  projectId: "adparlaysaas",
  storageBucket: "adparlaysaas.firebasestorage.app",
  messagingSenderId: "552884113485",
  appId: "1:552884113485:web:64e2416884dfe311654c04",
  measurementId: "G-951B5WX7T6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Analytics (only in production or when measurementId is available)
export const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId ? 
  getAnalytics(app) : null;

export default app; 
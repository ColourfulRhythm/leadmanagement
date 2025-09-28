import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUqNErw_wHXTF7msS817Fmx8X7lIcg8q8",
  authDomain: "adparlay.firebaseapp.com",
  projectId: "adparlay",
  storageBucket: "adparlay.firebasestorage.app",
  messagingSenderId: "294111767264",
  appId: "1:294111767264:web:b518352c79e4434365be85",
  measurementId: "G-DG45BXDMM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 
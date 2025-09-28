// Firebase diagnostics and configuration checker

import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export interface FirebaseDiagnostics {
  isConfigured: boolean;
  authDomain: string;
  projectId: string;
  hasAuth: boolean;
  authMethods: string[];
  errors: string[];
  warnings: string[];
}

export const checkFirebaseConfiguration = async (): Promise<FirebaseDiagnostics> => {
  const diagnostics: FirebaseDiagnostics = {
    isConfigured: false,
    authDomain: '',
    projectId: '',
    hasAuth: false,
    authMethods: [],
    errors: [],
    warnings: []
  };

  try {
    // Check if Firebase is configured
    if (!auth) {
      diagnostics.errors.push('Firebase Auth is not initialized');
      return diagnostics;
    }

    diagnostics.hasAuth = true;
    diagnostics.isConfigured = true;

    // Get Firebase config
    const config = auth.app.options;
    diagnostics.authDomain = config.authDomain || '';
    diagnostics.projectId = config.projectId || '';

    // Check if we're in a valid environment
    if (typeof window === 'undefined') {
      diagnostics.warnings.push('Running in server-side environment');
    }

    // Check if we're on localhost (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      diagnostics.warnings.push('Running on localhost - make sure Firebase project allows localhost domains');
    }

    // Check current user state
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('Current user:', currentUser.uid, currentUser.email);
    } else {
      console.log('No current user');
    }

    // Test basic auth functionality
    try {
      // This will fail but we can catch the error to see if auth is working
      await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        // These are expected errors, meaning auth is working
        console.log('Auth is working (got expected error):', error.code);
      } else if (error.code === 'auth/operation-not-allowed') {
        diagnostics.errors.push('Email/password authentication is not enabled in Firebase Console');
      } else if (error.code === 'auth/invalid-api-key') {
        diagnostics.errors.push('Invalid Firebase API key');
      } else if (error.code === 'auth/network-request-failed') {
        diagnostics.errors.push('Network error - check internet connection');
      } else {
        diagnostics.warnings.push(`Unexpected auth error: ${error.code} - ${error.message}`);
      }
    }

  } catch (error: any) {
    diagnostics.errors.push(`Configuration check failed: ${error.message}`);
  }

  return diagnostics;
};

export const logFirebaseDiagnostics = async () => {
  console.log('🔍 Running Firebase Diagnostics...');
  
  const diagnostics = await checkFirebaseConfiguration();
  
  console.log('📊 Firebase Configuration Status:');
  console.log('✅ Configured:', diagnostics.isConfigured);
  console.log('🔐 Auth Available:', diagnostics.hasAuth);
  console.log('🌐 Auth Domain:', diagnostics.authDomain);
  console.log('📁 Project ID:', diagnostics.projectId);
  
  if (diagnostics.errors.length > 0) {
    console.error('❌ Errors:');
    diagnostics.errors.forEach(error => console.error('  -', error));
  }
  
  if (diagnostics.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    diagnostics.warnings.forEach(warning => console.warn('  -', warning));
  }
  
  if (diagnostics.errors.length === 0 && diagnostics.warnings.length === 0) {
    console.log('✅ Firebase configuration looks good!');
  }
  
  return diagnostics;
};

// Auto-run diagnostics in development (only once per session)
if (process.env.NODE_ENV === 'development') {
  // Check if we've already run diagnostics in this session
  if (!sessionStorage.getItem('firebase-diagnostics-run')) {
    // Run diagnostics after a short delay to ensure Firebase is initialized
    setTimeout(() => {
      logFirebaseDiagnostics();
      sessionStorage.setItem('firebase-diagnostics-run', 'true');
    }, 2000);
  }
}

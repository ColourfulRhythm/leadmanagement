// Utility to create a test user for authentication testing

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const createTestUser = async () => {
  const testEmail = 'test@adparlay.com';
  const testPassword = 'testpassword123';
  
  try {
    console.log('🧪 Creating test user...');
    
    // First, try to sign in to see if user already exists
    try {
      const result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Test user already exists and login successful:', result.user.uid);
      return { success: true, message: 'Test user exists and login works', user: result.user };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        console.log('📝 Test user not found, creating new one...');
        const result = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('✅ Test user created successfully:', result.user.uid);
        return { success: true, message: 'Test user created successfully', user: result.user };
      } else {
        // Other error (wrong password, etc.)
        console.log('❌ Test user exists but wrong password or other error:', error.code);
        return { success: false, message: `Test user exists but error: ${error.code}`, error };
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to create/test user:', error.code, error.message);
    return { success: false, message: `Failed: ${error.message}`, error };
  }
};

export const testLogin = async (email: string, password: string) => {
  try {
    console.log('🔐 Testing login with:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login successful:', result.user.uid);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('❌ Login failed:', error.code, error.message);
    return { success: false, error: error.code, message: error.message };
  }
};

export const cleanupTestUser = async () => {
  try {
    await signOut(auth);
    console.log('🧹 Signed out test user');
  } catch (error) {
    console.error('❌ Failed to sign out:', error);
  }
};

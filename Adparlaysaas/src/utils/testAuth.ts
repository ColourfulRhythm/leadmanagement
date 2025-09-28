// Test authentication utilities for development

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export const createTestUser = async (email: string, password: string, displayName: string) => {
  try {
    console.log('Creating test user:', email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Test user created successfully:', result.user.uid);
    return result;
  } catch (error: any) {
    console.error('Test user creation failed:', error.code, error.message);
    throw error;
  }
};

export const testLoginWithRealCredentials = async (email: string, password: string) => {
  try {
    console.log('Testing login with real credentials:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful:', result.user.uid);
    return result;
  } catch (error: any) {
    console.error('Login failed:', error.code, error.message);
    throw error;
  }
};

export const testPasswordResetWithRealEmail = async (email: string) => {
  try {
    console.log('Testing password reset with real email:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error: any) {
    console.error('Password reset failed:', error.code, error.message);
    throw error;
  }
};

// Test credentials for development
export const TEST_CREDENTIALS = {
  email: 'test@adparlay.com',
  password: 'testpassword123',
  displayName: 'Test User'
};

export const runAuthTests = async () => {
  console.log('🧪 Running Authentication Tests...');
  
  try {
    // Test 1: Create a test user
    console.log('\n1. Testing user creation...');
    await createTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, TEST_CREDENTIALS.displayName);
    console.log('✅ User creation test passed');
    
    // Test 2: Login with the created user
    console.log('\n2. Testing login...');
    await testLoginWithRealCredentials(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    console.log('✅ Login test passed');
    
    // Test 3: Password reset
    console.log('\n3. Testing password reset...');
    await testPasswordResetWithRealEmail(TEST_CREDENTIALS.email);
    console.log('✅ Password reset test passed');
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error: any) {
    console.error('\n❌ Authentication test failed:', error.code, error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Test user already exists, trying login instead...');
      try {
        await testLoginWithRealCredentials(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
        console.log('✅ Login with existing user successful');
      } catch (loginError: any) {
        console.error('❌ Login with existing user failed:', loginError.code, loginError.message);
      }
    }
  }
};

// Authentication utility functions

export interface AuthError {
  code: string;
  message: string;
}

export const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || 'unknown';
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action.';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
};

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'auth/network-request-failed' || 
         error?.message?.includes('network') ||
         error?.message?.includes('Network');
};

export const logAuthError = (error: any, context: string) => {
  console.error(`Auth Error [${context}]:`, {
    code: error?.code,
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });
};

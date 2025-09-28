import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAuthErrorMessage, logAuthError, validateEmail, validatePassword } from '../utils/authUtils';

interface User {
  id: string;
  email: string;
  displayName: string;
  subscription: 'free' | 'premium';
  subscriptionDate?: Date;
  subscriptionExpiryDate?: Date;
  paymentStatus?: 'active' | 'expired' | 'grace';
  formsCount: number;
  leadsCount: number;
  maxForms: number;
  maxLeads: number;
  gracePeriodUsed?: boolean;
  daysTillExpiry?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscriptionStatus = (data: any, userEmail?: string): { subscription: 'free' | 'premium', paymentStatus: 'active' | 'expired' | 'grace', maxForms: number, maxLeads: number, daysTillExpiry?: number } => {
    // Test accounts with unlimited premium access
    const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
    
    if (userEmail && testEmails.includes(userEmail.toLowerCase())) {
      return { 
        subscription: 'premium', 
        paymentStatus: 'active', 
        maxForms: 999999, 
        maxLeads: 999999, 
        daysTillExpiry: 999999 // Never expires for test accounts
      };
    }
    
    const now = new Date();
    const expiryDate = data.subscriptionExpiryDate?.toDate();
    const subscriptionDate = data.subscriptionDate?.toDate();
    
    // If no expiry date, user is free
    if (!expiryDate || !subscriptionDate) {
      return { subscription: 'free', paymentStatus: 'expired', maxForms: 3, maxLeads: 100 };
    }
    
    // Calculate days until expiry (for reminders)
    const daysTillExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if subscription is active
    if (now < expiryDate) {
      return { 
        subscription: 'premium', 
        paymentStatus: 'active', 
        maxForms: 999999, 
        maxLeads: 999999, 
        daysTillExpiry: daysTillExpiry 
      };
    }
    
    // Check if within grace period (5 days after expiry)
    const gracePeriodEnd = new Date(expiryDate.getTime() + (5 * 24 * 60 * 60 * 1000));
    if (now < gracePeriodEnd && !data.gracePeriodUsed) {
      // Enter grace period
      return { 
        subscription: 'premium', 
        paymentStatus: 'grace', 
        maxForms: 999999, 
        maxLeads: 999999,
        daysTillExpiry: daysTillExpiry 
      };
    }
    
    // Subscription expired
    return { subscription: 'free', paymentStatus: 'expired', maxForms: 3, maxLeads: 100, daysTillExpiry: 0 };
  };

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const userEmail = firebaseUser.email || undefined;
      const subscriptionStatus = checkSubscriptionStatus(data, userEmail);
      
      // Update user status if needed
      const needsUpdate = data.subscription !== subscriptionStatus.subscription || 
                          data.paymentStatus !== subscriptionStatus.paymentStatus ||
                          data.maxForms !== subscriptionStatus.maxForms ||
                          data.maxLeads !== subscriptionStatus.maxLeads;
      
      // For test accounts, ensure they have premium status in database
      const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
      const isTestAccount = userEmail && testEmails.includes(userEmail.toLowerCase());
      
      if (needsUpdate || isTestAccount) {
        const updateData: any = {
          subscription: subscriptionStatus.subscription,
          paymentStatus: subscriptionStatus.paymentStatus,
          maxForms: subscriptionStatus.maxForms,
          maxLeads: subscriptionStatus.maxLeads,
          updatedAt: new Date()
        };
        
        if (subscriptionStatus.paymentStatus === 'grace') {
          updateData.gracePeriodUsed = true;
        }
        
        // For test accounts, ensure they have premium status in database
        if (isTestAccount) {
          updateData.subscription = 'premium';
          updateData.paymentStatus = 'active';
          updateData.maxForms = 999999;
          updateData.maxLeads = 999999;
          updateData.daysTillExpiry = 999999;
        }
        
        await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
      }
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: data.displayName || firebaseUser.displayName || '',
        subscription: subscriptionStatus.subscription,
        subscriptionDate: data.subscriptionDate?.toDate(),
        subscriptionExpiryDate: data.subscriptionExpiryDate?.toDate(),
        paymentStatus: subscriptionStatus.paymentStatus,
        formsCount: data.formsCount || 0,
        leadsCount: data.leadsCount || 0,
        maxForms: subscriptionStatus.maxForms,
        maxLeads: subscriptionStatus.maxLeads,
        gracePeriodUsed: data.gracePeriodUsed || false,
        daysTillExpiry: subscriptionStatus.daysTillExpiry,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } else {
      // Create new user profile
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        subscription: 'free',
        paymentStatus: 'expired',
        formsCount: 0,
        leadsCount: 0,
        maxForms: 3,
        maxLeads: 100,
        gracePeriodUsed: false,
        daysTillExpiry: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newUser;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message || 'Invalid password');
      }

      console.log('Attempting login for:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase login successful:', result.user.uid);
      
      // Wait for user profile to be fetched
      const userProfile = await fetchUserProfile(result.user);
      setCurrentUser(userProfile);
      
      console.log('Login successful for user:', userProfile);
      return userProfile;
    } catch (error: any) {
      logAuthError(error, 'login');
      const errorMessage = getAuthErrorMessage(error);
      console.error('Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(result.user, { displayName });
      
      // Create user document in Firestore
      const newUser: User = {
        id: result.user.uid,
        email: result.user.email || '',
        displayName,
        subscription: 'free',
        formsCount: 0,
        leadsCount: 0,
        maxForms: 3,
        maxLeads: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', result.user.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send welcome email
      try {
        const { emailService } = await import('../services/emailService');
        await emailService.sendWelcomeEmail(result.user.email || '', displayName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        ...updates,
        updatedAt: new Date(),
      });
      
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Validate email
      if (!email) {
        throw new Error('Please enter your email address');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Attempting to send password reset email to:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('Password reset email sent successfully to:', email);
    } catch (error: any) {
      logAuthError(error, 'resetPassword');
      const errorMessage = getAuthErrorMessage(error);
      console.error('Password reset failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await fetchUserProfile(firebaseUser);
          setCurrentUser(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Timer to check subscription status every hour and refresh user profile if needed
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        // Check if it's one of the test accounts - skip timer for them
        const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
        if (currentUser.email && testEmails.includes(currentUser.email.toLowerCase())) {
          // Test accounts are always premium, skip subscription checks
          return;
        }
        
        if (currentUser?.subscription === 'premium') {
          const userRef = doc(db, 'users', currentUser.id);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const subscriptionStatus = checkSubscriptionStatus(data, currentUser.email);
            
            // If status changed, update the user profile
            const statusChanged = currentUser.subscription !== subscriptionStatus.subscription ||
                                currentUser.paymentStatus !== subscriptionStatus.paymentStatus ||
                                currentUser.daysTillExpiry !== subscriptionStatus.daysTillExpiry;
            
            if (statusChanged) {
              const updatedProfile = {
                ...currentUser,
                subscription: subscriptionStatus.subscription,
                paymentStatus: subscriptionStatus.paymentStatus,
                maxForms: subscriptionStatus.maxForms,
                maxLeads: subscriptionStatus.maxLeads,
                daysTillExpiry: subscriptionStatus.daysTillExpiry,
                updatedAt: new Date()
              };
              setCurrentUser(updatedProfile);
            }
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

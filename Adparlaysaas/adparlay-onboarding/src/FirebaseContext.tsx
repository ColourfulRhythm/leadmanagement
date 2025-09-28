import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

interface CustomizationSettings {
  logo?: string;
  backgroundVideo?: string;
  backgroundImage?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  formFields?: {
    name: boolean;
    email: boolean;
    phone: boolean;
    interest: boolean;
    option: boolean;
    plotSize: boolean;
    finalChoice: boolean;
  };
  businessName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveFormResponse: (data: any) => Promise<string>;
  getFormResponses: () => Promise<any[]>;
  updateFormResponse: (id: string, data: any) => Promise<void>;
  setUserRole: (userId: string, role: string) => Promise<void>;
  getUserRole: (userId: string) => Promise<string | null>;
  saveCustomizationSettings: (settings: CustomizationSettings) => Promise<void>;
  getCustomizationSettings: () => Promise<CustomizationSettings>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  const saveFormResponse = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'formResponses'), {
        ...data,
        timestamp: new Date(),
        userId: user?.uid || 'anonymous'
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getFormResponses = async () => {
    try {
      const q = query(collection(db, 'formResponses'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateFormResponse = async (id: string, data: any) => {
    try {
      const docRef = doc(db, 'formResponses', id);
      await updateDoc(docRef, {
        ...data,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const setUserRole = async (userId: string, role: string) => {
    try {
      await setDoc(doc(db, 'users', userId), { role }, { merge: true });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getUserRole = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const saveCustomizationSettings = async (settings: CustomizationSettings) => {
    try {
      await setDoc(doc(db, 'customization', 'settings'), settings, { merge: true });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getCustomizationSettings = async (): Promise<CustomizationSettings> => {
    try {
      const docRef = doc(db, 'customization', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as CustomizationSettings;
      }
      return {
        logo: '',
        backgroundVideo: '',
        backgroundImage: '',
        welcomeMessage: 'Welcome to 2 Seasons Property Management',
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        accentColor: '#10B981',
        formFields: {
          name: true,
          email: true,
          phone: true,
          interest: true,
          option: true,
          plotSize: true,
          finalChoice: true
        },
        businessName: '2 Seasons Property Management',
        contactEmail: 'info@2seasons.com',
        contactPhone: '+1 (555) 123-4567'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    saveFormResponse,
    getFormResponses,
    updateFormResponse,
    setUserRole,
    getUserRole,
    saveCustomizationSettings,
    getCustomizationSettings
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 
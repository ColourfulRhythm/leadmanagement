import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';

interface FormConfig {
  id: string;
  title: string;
  steps: {
    step: number;
    title: string;
    description: string;
    type: 'contact' | 'interest' | 'options' | 'additional' | 'thankyou';
    options?: string[];
    required?: boolean;
  }[];
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FormResponse {
  id: string;
  formId: string;
  data: any;
  submittedAt: Date;
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  formConfig: FormConfig | null;
  responses: FormResponse[];
  
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Form management
  saveFormConfig: (config: Partial<FormConfig>) => Promise<void>;
  saveResponse: (data: any) => Promise<void>;
  loadResponses: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
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
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);

  // Authentication
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Form management
  const saveFormConfig = async (config: Partial<FormConfig>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const formRef = doc(db, 'forms', 'main');
      await setDoc(formRef, {
        ...config,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Save form config error:', error);
      throw error;
    }
  };

  const saveResponse = async (data: any) => {
    try {
      await addDoc(collection(db, 'responses'), {
        formId: 'main',
        data,
        submittedAt: new Date(),
      });
    } catch (error) {
      console.error('Save response error:', error);
      throw error;
    }
  };

  const loadResponses = () => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(collection(db, 'responses'), (snapshot) => {
      const responsesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormResponse[];
      setResponses(responsesData);
    });

    return unsubscribe;
  };

  // Load form configuration
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'forms', 'main'), (doc) => {
      if (doc.exists()) {
        setFormConfig(doc.data() as FormConfig);
      }
    });

    return unsubscribe;
  }, []);

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load responses when user is authenticated
  useEffect(() => {
    if (user) {
      const unsubscribe = loadResponses();
      return unsubscribe;
    }
  }, [user]);

  const value: FirebaseContextType = {
    user,
    loading,
    formConfig,
    responses,
    login,
    logout,
    saveFormConfig,
    saveResponse,
    loadResponses,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 
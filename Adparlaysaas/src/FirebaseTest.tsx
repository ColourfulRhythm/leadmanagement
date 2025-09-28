import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const FirebaseTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        setIsConnected(true);
        setMessage('✅ Firebase connection successful!');
      } catch (error) {
        setIsConnected(false);
        setMessage('❌ Firebase connection failed. Check your configuration.');
        console.error('Firebase connection error:', error);
      }
    };

    testConnection();
  }, []);

  const testAuth = async () => {
    try {
      // Try to create a test user (this will fail if auth is not set up properly)
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage('✅ Authentication is working!');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage('✅ Authentication is working (user already exists)');
      } else {
        setMessage(`❌ Authentication error: ${error.message}`);
      }
    }
  };

  const testFirestore = async () => {
    try {
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Firebase test',
        timestamp: new Date()
      });
      setMessage(`✅ Firestore is working! Document ID: ${docRef.id}`);
    } catch (error: any) {
      setMessage(`❌ Firestore error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Firebase Connection Test</h2>
      
      <div className={`p-3 rounded mb-4 ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
        <p className="font-semibold">Connection Status:</p>
        <p>{message}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="test@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="password"
          />
        </div>

        <div className="space-y-2">
          <button
            onClick={testAuth}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Test Authentication
          </button>
          
          <button
            onClick={testFirestore}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Test Firestore
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest; 
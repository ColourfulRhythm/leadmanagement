import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { logFirebaseDiagnostics } from '../utils/firebaseDiagnostics';
import { runAuthTests } from '../utils/testAuth';
import { createTestUser, testLogin, cleanupTestUser } from '../utils/createTestUser';

const AuthDebugger: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      runDiagnostics();
    }
  }, []);

  const runDiagnostics = async () => {
    // Add a small delay to prevent rapid successive calls
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = await logFirebaseDiagnostics();
    setDiagnostics(result);
  };

  const testLogin = async () => {
    try {
      console.log('Testing login with test credentials...');
      await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
    } catch (error: any) {
      console.log('Expected test login error:', error.code, error.message);
    }
  };

  const testPasswordReset = async () => {
    try {
      console.log('Testing password reset...');
      // This will fail but we can see the error
      await sendPasswordResetEmail(auth, 'test@example.com');
    } catch (error: any) {
      console.log('Password reset test error:', error.code, error.message);
    }
  };

  const testRealAuth = async () => {
    try {
      console.log('🧪 Testing real authentication...');
      const result = await createTestUser();
      if (result.success) {
        console.log('✅ Real authentication test passed:', result.message);
        // Clean up by signing out
        await cleanupTestUser();
      } else {
        console.log('❌ Real authentication test failed:', result.message);
      }
    } catch (error: any) {
      console.error('❌ Real authentication test error:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg z-50 font-mono max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-yellow-400">Auth Debugger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Status:</strong> {diagnostics?.isConfigured ? '✅ Configured' : '❌ Not Configured'}
        </div>
        
        <div>
          <strong>Auth:</strong> {diagnostics?.hasAuth ? '✅ Available' : '❌ Not Available'}
        </div>
        
        <div>
          <strong>Domain:</strong> {diagnostics?.authDomain || 'Unknown'}
        </div>
        
        <div>
          <strong>Project:</strong> {diagnostics?.projectId || 'Unknown'}
        </div>
        
        {diagnostics?.errors?.length > 0 && (
          <div>
            <strong className="text-red-400">Errors:</strong>
            {diagnostics.errors.map((error: string, index: number) => (
              <div key={index} className="text-red-300 text-xs">• {error}</div>
            ))}
          </div>
        )}
        
        {diagnostics?.warnings?.length > 0 && (
          <div>
            <strong className="text-yellow-400">Warnings:</strong>
            {diagnostics.warnings.map((warning: string, index: number) => (
              <div key={index} className="text-yellow-300 text-xs">• {warning}</div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={runDiagnostics}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={testLogin}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            Test Login
          </button>
          <button
            onClick={testPasswordReset}
            className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
          >
            Test Reset
          </button>
          <button
            onClick={runAuthTests}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
          >
            Full Test
          </button>
          <button
            onClick={testRealAuth}
            className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700"
          >
            Real Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;

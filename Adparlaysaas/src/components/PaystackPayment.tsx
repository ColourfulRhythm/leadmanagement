import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PaystackPaymentProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({ onSuccess, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Test accounts don't need to pay - grant automatic premium access
  const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
  const isTestAccount = currentUser?.email && testEmails.includes(currentUser.email.toLowerCase());

  // Test account automatic upgrade
  const handleTestAccount = useCallback(async () => {
    if (!isTestAccount || !currentUser?.id) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          subscription: 'premium',
          paymentStatus: 'active',
          maxForms: 999999,
          maxLeads: 999999,
          updatedAt: new Date()
        });
      }
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error upgrading test account:', error);
    }
  }, [currentUser, isTestAccount, onSuccess, onClose]);

  // Handle test account on component mount
  useEffect(() => {
    if (isTestAccount && onSuccess) {
      handleTestAccount();
    }
  }, [isTestAccount, handleTestAccount, onSuccess]);

  // Define callback functions outside the handlePayment function using useCallback
  const handlePaymentSuccess = useCallback(async (response: any) => {
    console.log('Payment callback received:', response);
    try {
      if (!currentUser?.id) return;
      
      // Payment successful, update user subscription
      const userRef = doc(db, 'users', currentUser.id);
      
      // First check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user document
        await updateDoc(userRef, {
          subscription: 'premium',
          subscriptionDate: new Date(),
          subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          paymentStatus: 'active',
          paystackReference: response.reference,
          maxForms: 999999,
          maxLeads: 999999,
          updatedAt: new Date()
        });
      } else {
        // Create new user document with premium subscription
        await setDoc(userRef, {
          id: currentUser.id,
          email: currentUser.email,
          displayName: currentUser.displayName,
          subscription: 'premium',
          subscriptionDate: new Date(),
          subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          paymentStatus: 'active',
          paystackReference: response.reference,
          formsCount: 0,
          leadsCount: 0,
          maxForms: 999999,
          maxLeads: 999999,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log('User subscription updated successfully');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Payment successful! Your account has been upgraded to Pro.');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Payment successful but there was an error updating your account. Please contact support.');
    }
  }, [currentUser, onSuccess]);

  const handlePaymentClose = useCallback(() => {
    console.log('Payment modal closed');
    setLoading(false);
    alert('Payment cancelled. You can try again anytime.');
  }, []);

  const handlePayment = async () => {
    if (!currentUser?.id) {
      alert('Please log in to make a payment.');
      return;
    }
    
    console.log('PaystackPop available:', !!(window as any).PaystackPop);
    console.log('Current user:', currentUser);
    
    // Wait for Paystack to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!(window as any).PaystackPop && attempts < maxAttempts) {
      console.log(`Waiting for Paystack to load... Attempt ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!(window as any).PaystackPop) {
      alert('Payment system is not available. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    try {
      // Create a simple function reference that Paystack can call
      const callbackFunction = function(response: any) {
        console.log('Paystack callback triggered with:', response);
        handlePaymentSuccess(response);
      };
      
      const closeFunction = function() {
        console.log('Paystack close triggered');
        handlePaymentClose();
      };
      
      const paymentConfig = {
        key: 'pk_live_65167bc2839df9c0dc11ca91e608ce2635abf44b', // Live public key
        email: currentUser.email || 'user@example.com',
        amount: 209900, // Amount in kobo (₦2,099)
        currency: 'NGN',
        ref: `pro_upgrade_${Date.now()}`,
        callback: callbackFunction,
        onClose: closeFunction
      };
      
      console.log('Initializing Paystack with config:', paymentConfig);
      console.log('Callback function type:', typeof paymentConfig.callback);
      console.log('Callback function:', paymentConfig.callback);
      console.log('PaystackPop object:', (window as any).PaystackPop);
      
      // Initialize Paystack payment
      const handler = (window as any).PaystackPop.setup(paymentConfig);
      
      console.log('Paystack handler created:', handler);
      handler.openIframe();
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert(`Error initializing payment: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
        <p className="text-gray-600">Unlock unlimited forms, leads, and advanced analytics</p>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-gray-900">Premium Plan</span>
            <span className="text-2xl font-bold text-blue-600">₦2,099</span>
          </div>
          <span className="text-sm text-gray-500">per month</span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Unlimited forms</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Unlimited leads</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Advanced analytics</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">PDF export</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">AI-powered form building</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800">
            <strong>Secure Payment:</strong> Your payment is processed securely by Paystack
          </span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>💳</span>
            <span>Upgrade to Pro (₦2,099)</span>
          </>
        )}
      </button>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Maybe later
        </button>
      )}
    </div>
  );
};

export default PaystackPayment;

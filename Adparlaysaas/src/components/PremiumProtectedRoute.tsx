import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PremiumProtectedRouteProps {
  children: React.ReactNode;
}

const PremiumProtectedRoute: React.FC<PremiumProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has premium access (active premium subscription, not in grace or expired)
  // Special test accounts with unlimited access
  const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
  const isTestAccount = currentUser.email && testEmails.includes(currentUser.email.toLowerCase());
  
  const hasPremiumAccess = isTestAccount || (currentUser.subscription === 'premium' && 
                         currentUser.paymentStatus === 'active');

  if (!hasPremiumAccess) {
    const isInGracePeriod = currentUser.paymentStatus === 'grace';
    const isExpired = currentUser.subscription === 'free' || 
                     (!currentUser.subscriptionExpiryDate) || 
                     currentUser.paymentStatus === 'expired';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            {isInGracePeriod ? (
              <>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">Grace Period Active</h2>
                <p className="text-gray-600 mb-6">
                  Your subscription has expired but you're in a 5-day grace period. Landing page creation is limited. Upgrade now to maintain full access.
                </p>
              </>
            ) : isExpired ? (
              <>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Subscription Expired</h2>
                <p className="text-gray-600 mb-6">
                  Landing page creation is no longer available. You can view your existing landing pages, but cannot create new ones. Upgrade to Premium to regain access.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
                <p className="text-gray-600 mb-6">
                  Landing page creation is available for premium users only. Upgrade your account to access this powerful feature.
                </p>
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
            >
              {isInGracePeriod ? 'Upgrade Now' : isExpired ? 'Renew Subscription' : 'Upgrade to Premium'}
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Premium features include:</p>
            <ul className="mt-2 space-y-1">
              <li>• Unlimited landing pages</li>
              <li>• Advanced customization</li>
              <li>• Premium templates</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PremiumProtectedRoute;

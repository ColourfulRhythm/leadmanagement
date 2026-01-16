import { useRouter } from 'next/router';
import useAuth from './useAuth';
import { useEffect, useState } from 'react';

const RequireAuth = ({ children }) => {
  const router = useRouter();
  const { auth } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (auth.loading) {
      return;
    }

    // Check if user is authenticated
    // For backend OAuth users, they may not have auth.user but will have auth.token and auth.profile
    // For Firebase users, they will have auth.user and auth.token
    const hasToken = auth?.token;
    const hasUser = auth?.user || auth?.profile; // Either Firebase user or profile is enough
    
    if (!auth || !hasToken || !hasUser) {
      router.push('/login');
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [auth, router]);

  // Show nothing while checking auth or if not authorized
  if (auth.loading || !isAuthorized) {
    return null;
  }

  // Render children only if authorized
  return <>{children}</>;
};

export default RequireAuth;

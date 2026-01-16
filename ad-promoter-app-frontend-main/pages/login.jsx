import { BgContainer } from "@/components/onboardingBg/styles"
import bg from '@/public/assets/bg.png'
import { MobileLogin, Overlay } from "@/styles/login.styles"
import Close from '@/public/assets/close-icon'
import Image from "next/image"
import logo from '@/public/assets/newOnboardLogo.svg'
import SocialBtn from '@/components/socialMediaBtn/index';
import google from '@/public/assets/google.svg';
import fb from '@/public/assets/fb.svg';
import Button from '@/components/authBtn/index'
import { useRouter } from "next/router"
import Link from "next/link"
import { useContext, useState,useEffect } from "react"
import { BsEyeFill,BsEyeSlashFill } from "react-icons/bs"
import { useLogin } from "@/hooks/useLogin"
import useAuth from "@/hooks/useAuth"
import SignupContext from "@/context/signupContext"
import { Spinner, useToast } from "@chakra-ui/react"
import { auth } from '@/lib/firebase'
import { getRedirectResult } from 'firebase/auth'
import { signInWithGoogle, signInWithFacebook, createOrUpdateOAuthUser, getUserProfile } from '@/services/firebase/auth'
import { completeBackendSocialLogin } from '@/services/api/socialAuth'

const Login = () => {
  const router = useRouter();
  const [isPasswordShown,setIsPasswordShown] = useState(false)
  const [userEmail,setUserEmail] = useState('')
  const [userPassword,setUserPassword] = useState('')
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const {setIsInputWithValue} = useContext(SignupContext)
  const {login,isLoading} = useLogin()
  const { setAuth, auth: authState } = useAuth()
  const toast = useToast()
  
  const cleanupOAuthFlags = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('oauth_redirect_in_progress');
    sessionStorage.removeItem('oauth_redirect_start');
  };

  const determineRedirectUrl = (profile) => {
    if (profile?.role === 'placer') return '/placers';
    if (profile?.role === 'promoter') return '/promoters';
    if (profile?.role === 'admin') return '/admin';
    return '/signup/preference';
  };

  const redirectAfterLogin = (profile) => {
    let destination = determineRedirectUrl(profile);
    if (typeof window !== 'undefined') {
      const returnUrl = sessionStorage.getItem('oauth_return_url');
      if (returnUrl && returnUrl !== '/login' && returnUrl !== '/auth/callback') {
        destination = returnUrl;
      }
      sessionStorage.removeItem('oauth_return_url');
      if (window.location.pathname !== destination) {
        window.location.href = destination;
        return;
      }
    }
    router.replace(destination);
  };

  const processOAuthSuccess = async (firebaseUser) => {
    await createOrUpdateOAuthUser(firebaseUser);
    const firestoreProfile = await getUserProfile(firebaseUser.uid);
    let mergedProfile = firestoreProfile
      ? { id: firebaseUser.uid, ...firestoreProfile }
      : { id: firebaseUser.uid, email: firebaseUser.email || '' };

    const firebaseToken = await firebaseUser.getIdToken();
    let tokenToUse = firebaseToken;
    let refreshToken = null;
    let usingBackendToken = false;

    try {
      const backendResult = await completeBackendSocialLogin({
        firebaseUser,
        profile: mergedProfile,
      });

      if (backendResult?.backendUser) {
        mergedProfile = { ...mergedProfile, ...backendResult.backendUser };
      }

      if (backendResult?.token) {
        tokenToUse = backendResult.token;
        usingBackendToken = true;
      }

      if (backendResult?.refreshToken) {
        refreshToken = backendResult.refreshToken;
      }
    } catch (error) {
      console.warn('Backend social login failed:', error);
    }

    setAuth({
      user: firebaseUser,
      profile: mergedProfile,
      token: tokenToUse,
      loading: false,
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('user-token', JSON.stringify(tokenToUse));
      window.localStorage.setItem('user-detail', JSON.stringify(mergedProfile));
      window.localStorage.setItem('auth-source', usingBackendToken ? 'backend-oauth' : 'firebase-oauth');
      if (refreshToken) {
        window.localStorage.setItem('refresh-token', JSON.stringify(refreshToken));
      } else {
        window.localStorage.removeItem('refresh-token');
      }
    }

    return mergedProfile;
  };
  
  useEffect(() => {
    if(userEmail !== '' && userPassword !== '' ){
      setIsInputWithValue(true)
    }else{
      setIsInputWithValue(false)
    }
  })

  // Check for redirect result when page loads (handles OAuth redirects)
  // This MUST run on every page load to catch OAuth redirects
  useEffect(() => {
    let isMounted = true;
    let redirectCheckCompleted = false;
    
    const checkRedirectResult = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRedirect || redirectCheckCompleted) {
        return;
      }
      
      // Check for stale redirect flags (older than 5 minutes)
      if (typeof window !== 'undefined') {
        const redirectStart = sessionStorage.getItem('oauth_redirect_start');
        if (redirectStart) {
          const elapsed = Date.now() - parseInt(redirectStart, 10);
          if (elapsed > 5 * 60 * 1000) { // 5 minutes
            console.log('Clearing stale OAuth redirect flag');
            sessionStorage.removeItem('oauth_redirect_in_progress');
            sessionStorage.removeItem('oauth_return_url');
            sessionStorage.removeItem('oauth_redirect_start');
            setIsOAuthLoading(false);
            redirectCheckCompleted = true;
            return;
          }
        }
      }
      
      // IMPORTANT: Always check getRedirectResult FIRST, even if user appears authenticated
      // This is because getRedirectResult can only be called once per redirect, and it must
      // be called on the page that receives the redirect. If we skip this check, we'll lose
      // the redirect result and the user will be stuck in a loop.
      try {
        setIsCheckingRedirect(true);
        
        // Check if we're coming back from an OAuth redirect
        const isOAuthRedirect = typeof window !== 'undefined' && 
          sessionStorage.getItem('oauth_redirect_in_progress') === 'true';
        
        // Store safety timeout reference to clear it later
        let safetyTimeout = null;
        
        if (isOAuthRedirect) {
          console.log('Checking for OAuth redirect result...');
          setIsOAuthLoading(true);
          
          // Safety timeout: if redirect check takes more than 30 seconds, clear the loading state
          safetyTimeout = setTimeout(() => {
            if (!isMounted) return;
            console.warn('Redirect check timeout - clearing loading state');
            setIsOAuthLoading(false);
            setIsCheckingRedirect(false);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('oauth_redirect_in_progress');
              sessionStorage.removeItem('oauth_return_url');
              sessionStorage.removeItem('oauth_redirect_start');
            }
            toast({
              title: 'Sign in timeout',
              description: 'The sign-in process took too long. Please try again.',
              status: 'error',
              duration: '5000',
              isClosable: true,
              position: 'bottom-left',
            });
          }, 30000); // 30 second timeout
        }
        
        // IMPORTANT: getRedirectResult must be called on the page that the redirect returns to
        // It can only be called once per redirect, so we need to call it immediately
        // This is safe to call even if there's no redirect - it will just return null
        // We MUST call this before checking auth state to avoid losing the redirect result
        // Add timeout wrapper to prevent hanging
        const redirectResultPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getRedirectResult timeout')), 25000)
        );
        
        const result = await Promise.race([redirectResultPromise, timeoutPromise]);
        
        if (!isMounted) return;
        redirectCheckCompleted = true;
        
        if (result && result.user) {
          console.log('OAuth redirect result received:', result.user.email);
          
          cleanupOAuthFlags();
          
          try {
            const mergedProfile = await processOAuthSuccess(result.user);
            if (!isMounted) return;

            if (safetyTimeout) {
              clearTimeout(safetyTimeout);
            }
            
            setIsOAuthLoading(false);
            setIsCheckingRedirect(false);
            
            toast({
              title: 'Signed in successfully',
              status: 'success',
              duration: '5000',
              isClosable: true,
              position: 'bottom-left',
            });
            
            redirectAfterLogin(mergedProfile);
            return; // Exit early after handling redirect result
          } catch (profileError) {
            console.error('Error processing redirect result:', profileError);
            if (safetyTimeout) {
              clearTimeout(safetyTimeout);
            }
            setIsOAuthLoading(false);
            setIsCheckingRedirect(false);
            cleanupOAuthFlags();
            toast({
              title: 'Error completing sign in',
              description: profileError.message || 'Failed to complete sign in',
              status: 'error',
              duration: '5000',
              isClosable: true,
              position: 'bottom-left',
            });
            return;
          }
        } else {
          // No redirect result - this is normal on regular page loads
          // Clear the flag if it was set but no result (user cancelled or error)
          if (typeof window !== 'undefined' && isOAuthRedirect) {
            console.log('No redirect result found, clearing flag');
            // Clear safety timeout if it was set
            if (safetyTimeout) {
              clearTimeout(safetyTimeout);
            }
            sessionStorage.removeItem('oauth_redirect_in_progress');
            sessionStorage.removeItem('oauth_return_url');
            sessionStorage.removeItem('oauth_redirect_start');
            setIsOAuthLoading(false);
            
            // If we were expecting a redirect but got nothing, it might have been cancelled
            // Don't show an error - user might have just cancelled
          }
          setIsCheckingRedirect(false);
          
          // After checking redirect result, if user is already authenticated, redirect them
          // This prevents authenticated users from staying on the login page
          // Check for either Firebase user OR profile (for backend OAuth users)
          const isAuthenticated = (authState?.user && authState?.user.uid) || (authState?.profile && authState?.token);
          if (isAuthenticated && !authState?.loading) {
            const profile = authState.profile;
            let redirectUrl = '/signup/preference';
            if (profile?.role === 'placer') {
              redirectUrl = '/placers';
            } else if (profile?.role === 'promoter') {
              redirectUrl = '/promoters';
            } else if (profile?.role === 'admin') {
              redirectUrl = '/admin';
            }
            
            // Use window.location for more reliable redirect
            if (typeof window !== 'undefined') {
              window.location.href = redirectUrl;
            } else {
              router.replace(redirectUrl);
            }
          }
        }
      } catch (error) {
        if (!isMounted) return;
        redirectCheckCompleted = true;
        
        // Clear safety timeout if it was set
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
        }
        
        console.error('Error checking redirect result:', error);
        setIsCheckingRedirect(false);
        setIsOAuthLoading(false);
        
        // Clear the redirect flags on error
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_redirect_in_progress');
          sessionStorage.removeItem('oauth_return_url');
          sessionStorage.removeItem('oauth_redirect_start');
        }
        
        // Show error toast for actual errors (not just no redirect result)
        // auth/no-auth-event is normal when there's no redirect result
        // Timeout errors should be shown
        if (error.message && error.message.includes('timeout')) {
          toast({
            title: 'Sign in timeout',
            description: 'The sign-in process took too long. Please try again.',
            status: 'error',
            duration: '5000',
            isClosable: true,
            position: 'bottom-left',
          });
        } else if (error.code && error.code !== 'auth/no-auth-event' && error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: 'Authentication error',
            description: error.message || 'Failed to complete sign in',
            status: 'error',
            duration: '5000',
            isClosable: true,
            position: 'bottom-left',
          });
        }
      }
    };
    
    // Always check on mount - getRedirectResult is safe to call even if there's no redirect
    // Use a small delay to ensure Firebase auth is initialized
    const timeoutId = setTimeout(() => {
      checkRedirectResult();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Only run once on mount to avoid missing redirect results

  // Auto-trigger OAuth if provider query param is present (only once)
  useEffect(() => {
    const { provider } = router.query;
    if (provider === 'google' && router.isReady) {
      handleGoogleSignIn();
      // Remove query param to prevent re-triggering
      router.replace('/login', undefined, { shallow: true });
    } else if (provider === 'facebook' && router.isReady) {
      handleFbSignIn();
      // Remove query param to prevent re-triggering
      router.replace('/login', undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.provider])

  const handleSubmit = (e) => {
    e.preventDefault()
   if(userEmail && userPassword !== ''){
    login(userEmail,userPassword)    
   }
  }

  const handleGoogleSignIn = async () => {
    if (isOAuthLoading) return;
    
    try {
      setIsOAuthLoading(true);
      const firebaseUser = await signInWithGoogle();
      
      if (firebaseUser) {
        const mergedProfile = await processOAuthSuccess(firebaseUser);
        cleanupOAuthFlags();
        setIsOAuthLoading(false);
        toast({
          title: 'Signed in successfully',
          status: 'success',
          duration: '5000',
          isClosable: true,
          position: 'bottom-left',
        });
        redirectAfterLogin(mergedProfile);
      }
      // If firebaseUser is null, we're in redirect mode on mobile – the redirect handler will complete the flow.
    } catch (error) {
      console.error('Error initiating Google sign in:', error);
      setIsOAuthLoading(false);
      cleanupOAuthFlags();
      toast({
        title: error.message || 'Failed to sign in with Google',
        status: 'error',
        duration: '5000',
        isClosable: true,
        position: 'bottom-left',
      });
    }
  };

  const handleFbSignIn = async () => {
    if (isOAuthLoading) return;
    
    try {
      setIsOAuthLoading(true);
      const firebaseUser = await signInWithFacebook();
      
      if (firebaseUser) {
        const mergedProfile = await processOAuthSuccess(firebaseUser);
        cleanupOAuthFlags();
        setIsOAuthLoading(false);
        toast({
          title: 'Signed in successfully',
          status: 'success',
          duration: '5000',
          isClosable: true,
          position: 'bottom-left',
        });
        redirectAfterLogin(mergedProfile);
      }
      // If firebaseUser is null, the redirect flow will be handled separately.
    } catch (error) {
      console.error('Error initiating Facebook sign in:', error);
      setIsOAuthLoading(false);
      cleanupOAuthFlags();
      toast({
        title: error.message || 'Failed to sign in with Facebook',
        status: 'error',
        duration: '5000',
        isClosable: true,
        position: 'bottom-left',
      });
    }
  };

  // Show loading state while processing OAuth redirect
  if (isCheckingRedirect || (isOAuthLoading && typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect_in_progress') === 'true')) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          textAlign: 'center',
          gap: '20px',
        }}
      >
        <h3>Completing sign in...</h3>
        <Spinner />
      </div>
    );
  }

  return (
    <>
    <BgContainer image={bg}>
    <Overlay className='overlay'>
        <div className="close" onClick={()=>router.push('/')}>
          <Close />
        </div>
        <div className="content">
          <div className="content-header">
            <Image src={logo} alt='ad-promoter logo'/>
            <div className="content-header-text">
              <h3>Log in</h3>
              <p>Don’t have an account? <Link href='/signup'><a>Sign up</a></Link></p>
            </div>
          </div>
          <div className="content-socials">
            <div onClick={handleGoogleSignIn}>
              <SocialBtn icon={google} text="Google" />
            </div>
            <div onClick={handleFbSignIn}>
              <SocialBtn icon={fb} text="Facebook" />
            </div>
          </div>
          <div className="divider">
            <div></div>
            <p>OR</p>
            <div></div>
          </div>
          <form action="" onSubmit={handleSubmit}>
            <div className="email">
              <label htmlFor="email">Your Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                autoComplete="email"
                required
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                />
            </div>
            <div className="password">
              <div className="input-container">
                <div className="label">
                  <label htmlFor="password">Your password</label>
                  <div className="hide" onClick={()=>setIsPasswordShown(!isPasswordShown)}>
                    {isPasswordShown ? (
                      <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                      ):(
                      <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                    )}
                    {isPasswordShown ? (
                      <p>Hide</p>
                    ):(
                      <p>Show</p>
                    )}
                  </div>
                </div>
                <input  
                  id="password"
                  name='password'
                  autoComplete="current-password"
                  required
                  type={isPasswordShown ? "text" : "password"}
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                />
              </div>
              <div style={{cursor: 'pointer'}} onClick={()=>router.push('/password-recovery')} className="error-container">
                <p>Forgot your password</p>
              </div>
            </div>
            <Button text={isLoading ? <Spinner /> : 'Log in'} />
          </form>
        </div>
      </Overlay>
    </BgContainer>
    <MobileLogin>
      <div className="logo">
        <Image src={logo} alt='ad-promoter logo'/>
        <div className="login">
          <h3>Log in</h3>
          <p>Don’t have an account? <Link href='/signup'><a>Sign up</a></Link></p>
        </div>
      </div>
      <div className="content-socials">
        <div onClick={handleGoogleSignIn} style={{ opacity: isOAuthLoading ? 0.6 : 1, pointerEvents: isOAuthLoading ? 'none' : 'auto' }}>
          <SocialBtn icon={google} text={isOAuthLoading ? "Loading..." : "Google"} />
        </div>
        <div onClick={handleFbSignIn} style={{ opacity: isOAuthLoading ? 0.6 : 1, pointerEvents: isOAuthLoading ? 'none' : 'auto' }}>
          <SocialBtn icon={fb} text={isOAuthLoading ? "Loading..." : "Facebook"} />
        </div>
      </div>
      <div className="divider">
        <div></div>
        <p>or</p>
        <div></div>
      </div>
      <form action="" onSubmit={handleSubmit}>
        <div className="email">
          <label htmlFor="email">Your Email</label>
          <input 
            type="email" 
            id="memail" 
            autoComplete="email"
            required
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            />
        </div>
        <div className="password">
          <div className="input-container">
            <div className="label">
              <label htmlFor="password">Your password</label>
              <div className="hide" onClick={()=>setIsPasswordShown(!isPasswordShown)}>
                {isPasswordShown ? (
                  <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                  ):(
                  <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                )}
                {isPasswordShown ? (
                  <p>Hide</p>
                ):(
                  <p>Show</p>
                )}
              </div>
            </div>
            <input  
              id="mpassword"
              name='password'
              autoComplete="current-password"
              required
              type={isPasswordShown ? "text" : "password"}
              value={userPassword}
              onChange={e => setUserPassword(e.target.value)}
            />
          </div>
          <p style={{cursor: 'pointer'}} onClick={()=>router.push('/password-recovery')}>Forgot your password</p>
        </div>
        <Button text={isLoading ? <Spinner /> : 'Log in'} />
      </form>
    </MobileLogin>
    </>
  )
}

export default Login
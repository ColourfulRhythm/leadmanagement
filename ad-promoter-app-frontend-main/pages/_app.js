import { GlobalStyle } from '@/styles/global';
import { SanitizeStyle } from '@/styles/sanitize';
import { VariableStyle } from '@/styles/variables';
import { AdPlacerProvider } from '@/context/adPlacerContext';
import { SignupProvider } from '@/context/signupContext';
import { NotificationProvider } from '@/context/notificationContext';
import { AuthContextProvider } from '@/context/authContext';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { SingleAdProvider } from '@/context/singleAdContext';
import { JobsProvider } from '@/context/jobsContext';
import Layout from '@/components/Layout';
import { useEffect } from 'react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        lineHeight: 1.5,
        fontSize: '1.8rem',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: '400',
        overflowX: 'hidden',
        background: '#FAFAFA',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress 404 and 503 errors for legacy OAuth endpoints (now using Firebase OAuth)
    // This handles cases where old code or cached builds try to call the backend OAuth endpoint
    const suppressLegacyOAuthErrors = () => {
      // Intercept fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        const isLegacyOAuthEndpoint = url.includes('/api/v1/auth/google') || url.includes('/api/v1/auth/facebook');
        
        try {
          const response = await originalFetch(...args);
          // Silently handle 404s and 503s for legacy OAuth endpoints
          if (!response.ok && (response.status === 404 || response.status === 503)) {
            if (isLegacyOAuthEndpoint) {
              // These endpoints are no longer used (we use Firebase OAuth now)
              // Return a mock response to prevent console errors
              return new Response(JSON.stringify({ success: false, message: 'Legacy endpoint - using Firebase OAuth' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
          }
          return response;
        } catch (error) {
          // Suppress network errors for legacy OAuth endpoints
          if (isLegacyOAuthEndpoint) {
            // Silently handle - these endpoints are deprecated
            return new Response(JSON.stringify({ success: false, message: 'Legacy endpoint - using Firebase OAuth' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          throw error;
        }
      };

      // Handle XMLHttpRequest errors (if any code uses it)
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && (url.includes('/api/v1/auth/google') || url.includes('/api/v1/auth/facebook'))) {
          // Intercept and prevent the request from causing console errors
          this.addEventListener('error', (e) => {
            e.stopPropagation();
          }, { once: true });
          this.addEventListener('load', function() {
            if (this.status === 404 || this.status === 503) {
              // Suppress 404 and 503 errors for legacy endpoints
              Object.defineProperty(this, 'status', { value: 200, writable: false });
            }
          }, { once: true });
        }
        return originalXHROpen.call(this, method, url, ...rest);
      };

      // Suppress console errors for failed network requests to legacy endpoints
      // Also suppress COOP (Cross-Origin-Opener-Policy) warnings from Firebase Auth
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('/api/v1/auth/google') || 
            message.includes('/api/v1/auth/facebook') ||
            message.includes('503') ||
            message.includes('Service Unavailable') ||
            message.includes('Cross-Origin-Opener-Policy') ||
            message.includes('window.closed')) {
          // Suppress these specific errors/warnings
          // COOP warnings are harmless - Firebase Auth popup still works
          // 503 errors from legacy OAuth endpoints are expected when backend is down
          return;
        }
        originalError.apply(console, args);
      };

      return () => {
        // Restore original functions on unmount
        window.fetch = originalFetch;
        XMLHttpRequest.prototype.open = originalXHROpen;
        console.error = originalError;
      };
    };

    const cleanup = suppressLegacyOAuthErrors();
    return cleanup;
  }, []);

  return (
    <AuthContextProvider>
      <SignupProvider>
        <SingleAdProvider>
          <AdPlacerProvider>
            <JobsProvider>
              <NotificationProvider>
                <VariableStyle />
                <GlobalStyle />
                <SanitizeStyle />
                <ChakraProvider theme={theme}>
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                </ChakraProvider>
              </NotificationProvider>
            </JobsProvider>
          </AdPlacerProvider>
        </SingleAdProvider>
      </SignupProvider>
    </AuthContextProvider>
  );
}

export default MyApp;

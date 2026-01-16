import { buildApiUrl } from '@/lib/config';

const DEFAULT_RESULT = {
  token: null,
  refreshToken: null,
  backendUser: null,
  createdUser: false,
  requiresProfileCompletion: false,
};

const parseResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    // Ignore JSON parse errors – payload stays null
  }

  if (!response.ok) {
    const error = new Error(
      payload?.msg || payload?.message || `Request failed (${response.status})`,
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload || {};
};

const extractTokens = (payload = {}) => {
  const dataSection = payload.data && typeof payload.data === 'object'
    ? payload.data
    : null;

  const token =
    payload.token ||
    payload.accessToken ||
    dataSection?.token ||
    dataSection?.accessToken ||
    null;

  const refreshToken =
    payload.refreshToken ||
    dataSection?.refreshToken ||
    null;

  const backendUser =
    payload.user ||
    dataSection?.user ||
    dataSection ||
    null;

  return { token, refreshToken, backendUser };
};

/**
 * Syncs Google/Facebook OAuth sign-in with the legacy NestJS backend.
 * The backend currently exposes Google-named routes for all social logins,
 * so we reuse those endpoints for every provider.
 */
export const completeBackendSocialLogin = async ({
  firebaseUser,
  profile,
  forceSetup = false,
} = {}) => {
  if (!firebaseUser?.email) {
    throw new Error('OAuth account is missing an email address.');
  }

  const result = { ...DEFAULT_RESULT };
  const encodedEmail = encodeURIComponent(firebaseUser.email);
  const signInPath = `/api/v1/auth/google-auth-signIn/${encodedEmail}`;
  const setupPath = '/api/v1/auth/google-auth-setup';

  const attemptSignIn = async () => {
    try {
      const response = await fetch(buildApiUrl(signInPath));
      // Handle 503 Service Unavailable - backend might be down
      if (response.status === 503) {
        console.warn('Backend service unavailable (503). OAuth login will continue with Firebase only.');
        throw new Error('Backend service temporarily unavailable');
      }
      return parseResponse(response);
    } catch (error) {
      // If it's a 503 or network error, allow OAuth to continue with Firebase only
      if (error.message.includes('503') || error.message.includes('Service Unavailable') || error.name === 'TypeError') {
        console.warn('Backend unavailable for OAuth sync. Continuing with Firebase authentication only.');
        // Return default result - user can still login with Firebase
        return null; // Will trigger setup flow or return early
      }
      throw error;
    }
  };

  const attemptSetup = async () => {
    if (!profile?.role) {
      result.requiresProfileCompletion = true;
      if (forceSetup) {
        throw new Error(
          'Role selection is required before completing account setup.',
        );
      }
      return null;
    }

    const payload = {
      email: firebaseUser.email,
      googleId: firebaseUser.uid,
      role: profile.role,
      seeVisualAd: !!profile.seeVisualAd,
      socialLink: profile.socialLink || '',
      accountName:
        profile.accountName ||
        firebaseUser.displayName ||
        firebaseUser.email ||
        '',
    };

    try {
      const response = await fetch(buildApiUrl(setupPath), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle 503 Service Unavailable
      if (response.status === 503) {
        console.warn('Backend service unavailable (503) during OAuth setup. User can still login with Firebase.');
        // Return null to allow Firebase-only authentication
        return null;
      }

      result.createdUser = true;
      return parseResponse(response);
    } catch (error) {
      // If it's a 503 or network error, allow OAuth to continue with Firebase only
      if (error.message.includes('503') || error.message.includes('Service Unavailable') || error.name === 'TypeError') {
        console.warn('Backend unavailable for OAuth setup. Continuing with Firebase authentication only.');
        return null; // Will allow Firebase-only login
      }
      throw error;
    }
  };

  let payload = null;

  if (!forceSetup) {
    try {
      payload = await attemptSignIn();
    } catch (error) {
      // Handle 503 or backend unavailable - allow Firebase-only login
      if (error.status === 503 || error.message.includes('503') || error.message.includes('Service Unavailable')) {
        console.warn('Backend unavailable. OAuth login will continue with Firebase authentication only.');
        // Return default result - user can still login with Firebase, just won't have backend JWT
        return result;
      }
      
      if (error.status === 401 || error.status === 404) {
        payload = await attemptSetup();
        if (!payload) {
          // Profile completion required or backend unavailable – return early with default result
          return result;
        }
      } else {
        throw error;
      }
    }
  } else {
    payload = await attemptSetup();
    if (!payload) {
      return result;
    }
  }

  if (payload) {
    const tokens = extractTokens(payload);
    result.token = tokens.token;
    result.refreshToken = tokens.refreshToken;
    result.backendUser = tokens.backendUser;
  }

  return result;
};



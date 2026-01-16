const normalizeBaseUrl = (url) => {
  if (!url) {
    return '';
  }

  return url.replace(/\/+$/, '');
};

// Firebase Functions routing:
// - Function name: 'api' 
// - Firebase Function URL: .../cloudfunctions.net/api
// - NestJS global prefix: 'api/v1'
// - To call /api/v1/ads/create in NestJS:
//   1. URL: .../api/api/v1/ads/create
//   2. Firebase strips first '/api' (function name)
//   3. Passes '/api/v1/ads/create' to NestJS ✅
// Default to Firebase Functions (more reliable than Render)
const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  'https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api';

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl);

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isFirebaseFunctions = API_BASE_URL.includes('cloudfunctions.net');
  
  // For Firebase Functions:
  // - Base URL: https://...cloudfunctions.net/api (Firebase function name is 'api')
  // - Path: /v1/ads/create
  // - Firebase strips the first '/api' (function name) from the URL
  // - If NestJS global prefix is 'api/v1', we need: .../api/api/v1/ads/create
  //   Firebase strips first '/api' → passes '/api/v1/ads/create' to NestJS ✅
  // - If NestJS global prefix is 'v1', we need: .../api/v1/ads/create
  //   Firebase strips first '/api' → passes '/v1/ads/create' to NestJS ✅
  // Based on the CORS error, it seems NestJS expects '/v1/ads/create' (no 'api' prefix)
  // So we should send: .../api/v1/ads/create (Firebase strips '/api' → '/v1/ads/create')
  if (isFirebaseFunctions && normalizedPath.startsWith('/v1')) {
    if (API_BASE_URL.endsWith('/api')) {
      // Base URL ends with /api, path starts with /v1
      // Result: .../api/v1/ads/create
      // Firebase strips '/api' → passes '/v1/ads/create' to NestJS ✅
      return `${API_BASE_URL}${normalizedPath}`;
    } else if (API_BASE_URL.endsWith('/api/api')) {
      // Already has /api/api, just add path (shouldn't happen but handle it)
      return `${API_BASE_URL}${normalizedPath}`;
    } else {
      // No /api, add /api
      return `${API_BASE_URL}/api${normalizedPath}`;
    }
  }
  
  // For Firebase Functions with /api/v1 path (if needed in future)
  if (isFirebaseFunctions && normalizedPath.startsWith('/api/v1')) {
    if (API_BASE_URL.endsWith('/api')) {
      // Base URL ends with /api, path starts with /api/v1
      // Result: .../api/api/v1/ads/create
      // Firebase strips '/api' → passes '/api/v1/ads/create' to NestJS
      return `${API_BASE_URL}/api${normalizedPath}`;
    }
  }
  
  // For non-Firebase: base URL might be http://localhost:4000 or similar
  // If base URL ends with /api and path starts with /api/v1, remove /api from path to avoid double /api
  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/v1')) {
    const correctedPath = normalizedPath.replace(/^\/api/, '');
    return `${API_BASE_URL}${correctedPath}`;
  }
  
  // For non-Firebase: path should start with /api/v1 or /v1
  if (!isFirebaseFunctions) {
    if (normalizedPath.startsWith('/v1') && !API_BASE_URL.includes('/api')) {
      // Local dev: base is localhost:4000, path is /v1/..., NestJS expects /api/v1/...
      return `${API_BASE_URL}/api${normalizedPath}`;
    }
  }
  
  // Default: just concatenate
  return `${API_BASE_URL}${normalizedPath}`;
};


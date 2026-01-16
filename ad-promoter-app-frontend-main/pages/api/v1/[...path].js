import { API_BASE_URL } from '@/lib/config';

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Only allow GET, POST, PUT, DELETE, PATCH methods
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_BASE_URL) {
    return res.status(500).json({ 
      error: 'Backend API URL not configured',
      message: 'NEXT_PUBLIC_API_BASE_URL environment variable is not set' 
    });
  }

  try {
    // Get the path from the catch-all route
    // The route is /api/v1/[...path], so path will be everything after /api/v1/
    const path = req.query.path || [];
    const pathString = Array.isArray(path) ? path.join('/') : path;
    
    // Handle legacy OAuth endpoints - redirect to login page with Firebase OAuth
    // These endpoints are deprecated and should use Firebase OAuth instead
    if (pathString === 'auth/google' || 
        pathString === 'auth/facebook' ||
        pathString.startsWith('auth/google-redirect') ||
        pathString.startsWith('auth/facebook/redirect')) {
      // Determine provider from path
      let provider = 'google';
      if (pathString.includes('facebook')) {
        provider = 'facebook';
      }
      
      // Return a redirect response
      res.setHeader('Location', `/login?provider=${provider}`);
      return res.status(301).json({
        success: false,
        message: 'Legacy OAuth endpoint deprecated. Please use Firebase OAuth.',
        redirect: `/login?provider=${provider}`
      });
    }
    
    // Construct the backend URL
    // API_BASE_URL should be something like: https://us-central1-ad-promoter-36ef7.cloudfunctions.net/api
    // pathString will be like: "ads/recent-ads" or "user/saved-jobs"
    // We need to construct: API_BASE_URL + "/api/v1/" + pathString
    // But if API_BASE_URL already ends with /api, we just add /v1/
    let backendPath;
    if (API_BASE_URL.endsWith('/api')) {
      backendPath = `/v1/${pathString}`;
    } else {
      backendPath = `/api/v1/${pathString}`;
    }
    
    const backendUrl = `${API_BASE_URL}${backendPath}`;
    
    // Build query string from query parameters (excluding 'path')
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        const value = req.query[key];
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Forward other important headers
    if (req.headers['x-requested-with']) {
      headers['x-requested-with'] = req.headers['x-requested-with'];
    }

    // Prepare request options
    const options = {
      method: req.method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Make request to backend
    const response = await fetch(fullUrl, options);
    
    // Forward CORS headers to allow the frontend to access the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      data = await response.text().catch(() => '');
    }
    
    // Forward status and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Request URL:', req.url);
    console.error('API_BASE_URL:', API_BASE_URL);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}


import { withAuth, AuthenticatedRequest } from '../../_middleware';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-sheets/callback`;

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Client ID not configured' });
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ 
      userId: req.user.uid,
      timestamp: Date.now()
    })).toString('base64');

    // Google OAuth2 URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Google Sheets auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
}

export default withAuth(handler);

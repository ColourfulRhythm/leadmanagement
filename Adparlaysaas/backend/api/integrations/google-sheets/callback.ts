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
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info to create a default spreadsheet
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Create a default spreadsheet
    const spreadsheetResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Form Submissions - ${userInfo.name || 'User'}`,
        },
        sheets: [{
          properties: {
            title: 'Submissions',
          },
        }],
      }),
    });

    if (!spreadsheetResponse.ok) {
      throw new Error('Failed to create spreadsheet');
    }

    const spreadsheet = await spreadsheetResponse.json();

    // Return success with tokens and spreadsheet ID
    const successData = {
      type: 'GOOGLE_SHEETS_AUTH_SUCCESS',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      spreadsheetId: spreadsheet.spreadsheetId,
    };

    // Send message to parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sheets Integration</title>
        </head>
        <body>
          <script>
            window.opener.postMessage(${JSON.stringify(successData)}, window.location.origin);
            window.close();
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in Google Sheets callback:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sheets Integration Error</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_SHEETS_AUTH_ERROR',
              error: 'Failed to connect to Google Sheets'
            }, window.location.origin);
            window.close();
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}

export default withAuth(handler);

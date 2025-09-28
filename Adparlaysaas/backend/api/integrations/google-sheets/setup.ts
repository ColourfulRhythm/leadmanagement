import admin from 'firebase-admin';
import { withAuth, AuthenticatedRequest } from '../../_middleware';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

interface GoogleSheetsSetupRequest {
  formId: string;
  spreadsheetId: string;
  sheetName: string;
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      formId,
      spreadsheetId,
      sheetName,
      accessToken,
      refreshToken,
      clientId,
      clientSecret
    }: GoogleSheetsSetupRequest = req.body;

    if (!formId || !spreadsheetId || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing required fields: formId, spreadsheetId, accessToken' 
      });
    }

    // Store the Google Sheets integration configuration
    const integrationData = {
      formId,
      spreadsheetId,
      sheetName: sheetName || 'Form Responses',
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('googleSheetsIntegrations').add(integrationData);

    // Update the form to indicate it has Google Sheets integration
    await db.collection('forms').doc(formId).update({
      hasGoogleSheetsIntegration: true,
      googleSheetsSpreadsheetId: spreadsheetId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      message: 'Google Sheets integration setup successfully',
      spreadsheetId,
      sheetName: sheetName || 'Form Responses'
    });

  } catch (error) {
    console.error('Error setting up Google Sheets integration:', error);
    res.status(500).json({ 
      error: 'Failed to setup Google Sheets integration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

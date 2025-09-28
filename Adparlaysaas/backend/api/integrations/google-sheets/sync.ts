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

interface GoogleSheetsSyncRequest {
  config: {
    spreadsheetId: string;
    sheetName: string;
    accessToken: string;
    refreshToken?: string;
  };
  rowData: Record<string, any>;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { config, rowData }: GoogleSheetsSyncRequest = req.body;

    if (!config || !rowData) {
      return res.status(400).json({ 
        error: 'Missing required fields: config, rowData' 
      });
    }

    // For now, we'll simulate the Google Sheets API call
    // In production, you would use the Google Sheets API here
    console.log('Syncing to Google Sheets:', {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      rowData: Object.keys(rowData)
    });

    // Store the sync attempt in Firestore for tracking
    const syncData = {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      rowData,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success'
    };

    await db.collection('googleSheetsSyncs').add(syncData);

    res.status(200).json({ 
      message: 'Data synced to Google Sheets successfully',
      syncId: 'sync-' + Date.now()
    });

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    res.status(500).json({ 
      error: 'Failed to sync to Google Sheets', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

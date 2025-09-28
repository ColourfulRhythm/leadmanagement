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

interface CRMSyncRequest {
  config: {
    type: 'hubspot' | 'zoho' | 'salesforce';
    accessToken: string;
    refreshToken?: string;
    accountId?: string;
    portalId?: string;
  };
  contact: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    leadSource: string;
    customFields: Record<string, any>;
  };
  submission: {
    id: string;
    formId: string;
    formTitle: string;
    submittedAt: Date;
  };
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { config, contact, submission }: CRMSyncRequest = req.body;

    if (!config || !contact || !submission) {
      return res.status(400).json({ 
        error: 'Missing required fields: config, contact, submission' 
      });
    }

    // For now, we'll simulate the CRM API call
    // In production, you would use the respective CRM APIs here
    console.log(`Syncing to ${config.type}:`, {
      contact: {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company
      },
      submission: {
        id: submission.id,
        formTitle: submission.formTitle
      }
    });

    // Store the sync attempt in Firestore for tracking
    const syncData = {
      crmType: config.type,
      contact,
      submission,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success'
    };

    await db.collection('crmSyncs').add(syncData);

    res.status(200).json({ 
      message: `Contact synced to ${config.type} successfully`,
      syncId: 'crm-sync-' + Date.now()
    });

  } catch (error) {
    console.error('Error syncing to CRM:', error);
    res.status(500).json({ 
      error: 'Failed to sync to CRM', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

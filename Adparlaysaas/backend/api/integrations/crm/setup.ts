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

interface CRMSetupRequest {
  formId: string;
  type: 'hubspot' | 'zoho' | 'salesforce';
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
  accountId?: string;
  portalId?: string;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      formId,
      type,
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      accountId,
      portalId
    }: CRMSetupRequest = req.body;

    if (!formId || !type || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing required fields: formId, type, accessToken' 
      });
    }

    // Store the CRM integration configuration
    const integrationData = {
      formId,
      type,
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      accountId,
      portalId,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('crmIntegrations').add(integrationData);

    // Update the form to indicate it has CRM integration
    await db.collection('forms').doc(formId).update({
      hasCRMIntegration: true,
      crmType: type,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      message: `${type} integration setup successfully`,
      type,
      accountId,
      portalId
    });

  } catch (error) {
    console.error('Error setting up CRM integration:', error);
    res.status(500).json({ 
      error: 'Failed to setup CRM integration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

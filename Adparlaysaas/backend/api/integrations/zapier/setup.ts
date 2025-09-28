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

interface ZapierSetupRequest {
  formId: string;
  webhookUrl: string;
  isActive: boolean;
  customFields?: Record<string, any>;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      formId,
      webhookUrl,
      isActive,
      customFields
    }: ZapierSetupRequest = req.body;

    if (!formId || !webhookUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: formId, webhookUrl' 
      });
    }

    // Validate webhook URL
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== 'https:') {
        return res.status(400).json({ 
          error: 'Webhook URL must use HTTPS' 
        });
      }
    } catch {
      return res.status(400).json({ 
        error: 'Invalid webhook URL format' 
      });
    }

    // Store the Zapier integration configuration
    const integrationData = {
      formId,
      webhookUrl,
      isActive: isActive !== false, // Default to true
      customFields: customFields || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('zapierIntegrations').add(integrationData);

    // Update the form to indicate it has Zapier integration
    await db.collection('forms').doc(formId).update({
      hasZapierIntegration: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      message: 'Zapier integration setup successfully',
      webhookUrl,
      isActive: integrationData.isActive
    });

  } catch (error) {
    console.error('Error setting up Zapier integration:', error);
    res.status(500).json({ 
      error: 'Failed to setup Zapier integration', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

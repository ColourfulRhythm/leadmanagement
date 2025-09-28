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

interface ZapierTriggerRequest {
  config: {
    webhookUrl: string;
    customFields?: Record<string, any>;
  };
  webhookData: Record<string, any>;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { config, webhookData }: ZapierTriggerRequest = req.body;

    if (!config || !webhookData) {
      return res.status(400).json({ 
        error: 'Missing required fields: config, webhookData' 
      });
    }

    // For now, we'll simulate the webhook call
    // In production, you would make an actual HTTP request to the webhook URL
    console.log('Triggering Zapier webhook:', {
      webhookUrl: config.webhookUrl,
      dataKeys: Object.keys(webhookData)
    });

    // Store the webhook trigger attempt in Firestore for tracking
    const triggerData = {
      webhookUrl: config.webhookUrl,
      webhookData,
      triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success'
    };

    await db.collection('zapierTriggers').add(triggerData);

    res.status(200).json({ 
      message: 'Zapier webhook triggered successfully',
      triggerId: 'zapier-trigger-' + Date.now()
    });

  } catch (error) {
    console.error('Error triggering Zapier webhook:', error);
    res.status(500).json({ 
      error: 'Failed to trigger Zapier webhook', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

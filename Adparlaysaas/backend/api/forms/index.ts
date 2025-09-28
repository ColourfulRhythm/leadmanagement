import admin from 'firebase-admin';
import { withAuth, AuthenticatedRequest } from '../_middleware';

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

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method === 'POST') {
    // Create new form
    try {
      const formData = req.body;
      const docRef = await db.collection('forms').add(formData);
      res.status(201).json({ id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create form', details: error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler); 
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
  const { id } = req.query;

  if (req.method === 'GET') {
    // Get specific form
    try {
      const doc = await db.collection('forms').doc(id as string).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Form not found' });
      }
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch form', details: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler); 
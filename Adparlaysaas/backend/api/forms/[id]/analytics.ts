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
    // Get analytics for a form
    try {
      const snapshot = await db.collection('forms').doc(id as string).collection('submissions').get();
      res.json({ submissionCount: snapshot.size });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics', details: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler); 
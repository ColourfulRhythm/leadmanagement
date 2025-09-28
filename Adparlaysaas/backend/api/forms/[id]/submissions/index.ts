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

async function handler(req: AuthenticatedRequest, res: any) {
  const { id } = req.query;

  if (req.method === 'POST') {
    // Create new submission
    try {
      const submission = req.body;
      await db.collection('forms').doc(id as string).collection('submissions').add(submission);
      res.status(201).json({ message: 'Submission saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save submission', details: error });
    }
  } else if (req.method === 'GET') {
    // Get all submissions for a form
    try {
      const snapshot = await db.collection('forms').doc(id as string).collection('submissions').get();
      const submissions = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch submissions', details: error });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler); 
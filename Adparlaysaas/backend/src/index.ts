import express from 'express';
import cors from 'cors';
import { db, admin } from './firebaseAdmin';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Apply auth middleware to all routes except root
app.use((req, res, next) => {
  if (req.path === '/') return next();
  authenticateToken(req, res, next);
});

app.get('/', (req, res) => {
  res.send('Adparlay Backend is running!');
});

// Forms CRUD
app.post('/forms', async (req, res) => {
  try {
    const formData = req.body;
    const docRef = await db.collection('forms').add(formData);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create form', details: error });
  }
});

app.get('/forms/:id', async (req, res) => {
  try {
    const doc = await db.collection('forms').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Form not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form', details: error });
  }
});

// Submissions
app.post('/forms/:id/submissions', async (req, res) => {
  try {
    const submission = req.body;
    await db.collection('forms').doc(req.params.id).collection('submissions').add(submission);
    res.status(201).json({ message: 'Submission saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save submission', details: error });
  }
});

app.get('/forms/:id/submissions', async (req, res) => {
  try {
    const snapshot = await db.collection('forms').doc(req.params.id).collection('submissions').get();
    const submissions = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions', details: error });
  }
});

// Analytics (simple count)
app.get('/forms/:id/analytics', async (req, res) => {
  try {
    const snapshot = await db.collection('forms').doc(req.params.id).collection('submissions').get();
    res.json({ submissionCount: snapshot.size });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
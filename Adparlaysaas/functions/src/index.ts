import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

admin.initializeApp();

const app = express();

app.use(cors({
  origin: [
    'https://adparlaysaas.web.app',
    'https://www.adparlay.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Forms endpoints
app.get('/api/forms', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const formsRef = admin.firestore().collection('forms');
    const snapshot = await formsRef.where('userId', '==', req.user.uid).get();
    const forms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

app.post('/api/forms', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const formData = {
      ...req.body,
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await admin.firestore().collection('forms').add(formData);
    res.json({ id: docRef.id, ...formData });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Google Sheets integration
app.get('/api/integrations/google-sheets/auth-url', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would normally redirect to Google OAuth
    // For now, return a placeholder
    res.json({ 
      authUrl: 'https://accounts.google.com/oauth/authorize?client_id=your_client_id&redirect_uri=your_redirect_uri&scope=https://www.googleapis.com/auth/spreadsheets&response_type=code'
    });
  } catch (error) {
    console.error('Error getting Google Sheets auth URL:', error);
    res.status(500).json({ error: 'Failed to get Google Sheets auth URL' });
  }
});

app.post('/api/integrations/google-sheets/callback', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    // This would normally exchange code for tokens
    // For now, return a placeholder
    console.log('Google Sheets callback received code:', code);
    res.json({ 
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    });
  } catch (error) {
    console.error('Error handling Google Sheets callback:', error);
    res.status(500).json({ error: 'Failed to handle Google Sheets callback' });
  }
});

// CRM integrations
app.get('/api/integrations/crm/:crmType/auth-url', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { crmType } = req.params;
    // This would normally redirect to CRM OAuth
    // For now, return a placeholder
    res.json({ 
      authUrl: `https://${crmType}.com/oauth/authorize?client_id=your_client_id&redirect_uri=your_redirect_uri&scope=required_scope&response_type=code`
    });
  } catch (error) {
    console.error(`Error getting ${req.params.crmType} auth URL:`, error);
    res.status(500).json({ error: `Failed to get ${req.params.crmType} auth URL` });
  }
});

app.post('/api/integrations/crm/:crmType/callback', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { crmType } = req.params;
    const { code } = req.body;
    // This would normally exchange code for tokens
    // For now, return a placeholder
    console.log(`${crmType} callback received code:`, code);
    res.json({ 
      accessToken: `mock_${crmType}_access_token`,
      refreshToken: `mock_${crmType}_refresh_token`
    });
  } catch (error) {
    console.error(`Error handling ${req.params.crmType} callback:`, error);
    res.status(500).json({ error: `Failed to handle ${req.params.crmType} callback` });
  }
});

// Zapier integration
app.get('/api/integrations/zapier/auth-url', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would normally redirect to Zapier OAuth
    // For now, return a placeholder
    res.json({ 
      authUrl: 'https://zapier.com/oauth/authorize?client_id=your_client_id&redirect_uri=your_redirect_uri&scope=required_scope&response_type=code'
    });
  } catch (error) {
    console.error('Error getting Zapier auth URL:', error);
    res.status(500).json({ error: 'Failed to get Zapier auth URL' });
  }
});

app.post('/api/integrations/zapier/callback', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    // This would normally exchange code for tokens
    // For now, return a placeholder
    console.log('Zapier callback received code:', code);
    res.json({ 
      accessToken: 'mock_zapier_access_token',
      refreshToken: 'mock_zapier_refresh_token'
    });
  } catch (error) {
    console.error('Error handling Zapier callback:', error);
    res.status(500).json({ error: 'Failed to handle Zapier callback' });
  }
});

// Email notifications
app.post('/api/notifications/email', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { to, subject, body } = req.body;
    // This would normally send email via SendGrid, AWS SES, etc.
    // For now, just log the email
    console.log('Email notification:', { to, subject, body });
    res.json({ message: 'Email notification sent successfully' });
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ error: 'Failed to send email notification' });
  }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Simple test function
export const helloWorld = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  res.json({ message: 'Hello from Firebase Functions!' });
});

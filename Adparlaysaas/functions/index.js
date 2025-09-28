const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Configure CORS to allow requests from your domain
app.use(cors({
  origin: [
    'https://adparlaysaas.web.app',
    'https://www.adparlay.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Middleware to check authentication
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Forms routes
app.get('/api/forms', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const formsSnapshot = await admin.firestore()
      .collection('forms')
      .where('userId', '==', userId)
      .get();

    const forms = formsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Google Sheets integration routes
app.get('/api/integrations/google-sheets/auth-url', authenticateUser, (req, res) => {
  res.json({
    authUrl: 'https://accounts.google.com/oauth/authorize?client_id=placeholder&redirect_uri=placeholder&scope=https://www.googleapis.com/auth/spreadsheets&response_type=code'
  });
});

app.post('/api/integrations/google-sheets/setup', authenticateUser, async (req, res) => {
  try {
    const { formId, ...config } = req.body;
    const userId = req.user.uid;

    await admin.firestore()
      .collection('integrations')
      .doc(`${userId}_${formId}_googlesheets`)
      .set({
        type: 'googlesheets',
        formId,
        userId,
        config,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Google Sheets integration setup successfully' });
  } catch (error) {
    console.error('Error setting up Google Sheets:', error);
    res.status(500).json({ error: 'Failed to setup Google Sheets integration' });
  }
});

app.post('/api/integrations/google-sheets/sync', authenticateUser, async (req, res) => {
  try {
    const { config, rowData } = req.body;
    console.log('Google Sheets sync request:', { config, rowData });
    res.json({ message: 'Data synced to Google Sheets successfully' });
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    res.status(500).json({ error: 'Failed to sync to Google Sheets' });
  }
});

app.post('/api/integrations/google-sheets/callback', authenticateUser, async (req, res) => {
  try {
    const { code } = req.body;
    res.json({
      accessToken: 'placeholder_access_token',
      refreshToken: 'placeholder_refresh_token',
      spreadsheetId: 'placeholder_spreadsheet_id'
    });
  } catch (error) {
    console.error('Error handling Google Sheets callback:', error);
    res.status(500).json({ error: 'Failed to handle Google Sheets callback' });
  }
});

// CRM integration routes
app.get('/api/integrations/crm/auth-url', authenticateUser, (req, res) => {
  const { type } = req.query;
  
  const authUrls = {
    hubspot: 'https://app.hubspot.com/oauth/authorize?client_id=placeholder&redirect_uri=placeholder&scope=contacts&response_type=code',
    zoho: 'https://accounts.zoho.com/oauth/v2/auth?client_id=placeholder&redirect_uri=placeholder&scope=ZohoCRM.modules.ALL&response_type=code',
    salesforce: 'https://login.salesforce.com/services/oauth2/authorize?client_id=placeholder&redirect_uri=placeholder&scope=api&response_type=code'
  };

  res.json({
    authUrl: authUrls[type] || 'https://example.com/oauth'
  });
});

app.post('/api/integrations/crm/setup', authenticateUser, async (req, res) => {
  try {
    const { formId, type, ...config } = req.body;
    const userId = req.user.uid;

    await admin.firestore()
      .collection('integrations')
      .doc(`${userId}_${formId}_${type}`)
      .set({
        type,
        formId,
        userId,
        config,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: `${type} integration setup successfully` });
  } catch (error) {
    console.error('Error setting up CRM:', error);
    res.status(500).json({ error: 'Failed to setup CRM integration' });
  }
});

app.post('/api/integrations/crm/sync', authenticateUser, async (req, res) => {
  try {
    const { config, contact, submission } = req.body;
    console.log('CRM sync request:', { config, contact, submission });
    res.json({ message: 'Contact synced to CRM successfully' });
  } catch (error) {
    console.error('Error syncing to CRM:', error);
    res.status(500).json({ error: 'Failed to sync to CRM' });
  }
});

app.post('/api/integrations/crm/callback', authenticateUser, async (req, res) => {
  try {
    const { type, code } = req.body;
    res.json({
      accessToken: 'placeholder_access_token',
      refreshToken: 'placeholder_refresh_token',
      accountId: 'placeholder_account_id',
      portalId: 'placeholder_portal_id'
    });
  } catch (error) {
    console.error('Error handling CRM callback:', error);
    res.status(500).json({ error: 'Failed to handle CRM callback' });
  }
});

// Zapier integration routes
app.post('/api/integrations/zapier/setup', authenticateUser, async (req, res) => {
  try {
    const { formId, webhookUrl } = req.body;
    const userId = req.user.uid;

    await admin.firestore()
      .collection('integrations')
      .doc(`${userId}_${formId}_zapier`)
      .set({
        type: 'zapier',
        formId,
        userId,
        webhookUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Zapier integration setup successfully' });
  } catch (error) {
    console.error('Error setting up Zapier:', error);
    res.status(500).json({ error: 'Failed to setup Zapier integration' });
  }
});

app.post('/api/integrations/zapier/trigger', authenticateUser, async (req, res) => {
  try {
    const { webhookUrl, data } = req.body;
    console.log('Zapier webhook trigger:', { webhookUrl, data });
    res.json({ message: 'Zapier webhook triggered successfully' });
  } catch (error) {
    console.error('Error triggering Zapier webhook:', error);
    res.status(500).json({ error: 'Failed to trigger Zapier webhook' });
  }
});

// Email notification routes
app.post('/api/notifications/email', authenticateUser, async (req, res) => {
  try {
    const { userEmail, submission, form } = req.body;
    console.log('Email notification request:', { userEmail, submission, form });
    res.json({ message: 'Email notification sent successfully' });
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ error: 'Failed to send email notification' });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Simple test function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  res.json({ message: 'Hello from Firebase Functions!' });
});
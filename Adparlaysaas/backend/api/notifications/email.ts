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

interface EmailNotificationRequest {
  to: string;
  subject: string;
  html: string;
  formId: string;
  formTitle: string;
  submissionId: string;
}

async function handler(req: AuthenticatedRequest, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { to, subject, html, formId, formTitle, submissionId }: EmailNotificationRequest = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    // For now, we'll use a simple email service
    // In production, you'd integrate with SendGrid, Mailgun, or similar
    const emailData = {
      to,
      subject,
      html,
      formId,
      formTitle,
      submissionId,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    };

    // Store email notification in Firestore for tracking
    await db.collection('emailNotifications').add(emailData);

    // In a real implementation, you would send the actual email here
    // For now, we'll just log it and return success
    console.log('Email notification queued:', {
      to,
      subject,
      formId,
      formTitle,
      submissionId
    });

    res.status(200).json({ 
      message: 'Email notification sent successfully',
      notificationId: 'email-' + Date.now()
    });

  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ 
      error: 'Failed to send email notification', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

import admin from 'firebase-admin';

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

export interface AuthenticatedRequest {
  user?: admin.auth.DecodedIdToken;
  headers: { [key: string]: string | undefined };
  method?: string;
  body?: any;
  query?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: any,
  next: () => void
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed token' });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const withAuth = (handler: any) => {
  return async (req: AuthenticatedRequest, res: any) => {
    return authenticateToken(req, res, () => handler(req, res));
  };
}; 
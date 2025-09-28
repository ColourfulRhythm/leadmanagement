export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Adparlay Backend is running!' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 
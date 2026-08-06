import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing');
  }

  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('flashmind');
    const usersCollection = db.collection('users');

    if (req.method === 'GET') {
      const { email } = req.query;
      if (email) {
        const user = await usersCollection.findOne({ email: String(email).toLowerCase().trim() });
        return res.status(200).json(user || null);
      }
      const users = await usersCollection.find({}).toArray();
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const user = req.body;
      if (!user || !user.email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const cleanEmail = String(user.email).toLowerCase().trim();
      const record = {
        ...user,
        email: cleanEmail,
        updatedAt: new Date().toISOString(),
      };

      await usersCollection.updateOne(
        { email: cleanEmail },
        { $set: record },
        { upsert: true }
      );

      return res.status(200).json({ success: true, user: record });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('MongoDB Users API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

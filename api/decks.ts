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
    const decksCollection = db.collection('decks');

    if (req.method === 'GET') {
      const { userId } = req.query;
      const query = userId ? { userId: String(userId) } : {};
      const decks = await decksCollection.find(query).toArray();
      return res.status(200).json(decks);
    }

    if (req.method === 'POST') {
      const { decks, userId } = req.body;
      if (!Array.isArray(decks)) {
        return res.status(400).json({ error: 'decks array is required' });
      }

      const uid = userId || 'default';

      // Bulk upsert decks in MongoDB Atlas
      for (const deck of decks) {
        await decksCollection.updateOne(
          { id: deck.id },
          {
            $set: {
              ...deck,
              userId: uid,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      }

      return res.status(200).json({ success: true, count: decks.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('MongoDB Decks API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

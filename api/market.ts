import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

export default async function handler(req: any, res: any) {
  try {
    const db = getFirestore("ai-studio-4a754edd-ef20-4dae-a132-b2cc311e3272");
    const snap = await db.collection("markets").orderBy("order").get();
    const markets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(markets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

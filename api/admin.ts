import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: any, res: any) {
  // Verifikasi token MASTER
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
    if (decoded.role !== "MASTER") return res.status(403).json({ error: "Forbidden" });
  } catch {
    return res.status(401).json({ error: "Token invalid" });
  }

  const db = getFirestore("ai-studio-4a754edd-ef20-4dae-a132-b2cc311e3272");
  const { action, marketId, historyData, order, markets } = req.body;

  try {
    if (action === "save") {
      await db.collection("markets").doc(marketId).set(
        { historyData, updatedAt: new Date() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    if (action === "delete") {
      await db.collection("markets").doc(marketId).delete();
      return res.json({ success: true });
    }

    if (action === "add") {
      const newOrder = order || 99;
      await db.collection("markets").doc(marketId).set(
        { name: marketId, historyData: "", order: newOrder, updatedAt: new Date() },
        { merge: true }
      );
      return res.json({ success: true });
    }

    if (action === "reorder") {
      // markets = [{id, order}, ...]
      const batch = db.batch();
      for (const m of markets) {
        const ref = db.collection("markets").doc(m.id);
        batch.update(ref, { order: m.order });
      }
      await batch.commit();
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Action tidak dikenal" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
  }

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Web SDK
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: VERIFIKASI PIN
  app.post("/api/verify-pin", (req, res) => {
    const { deviceCode, pin } = req.body;
    const devId = parseInt(deviceCode) || 0;
    const masterPin = "120800";
    const proPin = ((devId * 5) + 2026).toString();
    const trialPin = ((devId * 3) + 1234).toString();

    let role = null;
    if (pin === masterPin) role = "MASTER";
    else if (pin === proPin) role = "PRO";
    else if (pin === trialPin) role = "TRIAL";

    if (role) {
      return res.json({ success: true, role, token: `supreme_${role}_${Date.now()}` });
    }
    return res.status(401).json({ success: false, message: "PIN SALAH" });
  });

  // API 2: VERIFIKASI TOKEN
  app.post("/api/verify-token", (req, res) => {
    const { token } = req.body;
    if (token && token.startsWith("supreme_")) {
      const role = token.split("_")[1];
      return res.json({ success: true, role });
    }
    return res.status(401).json({ success: false });
  });

  // API 3: AMBIL DATA PASARAN (DARI FIREBASE WEB SDK)
  app.get("/api/markets", async (req, res) => {
    // SECURITY LAYER: Hanya melayani jika diakses dari aplikasi kita (CORS bypass layer)
    const token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer supreme_")) {
        return res.status(403).json({ error: "Sistem Keamanan Mesin: Akses data ditolak. Berlaku hanya untuk Engine v2." });
    }

    try {
      const querySnapshot = await getDocs(collection(db, "markets"));
      const markets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[SERVER] Berhasil menarik ${markets.length} pasaran dari Firebase SDK.`);
      res.json(markets);
    } catch (e: any) {
      console.error("[SERVER] FIREBASE SDK ERROR:", e.message);
      res.json({ error: "Gagal ambil data dari Firebase: " + e.message });
    }
  });

  // API 4: UPDATE DATA PASARAN (ADMIN KE FIREBASE WEB SDK)
  app.post("/api/markets/update", async (req, res) => {
    const { markets, token } = req.body;
    if (!token || !token.includes("_MASTER_")) return res.status(403).json({ success: false });
    
    try {
      for (const m of markets) {
        const { id, ...data } = m;
        await setDoc(doc(db, "markets", id), data, { merge: true });
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("[SERVER] PATCH ERROR", e.message);
      res.json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running - http://localhost:${PORT}`);
  });
}

startServer();

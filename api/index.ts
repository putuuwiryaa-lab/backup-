import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore"; 
import { runAnalysis } from "./predictionEngine";

const firebaseConfig = {
  "projectId": "gen-lang-client-0206847589",
  "appId": "1:149378727431:web:8d379706d32b125ed934a2",
  "apiKey": "AIzaSyDjUaVnpieXu3cWH_lUJh5jn-fPWqlVaVg",
  "authDomain": "gen-lang-client-0206847589.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-4a754edd-ef20-4dae-a132-b2cc311e3272",
  "storageBucket": "gen-lang-client-0206847589.firebasestorage.app",
  "messagingSenderId": "149378727431"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express.Router();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    time: new Date().toISOString(),
    firebase: {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
    }
  });
});

const DEFAULT_JWT_SECRET = "SUPER_SECRET_VIP_KEY_2026";
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const SYSTEM_SECRET = "AI_STUDIO_INTERNAL_BYPASS_2026";

app.post("/api/auth/auto", async (req, res) => {
  try {
    const { deviceCode } = req.body;
    if (!deviceCode) return res.status(400).json({ success: false, error: "DeviceCode required" });

    const deviceRef = doc(db, "devices", String(deviceCode));
    const snap = await getDoc(deviceRef);

    if (!snap.exists()) {
      return res.json({ success: false, status: "NEW", message: "HARAP INPUT PIN" });
    }

    const data = snap.data()!;
    const now = Date.now();

    if (data.role === "TRIAL" && data.expiresAt && now > data.expiresAt) {
      return res.json({ success: false, status: "EXPIRED", message: "MASA TRIAL HABIS" });
    }

    const role = data.role;
    const token = jwt.sign({ deviceCode, role }, JWT_SECRET, { expiresIn: '365d' });
    
    return res.json({ 
      success: true, 
      role, 
      token, 
      expiresAt: data.expiresAt || null 
    });

  } catch (e: any) {
    console.error("AUTH AUTO ERROR:", e);
    res.status(500).json({ 
      success: false, 
      error: "Koneksi Bermasalah", 
      message: e.message
    });
  }
});

app.post("/api/auth", async (req, res) => {
  try {
    const { deviceCode, pin } = req.body;
    if (!deviceCode || !pin) return res.status(400).json({ success: false, message: "Lengkapi Data" });

    const vipPin = (parseInt(deviceCode) + 2026) + 7906;
    const trialPin = (parseInt(deviceCode) * 3) + 1234;

    let role = "";
    let expiresAt: number | null = null;

    if (parseInt(pin) === vipPin) {
      role = "PRO";
    } else if (parseInt(pin) === trialPin) {
      role = "TRIAL";
      expiresAt = Date.now() + (10 * 24 * 60 * 60 * 1000); 
    } else if (pin === "1608") {
       role = "PRO"; 
    } else {
      return res.status(401).json({ success: false, message: "PIN Salah" });
    }

    const deviceRef = doc(db, "devices", String(deviceCode));
    await setDoc(deviceRef, {
      deviceCode,
      role,
      expiresAt,
      systemSecret: SYSTEM_SECRET, 
      updatedAt: serverTimestamp()
    });

    const token = jwt.sign({ deviceCode, role }, JWT_SECRET, { expiresIn: '365d' });
    
    return res.json({ success: true, role, token, expiresAt });
  } catch (e: any) {
    console.error("PIN VERIFY ERROR DETAIL:", e);
    res.status(500).json({ 
      success: false, 
      error: "Gagal koneksi database", 
      message: e.message
    });
  }
});

app.post("/api/analyze", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sesi Tidak Valid. Harap Muat Ulang." });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET); 
    const { type, data, param } = req.body;
    
    if (!data || data.length < 17) {
      return res.status(400).json({ error: "Data kurang (minimal 17 result)" });
    }

    const result = runAnalysis(type, data, param);
    res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: "Sesi Tidak Valid" });
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Situs Terproteksi" });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("GLOBAL SERVER ERROR:", err);
  res.status(500).json({ 
    success: false, 
    error: "Server Error", 
    message: err.message 
  });
});

export default app;


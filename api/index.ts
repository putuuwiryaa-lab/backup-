import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore"; 
import { runAnalysis } from "./predictionEngine";
import firebaseConfigJakarta from "../firebase-applet-config.json";

// --- PROJECT CONFIGURATIONS ---

// 1. OLD DATABASE (Data Source for Markets)
const firebaseConfigOld = {
  "projectId": "gen-lang-client-0206847589",
  "apiKey": "AIzaSyDjUaVnpieXu3cWH_lUJh5jn-fPWqlVaVg",
  "firestoreDatabaseId": "ai-studio-4a754edd-ef20-4dae-a132-b2cc311e3272",
};

// --- INITIALIZE CLIENT SYSTEMS ---

// NEW Firebase (Jakarta) for AUTH/PIN logic
const appJakarta = initializeApp(firebaseConfigJakarta, "jakarta");
const dbAuth = getFirestore(appJakarta, firebaseConfigJakarta.firestoreDatabaseId);

// OLD Firebase for Market Data
const appOld = initializeApp(firebaseConfigOld, "old");
const dbData = getFirestore(appOld, firebaseConfigOld.firestoreDatabaseId);

const app = express.Router();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", mode: "DIRECT_CLIENT_HYBRID" });
});

const DEFAULT_JWT_SECRET = "SUPER_SECRET_VIP_KEY_2026";
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const SYSTEM_SECRET = "AI_STUDIO_INTERNAL_BYPASS_2026";

// --- AUTH (Jakarta) ---

app.post("/api/auth/auto", async (req, res) => {
  try {
    const { deviceCode } = req.body;
    if (!deviceCode) return res.status(400).json({ success: false, error: "Missing Code" });

    // Direct access allowed by Firestore Rules
    const deviceRef = doc(dbAuth, "devices", String(deviceCode));
    const snap = await getDoc(deviceRef);

    if (!snap.exists()) {
      return res.json({ success: false, status: "NEW", message: "HARAP INPUT PIN" });
    }

    const data = snap.data()!;
    if (data.role === "TRIAL" && data.expiresAt && Date.now() > data.expiresAt) {
      return res.json({ success: false, status: "EXPIRED", message: "MASA TRIAL HABIS" });
    }

    const role = data.role;
    const token = jwt.sign({ deviceCode, role }, JWT_SECRET, { expiresIn: '365d' });
    return res.json({ success: true, role, token, expiresAt: data.expiresAt || null });
  } catch (e: any) {
    console.error("AUTH AUTO ERROR:", e.message);
    res.status(500).json({ success: false, error: "Koneksi Terputus", message: e.message });
  }
});

app.post("/api/auth", async (req, res) => {
  try {
    const { deviceCode, pin } = req.body;
    if (!deviceCode || !pin) return res.status(400).json({ success: false, message: "Lengkapi Data" });

    const masterPin = parseInt(deviceCode) + 1608;
    const proPin = parseInt(deviceCode) + 2026;
    const trialPin = parseInt(deviceCode) + 1111;

    let role = "";
    let expiresAt: number | null = null;

    if (parseInt(pin) === masterPin || pin === "1608") {
      role = "MASTER";
    } else if (parseInt(pin) === proPin) {
      role = "PRO";
    } else if (parseInt(pin) === trialPin) {
      role = "TRIAL";
      expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); 
    } else {
      return res.status(401).json({ success: false, message: "PIN Salah" });
    }

    // Direct write allowed by Firestore Rules
    const deviceRef = doc(dbAuth, "devices", String(deviceCode));
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
    console.error("PIN VERIFY ERROR DETAIL:", e.message);
    res.status(500).json({ success: false, error: "Gagal Verifikasi PIN", message: e.message });
  }
});

// --- DATA ---

app.get("/api/markets", async (req, res) => {
  try {
    const marketRef = collection(dbData, "markets");
    const q = query(marketRef, orderBy("order", "asc"));
    const snap = await getDocs(q);
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (e: any) {
    console.error("FETCH ERROR:", e.message);
    res.json([]);
  }
});

app.post("/api/analyze", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Sesi Habis" });
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET); 
    const { type, data, param } = req.body;
    if (!data || data.length < 17) return res.status(400).json({ error: "Data kurang" });
    res.json(runAnalysis(type, data, param));
  } catch (err: any) {
    return res.status(401).json({ error: "Sesi Tidak Valid" });
  }
});

app.use("/api/*", (req, res) => res.status(404).json({ error: "Proteksi Aktif" }));

app.use((err: any, req: any, res: any, next: any) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ success: false, error: "Server Error", message: err.message });
});

export default app;


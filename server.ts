import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DATABASE MINI (File based)
const DATA_FILE = process.env.DATABASE_PATH || path.join(process.cwd(), "markets_db.json");

// Inisialisasi data jika belum ada
if (!fs.existsSync(DATA_FILE)) {
  const defaultMarkets = [
    { id: "SGP", name: "SINGAPORE", status: "CLOSED", results: [] },
    { id: "HK", name: "HONGKONG", status: "ACTIVE", results: [] },
    { id: "SYD", name: "SYDNEY", status: "ACTIVE", results: [] }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultMarkets, null, 2));
}

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
      return res.json({ 
        success: true, 
        role, 
        token: `supreme_${role}_${Date.now()}` 
      });
    }
    return res.status(401).json({ success: false, message: "PIN SALAH" });
  });

  // API 2: VERIFIKASI TOKEN (UNTUK AUTO LOGIN)
  app.post("/api/verify-token", (req, res) => {
    const { token } = req.body;
    if (token && token.startsWith("supreme_")) {
      const role = token.split("_")[1];
      return res.json({ success: true, role });
    }
    return res.status(401).json({ success: false });
  });

  // API 3: AMBIL DATA PASARAN
  app.get("/api/markets", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    res.json(data);
  });

  // API 4: UPDATE DATA PASARAN (UNTUK ADMIN)
  app.post("/api/markets/update", (req, res) => {
    const { markets, token } = req.body;
    // Cek apakah pengirim adalah admin (Master) via token
    if (!token || !token.includes("_MASTER_")) {
      return res.status(403).json({ success: false, message: "UNAUTHORIZED" });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(markets, null, 2));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

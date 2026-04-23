import jwt from "jsonwebtoken";
import crypto from "crypto";

// Simple in-memory rate limiter
const attempts: Record<string, { count: number; lastAttempt: number }> = {};

const LIMIT = 5; // max 5 percobaan
const WINDOW = 15 * 60 * 1000; // per 15 menit

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();

  // Cek rate limit
  if (!attempts[ip]) {
    attempts[ip] = { count: 0, lastAttempt: now };
  }

  const record = attempts[ip];

  // Reset jika sudah lewat window
  if (now - record.lastAttempt > WINDOW) {
    record.count = 0;
    record.lastAttempt = now;
  }

  if (record.count >= LIMIT) {
    const sisaWaktu = Math.ceil((WINDOW - (now - record.lastAttempt)) / 60000);
    return res.status(429).json({ 
      success: false, 
      error: `Terlalu banyak percobaan! Coba lagi ${sisaWaktu} menit lagi.` 
    });
  }

  const { pin, deviceCode } = req.body;
  const devIdStr = deviceCode?.toString() || "0";

  // KUNCI RAHASIA PIN: Harus persis dengan yang ada di Environment Variables Vercel & script Python
  const PIN_SECRET = process.env.PIN_SECRET || "NEXUS_ANALISA_2026_X89_SECURE";

  // Fungsi generate PIN Acak menggunakan enkripsi HMAC-SHA256
  const generateSecurePin = (id: string, rolePrefix: string) => {
    const hash = crypto.createHmac("sha256", PIN_SECRET)
                       .update(id + rolePrefix)
                       .digest("hex");
    
    // Ekstrak hanya angka dari hash, dan batasi 6 digit
    const numericOnly = hash.replace(/\D/g, '');
    return numericOnly.substring(0, 6).padStart(6, '0');
  };

  const masterPin = process.env.MASTER_PIN || "120800";
  
  // Hitung PIN menggunakan sistem Hash baru
  const proPin = generateSecurePin(devIdStr, "PRO");
  const trialPin = generateSecurePin(devIdStr, "TRIAL");

  let role = null;
  if (pin === masterPin) role = "MASTER";
  else if (pin === proPin) role = "PRO";
  else if (pin === trialPin) role = "TRIAL";

  if (role) {
    // Reset attempts jika berhasil
    record.count = 0;
    
    const expiresIn = role === "TRIAL" ? "14d" : role === "PRO" ? "60d" : "365d";
    const token = jwt.sign(
      { role, deviceCode },
      process.env.JWT_SECRET || "SUPER_SECRET_JWT_KEY_ANALISA_ANGKA_2026",
      { expiresIn }
    );
    res.json({ success: true, role, token });
  } else {
    // Tambah counter gagal
    record.count++;
    record.lastAttempt = now;
    const sisaCoba = LIMIT - record.count;
    res.status(401).json({ 
      success: false, 
      error: sisaCoba > 0 ? `PIN SALAH! Sisa ${sisaCoba} percobaan.` : "Akses diblokir 15 menit!"
    });
  }
}

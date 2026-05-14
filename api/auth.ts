import jwt from "jsonwebtoken";
import crypto from "crypto";

// Simple in-memory rate limiter. Untuk proteksi produksi yang lebih kuat,
// pindahkan counter ini ke database/Redis agar tetap konsisten di serverless.
const attempts: Record<string, { count: number; lastAttempt: number }> = {};

const LIMIT = 5;
const WINDOW = 15 * 60 * 1000;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function getClientIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  return Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let PIN_SECRET = "";
  let MASTER_PIN = "";
  let JWT_SECRET = "";
  try {
    PIN_SECRET = requireEnv("PIN_SECRET");
    MASTER_PIN = requireEnv("MASTER_PIN");
    JWT_SECRET = requireEnv("JWT_SECRET");
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({ success: false, error: "Kesalahan konfigurasi server" });
  }

  const ip = getClientIp(req);
  const now = Date.now();

  if (!attempts[ip]) attempts[ip] = { count: 0, lastAttempt: now };
  const record = attempts[ip];

  if (now - record.lastAttempt > WINDOW) {
    record.count = 0;
    record.lastAttempt = now;
  }

  if (record.count >= LIMIT) {
    const sisaWaktu = Math.ceil((WINDOW - (now - record.lastAttempt)) / 60000);
    return res.status(429).json({ success: false, error: `Terlalu banyak percobaan! Coba lagi ${sisaWaktu} menit lagi.` });
  }

  const { pin, deviceCode } = req.body;
  const submittedPin = String(pin || "").trim();
  const devIdStr = String(deviceCode || "").trim();

  if (!/^\d{4}$/.test(devIdStr) || !/^\d{6}$/.test(submittedPin)) {
    record.count++;
    record.lastAttempt = now;
    return res.status(401).json({ success: false, error: "PIN SALAH!" });
  }

  const generateSecurePin = (id: string, rolePrefix: string) => {
    const hash = crypto.createHmac("sha256", PIN_SECRET).update(id + rolePrefix).digest("hex");
    const numericOnly = hash.replace(/\D/g, "");
    return numericOnly.substring(0, 6).padStart(6, "0");
  };

  const proPin = generateSecurePin(devIdStr, "PRO");
  const trialPin = generateSecurePin(devIdStr, "TRIAL");

  let role: "MASTER" | "PRO" | "TRIAL" | null = null;
  if (safeCompare(submittedPin, MASTER_PIN)) role = "MASTER";
  else if (safeCompare(submittedPin, proPin)) role = "PRO";
  else if (safeCompare(submittedPin, trialPin)) role = "TRIAL";

  if (!role) {
    record.count++;
    record.lastAttempt = now;
    const sisaCoba = LIMIT - record.count;
    return res.status(401).json({ success: false, error: sisaCoba > 0 ? `PIN SALAH! Sisa ${sisaCoba} percobaan.` : "Akses diblokir 15 menit!" });
  }

  record.count = 0;

  // Logika expiry TRIAL dari aktivasi pertama
  if (role === "TRIAL") {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      requireEnv("VITE_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY") // pakai service role, bukan anon key
    );

    const TRIAL_DAYS = 14;

    // Ambil aktivasi pertama
    const { data: existing } = await supabase
      .from("trial_activations")
      .select("activated_at")
      .eq("device_code", devIdStr)
      .single();

    let activatedAt: Date;

    if (existing) {
      activatedAt = new Date(existing.activated_at);
    } else {
      // Pertama kali login TRIAL → simpan
      activatedAt = new Date();
      await supabase.from("trial_activations").insert({ device_code: devIdStr, activated_at: activatedAt });
    }

    const expiredAt = new Date(activatedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const sisaMs = expiredAt.getTime() - Date.now();

    if (sisaMs <= 0) {
      return res.status(403).json({ success: false, error: "Trial kamu sudah habis! Hubungi Admin untuk aktivasi VIP." });
    }

    const sisaDetik = Math.floor(sisaMs / 1000);
    const token = jwt.sign({ role, deviceCode: devIdStr }, JWT_SECRET, { expiresIn: sisaDetik });
    return res.json({ success: true, role, token });
  }

  // PRO dan MASTER
  const expiresIn = role === "PRO" ? "60d" : "365d";
  const token = jwt.sign({ role, deviceCode: devIdStr }, JWT_SECRET, { expiresIn });
  return res.json({ success: true, role, token });

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const TRIAL_DAYS = 14;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

function getClientIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  return Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.socket?.remoteAddress || "unknown")
        .split(",")[0]
        .trim();
}

function hashIp(ip: string) {
  return crypto
    .createHash("sha256")
    .update(ip + requireEnv("JWT_SECRET"))
    .digest("hex");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const deviceId = String(req.body?.deviceId || "").trim();
  const displayCode = String(req.body?.displayCode || "").trim();

  if (!deviceId || deviceId.length < 20) {
    return res.status(400).json({
      success: false,
      error: "Device ID tidak valid"
    });
  }

  if (!/^\d{6}$/.test(displayCode)) {
    return res.status(400).json({
      success: false,
      error: "Display code tidak valid"
    });
  }

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const now = new Date();
  const ipHash = hashIp(getClientIp(req));
  const userAgent = String(req.headers["user-agent"] || "");

  const { data: existing, error: selectError } = await supabase
    .from("trial_activations_v2")
    .select("activated_at, expires_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({
      success: false,
      error: "Gagal memeriksa trial"
    });
  }

  let expiresAt: Date;

  if (existing?.expires_at) {
    expiresAt = new Date(existing.expires_at);
  } else {
    expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: insertError } = await supabase
      .from("trial_activations_v2")
      .insert({
        device_id: deviceId,
        display_code: displayCode,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        ip_hash: ipHash,
        user_agent: userAgent,
        last_seen_at: now.toISOString()
      });

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: "Gagal mengaktifkan trial"
      });
    }
  }

  const remainingSeconds = Math.floor(
    (expiresAt.getTime() - Date.now()) / 1000
  );

  if (remainingSeconds <= 0) {
    return res.status(403).json({
      success: false,
      expired: true,
      error: "Trial sudah habis. Silakan aktivasi VIP."
    });
  }

  await supabase
    .from("trial_activations_v2")
    .update({ last_seen_at: now.toISOString() })
    .eq("device_id", deviceId);

  const token = jwt.sign(
    {
      role: "TRIAL",
      deviceId,
      displayCode,
      tokenVersion: Number(process.env.TOKEN_VERSION || 2)
    },
    requireEnv("JWT_SECRET"),
    { expiresIn: remainingSeconds }
  );

  return res.json({
    success: true,
    role: "TRIAL",
    token,
    expiresAt: expiresAt.toISOString()
  });
}

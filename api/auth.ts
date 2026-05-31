import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const LIMIT = 5;
const WINDOW_MINUTES = 15;

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
  return Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.socket?.remoteAddress || "unknown")
        .split(",")[0]
        .trim();
}

function hashValue(value: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");
}

async function countFailedAttempts(
  supabase: any,
  field: "ip_hash" | "device_id",
  value: string,
  sinceIso: string
) {
  if (!value) return 0;

  const { count, error } = await supabase
    .from("pin_auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq(field, value)
    .eq("success", false)
    .gte("attempted_at", sinceIso);

  if (error) throw error;
  return count || 0;
}

async function logAttempt(
  supabase: any,
  payload: {
    ip_hash: string;
    device_id: string;
    display_code: string;
    success: boolean;
    reason: string;
  }
) {
  const { error } = await supabase
    .from("pin_auth_attempts")
    .insert({
      ...payload,
      attempted_at: new Date().toISOString(),
    });

  if (error) console.error("PIN_ATTEMPT_LOG_ERROR", error);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let PIN_SECRET = "";
  let MASTER_PIN = "";
  let JWT_SECRET = "";

  try {
    PIN_SECRET = requireEnv("PIN_SECRET");
    MASTER_PIN = requireEnv("MASTER_PIN");
    JWT_SECRET = requireEnv("JWT_SECRET");
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({
      success: false,
      error: "Kesalahan konfigurasi server",
    });
  }

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { pin, deviceId, displayCode } = req.body;

  const submittedPin = String(pin || "").trim();
  const deviceIdStr = String(deviceId || "").trim();
  const displayCodeStr = String(displayCode || "").trim();

  const ipHash = hashValue(getClientIp(req), JWT_SECRET);
  const sinceIso = new Date(
    Date.now() - WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  try {
    const ipFailures = await countFailedAttempts(
      supabase,
      "ip_hash",
      ipHash,
      sinceIso
    );

    const deviceFailures = await countFailedAttempts(
      supabase,
      "device_id",
      deviceIdStr,
      sinceIso
    );

    if (ipFailures >= LIMIT || deviceFailures >= LIMIT) {
      await logAttempt(supabase, {
        ip_hash: ipHash,
        device_id: deviceIdStr,
        display_code: displayCodeStr,
        success: false,
        reason: "rate_limited",
      });

      return res.status(429).json({
        success: false,
        error: `Terlalu banyak percobaan. Coba lagi ${WINDOW_MINUTES} menit lagi.`,
      });
    }

    if (
      !deviceIdStr ||
      deviceIdStr.length < 20 ||
      !/^\d{6}$/.test(displayCodeStr) ||
      !/^\d{6}$/.test(submittedPin)
    ) {
      await logAttempt(supabase, {
        ip_hash: ipHash,
        device_id: deviceIdStr,
        display_code: displayCodeStr,
        success: false,
        reason: "invalid_payload",
      });

      return res.status(401).json({
        success: false,
        error: "PIN SALAH!",
      });
    }

    const generateSecurePin = (id: string, rolePrefix: string) => {
      const hash = crypto
        .createHmac("sha256", PIN_SECRET)
        .update(id + rolePrefix)
        .digest("hex");

      const numericOnly = hash.replace(/\D/g, "");
      return numericOnly.substring(0, 6).padStart(6, "0");
    };

    const proPin = generateSecurePin(displayCodeStr, "PRO");

    let role: "MASTER" | "PRO" | null = null;

    if (safeCompare(submittedPin, MASTER_PIN)) {
      role = "MASTER";
    } else if (safeCompare(submittedPin, proPin)) {
      role = "PRO";
    }

    if (!role) {
      await logAttempt(supabase, {
        ip_hash: ipHash,
        device_id: deviceIdStr,
        display_code: displayCodeStr,
        success: false,
        reason: "wrong_pin",
      });

      const remaining = Math.max(
        0,
        LIMIT - Math.max(ipFailures, deviceFailures) - 1
      );

      return res.status(401).json({
        success: false,
        error:
          remaining > 0
            ? `PIN SALAH! Sisa ${remaining} percobaan.`
            : "Akses diblokir 15 menit!",
      });
    }

    await logAttempt(supabase, {
      ip_hash: ipHash,
      device_id: deviceIdStr,
      display_code: displayCodeStr,
      success: true,
      reason: role,
    });

    const expiresIn = role === "PRO" ? "60d" : "365d";

    const token = jwt.sign(
      {
        role,
        deviceId: deviceIdStr,
        displayCode: displayCodeStr,
        tokenVersion: Number(process.env.TOKEN_VERSION || 2),
      },
      JWT_SECRET,
      { expiresIn }
    );

    return res.json({
      success: true,
      role,
      token,
    });
  } catch (e: any) {
    console.error("PIN_AUTH_ERROR", e);
    return res.status(500).json({
      success: false,
      error: "Gagal memverifikasi PIN",
    });
  }
}

import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

async function verifyTrialAccess(deviceId: string) {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data, error } = await supabase
    .from("trial_activations_v2")
    .select("expires_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: "Gagal memeriksa trial" };
  if (!data?.expires_at) return { ok: false, status: 403, error: "Trial tidak ditemukan" };
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 403, error: "Trial sudah habis. Silakan aktivasi VIP." };
  }

  await supabase
    .from("trial_activations_v2")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("device_id", deviceId);

  return { ok: true };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, deviceId } = req.body;

  if (!token || !deviceId) {
    return res.status(401).json({
      valid: false,
      error: "Token atau perangkat tidak ditemukan"
    });
  }

  let JWT_SECRET = "";

  try {
    JWT_SECRET = requireEnv("JWT_SECRET");
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({
      valid: false,
      error: "Kesalahan konfigurasi server"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const expectedVersion = Number(process.env.TOKEN_VERSION || 2);
    const role = String(decoded.role || "");
    const decodedDeviceId = String(decoded.deviceId || "");

    if (decoded.tokenVersion !== expectedVersion) {
      return res.status(401).json({
        valid: false,
        error: "Sesi lama. Silakan login ulang."
      });
    }

    if (!["TRIAL", "PRO", "MASTER"].includes(role)) {
      return res.status(403).json({
        valid: false,
        error: "Akses tidak valid"
      });
    }

    if (!decodedDeviceId || decodedDeviceId !== String(deviceId)) {
      return res.status(401).json({
        valid: false,
        error: "Token tidak cocok dengan perangkat"
      });
    }

    if (role === "TRIAL") {
      const trialAccess = await verifyTrialAccess(decodedDeviceId);
      if (!trialAccess.ok) {
        return res.status(trialAccess.status).json({
          valid: false,
          error: trialAccess.error
        });
      }
    }

    return res.json({
      valid: true,
      role,
      displayCode: decoded.displayCode
    });
  } catch (e: any) {
    const message =
      e.name === "TokenExpiredError"
        ? "Token sudah kadaluarsa"
        : "Token tidak valid";

    return res.status(401).json({
      valid: false,
      error: message
    });
  }
}

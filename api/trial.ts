import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const TRIAL_DAYS = 14;
const MAX_TRIALS_PER_IP_24H = 2;
const MAX_TRIALS_PER_IP_LIFETIME = 5;
const TRIAL_USED_MESSAGE = "Trial gratis di perangkat ini sudah pernah digunakan. Silakan aktivasi VIP.";

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

function hashValue(value: string) {
  return crypto
    .createHmac("sha256", requireEnv("JWT_SECRET"))
    .update(value)
    .digest("hex");
}

function hashIp(ip: string) {
  return hashValue(ip);
}

function stableStringify(input: any) {
  const source = input && typeof input === "object" ? input : {};
  const clean = Object.keys(source)
    .sort()
    .reduce((acc: Record<string, string>, key) => {
      acc[key] = String(source[key] ?? "").slice(0, 240);
      return acc;
    }, {});
  return JSON.stringify(clean);
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function remainingSecondsFrom(expiresAt: Date) {
  return Math.floor((expiresAt.getTime() - Date.now()) / 1000);
}

async function countRows(query: any) {
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

function buildToken(deviceId: string, displayCode: string, remainingSeconds: number) {
  return jwt.sign(
    {
      role: "TRIAL",
      deviceId,
      displayCode,
      tokenVersion: Number(process.env.TOKEN_VERSION || 2)
    },
    requireEnv("JWT_SECRET"),
    { expiresIn: remainingSeconds }
  );
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
  const fingerprintPayload = stableStringify(req.body?.fingerprint);

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

  if (fingerprintPayload === "{}") {
    return res.status(400).json({
      success: false,
      error: "Perangkat tidak bisa diverifikasi. Gunakan browser utama perangkat ini."
    });
  }

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ipHash = hashIp(getClientIp(req));
  const userAgent = String(req.headers["user-agent"] || "");
  const userAgentHash = hashValue(userAgent);
  const fingerprintHash = hashValue(fingerprintPayload);

  try {
    const { data: existingByDevice, error: deviceError } = await supabase
      .from("trial_activations_v2")
      .select("id, activated_at, expires_at, fingerprint_hash, user_agent_hash")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (deviceError) throw deviceError;

    if (existingByDevice?.expires_at) {
      if (isExpired(existingByDevice.expires_at)) {
        await supabase
          .from("trial_activations_v2")
          .update({ last_seen_at: now.toISOString(), trial_block_reason: "device_expired" })
          .eq("id", existingByDevice.id);
        return res.status(403).json({ success: false, expired: true, error: TRIAL_USED_MESSAGE });
      }

      await supabase
        .from("trial_activations_v2")
        .update({
          display_code: displayCode,
          fingerprint_hash: existingByDevice.fingerprint_hash || fingerprintHash,
          user_agent_hash: existingByDevice.user_agent_hash || userAgentHash,
          user_agent: userAgent,
          ip_hash: ipHash,
          last_seen_at: now.toISOString()
        })
        .eq("id", existingByDevice.id);

      const expiresAt = new Date(existingByDevice.expires_at);
      const remainingSeconds = remainingSecondsFrom(expiresAt);
      return res.json({
        success: true,
        role: "TRIAL",
        token: buildToken(deviceId, displayCode, remainingSeconds),
        expiresAt: expiresAt.toISOString()
      });
    }

    const { data: existingByFingerprint, error: fingerprintError } = await supabase
      .from("trial_activations_v2")
      .select("id, activated_at, expires_at")
      .eq("fingerprint_hash", fingerprintHash)
      .order("activated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fingerprintError) throw fingerprintError;

    if (existingByFingerprint?.expires_at) {
      if (isExpired(existingByFingerprint.expires_at)) {
        await supabase
          .from("trial_activations_v2")
          .update({ last_seen_at: now.toISOString(), trial_block_reason: "fingerprint_expired" })
          .eq("id", existingByFingerprint.id);
        return res.status(403).json({ success: false, expired: true, error: TRIAL_USED_MESSAGE });
      }

      await supabase
        .from("trial_activations_v2")
        .update({
          device_id: deviceId,
          display_code: displayCode,
          user_agent_hash: userAgentHash,
          user_agent: userAgent,
          ip_hash: ipHash,
          last_seen_at: now.toISOString()
        })
        .eq("id", existingByFingerprint.id);

      const expiresAt = new Date(existingByFingerprint.expires_at);
      const remainingSeconds = remainingSecondsFrom(expiresAt);
      return res.json({
        success: true,
        role: "TRIAL",
        token: buildToken(deviceId, displayCode, remainingSeconds),
        expiresAt: expiresAt.toISOString()
      });
    }

    const { data: existingByNetworkBrowser, error: networkBrowserError } = await supabase
      .from("trial_activations_v2")
      .select("id, activated_at, expires_at")
      .eq("ip_hash", ipHash)
      .eq("user_agent_hash", userAgentHash)
      .order("activated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (networkBrowserError) throw networkBrowserError;

    if (existingByNetworkBrowser?.expires_at) {
      if (isExpired(existingByNetworkBrowser.expires_at)) {
        await supabase
          .from("trial_activations_v2")
          .update({ last_seen_at: now.toISOString(), trial_block_reason: "network_browser_expired" })
          .eq("id", existingByNetworkBrowser.id);
        return res.status(403).json({ success: false, expired: true, error: TRIAL_USED_MESSAGE });
      }

      await supabase
        .from("trial_activations_v2")
        .update({
          device_id: deviceId,
          display_code: displayCode,
          fingerprint_hash: fingerprintHash,
          last_seen_at: now.toISOString()
        })
        .eq("id", existingByNetworkBrowser.id);

      const expiresAt = new Date(existingByNetworkBrowser.expires_at);
      const remainingSeconds = remainingSecondsFrom(expiresAt);
      return res.json({
        success: true,
        role: "TRIAL",
        token: buildToken(deviceId, displayCode, remainingSeconds),
        expiresAt: expiresAt.toISOString()
      });
    }

    const trials24h = await countRows(
      supabase
        .from("trial_activations_v2")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("activated_at", since24h)
    );

    if (trials24h >= MAX_TRIALS_PER_IP_24H) {
      return res.status(403).json({
        success: false,
        error: "Batas trial gratis dari jaringan ini sudah tercapai. Silakan aktivasi VIP."
      });
    }

    const trialsLifetime = await countRows(
      supabase
        .from("trial_activations_v2")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
    );

    if (trialsLifetime >= MAX_TRIALS_PER_IP_LIFETIME) {
      return res.status(403).json({
        success: false,
        error: "Trial gratis di jaringan ini sudah mencapai batas. Silakan aktivasi VIP."
      });
    }

    const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: insertError } = await supabase
      .from("trial_activations_v2")
      .insert({
        device_id: deviceId,
        display_code: displayCode,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        ip_hash: ipHash,
        user_agent: userAgent,
        user_agent_hash: userAgentHash,
        fingerprint_hash: fingerprintHash,
        last_seen_at: now.toISOString()
      });

    if (insertError) throw insertError;

    const remainingSeconds = remainingSecondsFrom(expiresAt);

    return res.json({
      success: true,
      role: "TRIAL",
      token: buildToken(deviceId, displayCode, remainingSeconds),
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error("TRIAL_ACTIVATION_ERROR", error);
    return res.status(500).json({
      success: false,
      error: "Gagal memeriksa trial"
    });
  }
}

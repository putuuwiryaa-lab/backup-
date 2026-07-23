import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { runAnalysis } from "../server/predictionEngine.js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

function getBearerToken(req: any) {
  const auth = req.headers["authorization"] || req.headers["Authorization"];
  const value = Array.isArray(auth) ? auth[0] : String(auth || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function getHeaderValue(req: any, name: string) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || "").trim();
}

function sanitizeData(data: any) {
  if (!Array.isArray(data)) return null;

  const cleaned = data
    .map((item) => String(item || "").trim())
    .filter((item) => /^\d{4}$/.test(item));

  if (cleaned.length < 17) return null;
  return cleaned.slice(-200);
}

type TargetPair = "depan" | "tengah" | "belakang";
type AnalysisScope =
  | "default"
  | "4d"
  | "3d"
  | "2d_depan"
  | "2d_tengah"
  | "2d_belakang";

function sanitizeTargetPair(value: any): TargetPair {
  return value === "depan" || value === "tengah" || value === "belakang"
    ? value
    : "belakang";
}

function sanitizeAnalysisScope(value: any): AnalysisScope {
  return value === "4d" ||
    value === "3d" ||
    value === "2d_depan" ||
    value === "2d_tengah" ||
    value === "2d_belakang"
    ? value
    : "default";
}

function isAi2DScope(scope: AnalysisScope): boolean {
  return scope === "2d_depan" || scope === "2d_tengah" || scope === "2d_belakang";
}

function normalizeScopeForType(type: string, scope: AnalysisScope): AnalysisScope {
  // AI 2D lama tetap disimpan sebagai scope default.
  // Pembeda depan/tengah/belakang dikirim lewat targetPair, bukan remap data.
  if (type === "ai" && isAi2DScope(scope)) return "default";
  return scope;
}

function targetPairFromScope(scope: AnalysisScope, fallback: TargetPair): TargetPair {
  if (scope === "2d_depan") return "depan";
  if (scope === "2d_tengah") return "tengah";
  if (scope === "2d_belakang") return "belakang";
  return fallback;
}

function aiParamIsValid(param: number, scope: AnalysisScope) {
  if (scope === "3d") return [1, 3, 5, 7, 8].includes(param);
  if (scope === "4d") return [1, 2, 4].includes(param);
  return [2, 4, 6, 7, 8].includes(param);
}

async function validateAccessToken(req: any, jwtSecret: string) {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  let decoded: any;

  try {
    decoded = jwt.verify(token, jwtSecret) as any;
  } catch {
    return { ok: false, status: 401, error: "Token invalid" };
  }

  const expectedVersion = Number(process.env.TOKEN_VERSION || 2);

  if (decoded.tokenVersion !== expectedVersion) {
    return { ok: false, status: 401, error: "Sesi lama. Silakan login ulang." };
  }

  if (!["TRIAL", "PRO", "MASTER"].includes(String(decoded.role || ""))) {
    return { ok: false, status: 403, error: "Akses tidak valid" };
  }

  if (!decoded.deviceId || String(decoded.deviceId).length < 20) {
    return { ok: false, status: 401, error: "Token perangkat tidak valid" };
  }

  if (decoded.role === "TRIAL") {
    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    const { data, error } = await supabase
      .from("trial_activations_v2")
      .select("expires_at")
      .eq("device_id", String(decoded.deviceId))
      .maybeSingle();

    if (error) {
      return { ok: false, status: 500, error: "Gagal memeriksa akses trial" };
    }

    if (!data?.expires_at) {
      return { ok: false, status: 403, error: "Trial tidak ditemukan" };
    }

    if (new Date(data.expires_at).getTime() <= Date.now()) {
      return { ok: false, status: 403, error: "Trial sudah habis. Silakan aktivasi VIP." };
    }
  }

  return { ok: true, role: decoded.role };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let JWT_SECRET = "";

  try {
    JWT_SECRET = requireEnv("JWT_SECRET");
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({ error: "Kesalahan konfigurasi server" });
  }

  const expectedInternalSecret = process.env.INTERNAL_API_SECRET;
  const submittedInternalSecret = getHeaderValue(req, "x-internal-secret");

  const isInternalRequest = Boolean(
    expectedInternalSecret &&
      submittedInternalSecret &&
      submittedInternalSecret === expectedInternalSecret
  );

  if (!isInternalRequest) {
    const access = await validateAccessToken(req, JWT_SECRET);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
  }

  try {
    const { type, data, param, target_pair, analysis_scope } = req.body;

    const allowedTypes = new Set(["ai", "bbfs", "mati", "jumlah", "shio", "rekap"]);
    const cleanedData = sanitizeData(data);
    const safeParam = Number(param || 1);
    const rawScope = sanitizeAnalysisScope(analysis_scope);

    const isBBFS = type === "bbfs";
    const isAI = type === "ai";
    const safeScope = normalizeScopeForType(type, rawScope);
    const engineType = isBBFS ? "ai" : type;

    const targetPair =
      isBBFS || isAI
        ? targetPairFromScope(rawScope, sanitizeTargetPair(target_pair))
        : sanitizeTargetPair(target_pair);

    const paramIsValid = isBBFS
      ? [7, 8, 9].includes(safeParam)
      : isAI
        ? aiParamIsValid(safeParam, safeScope)
        : Number.isInteger(safeParam) && safeParam >= 1 && safeParam <= 8;

    if (
      !allowedTypes.has(type) ||
      !cleanedData ||
      !Number.isInteger(safeParam) ||
      !paramIsValid ||
      (isBBFS && safeScope === "default")
    ) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Penting:
    // Jangan remap input data.
    // Semua engine tetap menerima 4D mentah.
    // Fokus depan/tengah/belakang dikendalikan lewat targetPair di predictionEngine.
    const result = runAnalysis(engineType, cleanedData, safeParam, {
      analysisScope: safeScope,
      targetPair,
      forceDigitResult: isBBFS,
    });

    return res.json({
      ...result,
      target_pair: targetPair,
      analysis_scope: safeScope,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Gagal memproses analisa" });
  }
}

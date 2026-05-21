import jwt from "jsonwebtoken";
import { runAnalysis } from "./predictionEngine.js";

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
  const cleaned = data.map((item) => String(item || "").trim()).filter((item) => /^\d{4}$/.test(item));
  if (cleaned.length < 17) return null;
  return cleaned.slice(-200);
}

type TargetPair = "depan" | "tengah" | "belakang";

function sanitizeTargetPair(value: any): TargetPair {
  return value === "depan" || value === "tengah" || value === "belakang" ? value : "belakang";
}

function getTarget2D(result: string, targetPair: TargetPair) {
  if (targetPair === "depan") return result.slice(0, 2);
  if (targetPair === "tengah") return result.slice(1, 3);
  return result.slice(2, 4);
}

function remapDataForTargetPair(type: string, data: string[], targetPair: TargetPair) {
  if (targetPair === "belakang") return data;
  if (!["ai", "jumlah", "shio"].includes(type)) return data;
  return data.map((result) => `00${getTarget2D(result, targetPair)}`);
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
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Token invalid" });
    }
  }

  try {
    const { type, data, param, target_pair } = req.body;
    const allowedTypes = new Set(["ai", "mati", "jumlah", "shio", "rekap"]);
    const cleanedData = sanitizeData(data);
    const safeParam = Number(param || 1);
    const targetPair = sanitizeTargetPair(target_pair);

    if (!allowedTypes.has(type) || !cleanedData || !Number.isInteger(safeParam) || safeParam < 1 || safeParam > 8) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const analysisData = remapDataForTargetPair(type, cleanedData, targetPair);
    const result = runAnalysis(type, analysisData, safeParam);
    return res.json({ ...result, target_pair: targetPair });
  } catch (e: any) {
    return res.status(500).json({ error: "Gagal memproses analisa" });
  }
}

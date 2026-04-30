import jwt from "jsonwebtoken";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, deviceCode } = req.body;

  if (!token || !deviceCode) {
    return res.status(401).json({ valid: false, error: "Token atau perangkat tidak ditemukan" });
  }

  let JWT_SECRET = "";
  try {
    JWT_SECRET = requireEnv("JWT_SECRET");
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({ valid: false, error: "Kesalahan konfigurasi server" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded.deviceCode || decoded.deviceCode !== String(deviceCode)) {
      return res.status(401).json({ valid: false, error: "Token tidak cocok dengan perangkat" });
    }

    return res.json({ valid: true, role: decoded.role });
  } catch (e: any) {
    const message = e.name === "TokenExpiredError" ? "Token sudah kadaluarsa" : "Token tidak valid";
    return res.status(401).json({ valid: false, error: message });
  }
}

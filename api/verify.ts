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

    if (decoded.tokenVersion !== expectedVersion) {
      return res.status(401).json({
        valid: false,
        error: "Sesi lama. Silakan login ulang."
      });
    }

    if (!decoded.deviceId || decoded.deviceId !== String(deviceId)) {
      return res.status(401).json({
        valid: false,
        error: "Token tidak cocok dengan perangkat"
      });
    }

    return res.json({
      valid: true,
      role: decoded.role,
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

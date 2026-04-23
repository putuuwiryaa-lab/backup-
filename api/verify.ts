import jwt from "jsonwebtoken";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, deviceCode } = req.body;
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
    
    // Cek device code cocok
    if (decoded.deviceCode !== deviceCode) {
      return res.status(401).json({ valid: false, error: "Device tidak cocok" });
    }

    res.json({ valid: true, role: decoded.role });
  } catch (e) {
    res.status(401).json({ valid: false, error: "Token invalid atau expired" });
  }
}

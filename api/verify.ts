import jwt from "jsonwebtoken";

export default async function handler(req: any, res: any) {
  // Hanya menerima method POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, deviceCode } = req.body;

  if (!token) {
    return res.status(401).json({ valid: false, error: "Token tidak ditemukan" });
  }

  // Pastikan JWT_SECRET sudah di-set di environment variables
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET belum diatur di environment variables");
    return res.status(500).json({ valid: false, error: "Kesalahan konfigurasi server" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // (Opsional) Jika klien mengirim deviceCode, cocokkan dengan yang ada di token
    if (deviceCode && decoded.deviceCode && decoded.deviceCode !== deviceCode) {
      return res.status(401).json({ valid: false, error: "Token tidak cocok dengan perangkat" });
    }

    // Token valid, kirim role
    return res.json({ valid: true, role: decoded.role });
  } catch (e: any) {
    // Bisa karena expired atau invalid signature
    const message = e.name === "TokenExpiredError" 
      ? "Token sudah kadaluarsa" 
      : "Token tidak valid";
    return res.status(401).json({ valid: false, error: message });
  }
}

// api/verify.ts
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { token } = req.body;
  if (!token) return res.status(401).json({ valid: false });

  const parts = token.split("_");
  if (parts.length < 3 || parts[0] !== "supreme") {
    return res.status(401).json({ valid: false });
  }

  const role = parts[1];
  if (!["MASTER", "PRO", "TRIAL"].includes(role)) {
    return res.status(401).json({ valid: false });
  }

  res.json({ valid: true, role });
}

import jwt from "jsonwebtoken";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { pin, deviceCode } = req.body;
  const devId = parseInt(deviceCode) || 0;

  const masterPin = process.env.MASTER_PIN || "120800";
  const proPin = ((devId * 5) + 2026).toString();
  const trialPin = ((devId * 3) + 1234).toString();

  let role = null;
  if (pin === masterPin) role = "MASTER";
  else if (pin === proPin) role = "PRO";
  else if (pin === trialPin) role = "TRIAL";

  if (role) {
    const expiresIn = role === "TRIAL" ? "14d" : role === "PRO" ? "60d" : "365d";
    
    const token = jwt.sign(
      { role, deviceCode },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn }
    );
    res.json({ success: true, role, token });
  } else {
    res.status(401).json({ success: false, error: "PIN SALAH!" });
  }
}

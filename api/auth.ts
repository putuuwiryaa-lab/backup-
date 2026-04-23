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
    res.json({ success: true, role, token: `supreme_${role}_${Date.now()}` });
  } else {
    res.status(401).json({ success: false, error: "PIN SALAH!" });
  }
}

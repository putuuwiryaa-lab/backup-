import { runAnalysis } from "./predictionEngine.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, data, param } = req.body;

    if (!type || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const result = runAnalysis(type, data, param || 1);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

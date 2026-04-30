// api/admin.ts
import { createClient } from '@supabase/supabase-js';
import jwt from "jsonwebtoken";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur di environment variables`);
  return value;
}

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);

export default async function handler(req: any, res: any) {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, requireEnv("JWT_SECRET")) as any;

    if (decoded.role !== "MASTER") {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch {
    return res.status(401).json({ error: "Token invalid" });
  }

  const { action, marketId, historyData, order, markets } = req.body;

  try {
    if (action === "save") {
      const { error } = await supabase
        .from("markets")
        .upsert({ id: marketId, history_data: historyData, updated_at: new Date().toISOString() });

      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("markets")
        .delete()
        .eq("id", marketId);

      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "add") {
      const { error } = await supabase
        .from("markets")
        .upsert({ id: marketId, name: marketId, history_data: "", order: order || 99, updated_at: new Date().toISOString() });

      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "reorder") {
      if (!Array.isArray(markets)) {
        return res.status(400).json({ error: "Data tidak valid" });
      }

      for (const m of markets) {
        const { error } = await supabase
          .from("markets")
          .update({ order: m.order })
          .eq("id", m.id);

        if (error) throw error;
      }

      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Action tidak dikenal" });
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json({ error: "Gagal memproses admin request" });
  }
}

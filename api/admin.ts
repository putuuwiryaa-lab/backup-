// api/admin.ts
import { createClient } from '@supabase/supabase-js';
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  // Verifikasi token MASTER
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = if (!process.env.JWT_SECRET) {
  return res.status(500).json({ error: "Kesalahan konfigurasi server" });
}

jwt.verify(token, process.env.JWT_SECRET) as any;
    if (decoded.role !== "MASTER") return res.status(403).json({ error: "Forbidden" });
  } catch {
    return res.status(401).json({ error: "Token invalid" });
  }

  const { action, marketId, historyData, order, markets } = req.body;

  try {
    if (action === "save") {
      const { error } = await supabase
        .from('markets')
        .upsert({ id: marketId, history_data: historyData, updated_at: new Date().toISOString() });
      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', marketId);
      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "add") {
      const { error } = await supabase
        .from('markets')
        .upsert({ id: marketId, name: marketId, history_data: "", order: order || 99, updated_at: new Date().toISOString() });
      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === "reorder") {
      for (const m of markets) {
        const { error } = await supabase
          .from('markets')
          .update({ order: m.order })
          .eq('id', m.id);
        if (error) throw error;
      }
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Action tidak dikenal" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

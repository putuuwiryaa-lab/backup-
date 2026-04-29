import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RekapHistory({ marketId, mode }: { marketId: string; mode: "invest" | "top" }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!marketId || !mode) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rekap_line_evaluations")
          .select("id,from_result,new_result,is_hit,evaluated_at")
          .eq("market_id", marketId)
          .eq("mode", mode)
          .order("evaluated_at", { ascending: false })
          .limit(6);
        if (error) throw error;
        if (active) setRows(data || []);
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [marketId, mode]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">
        Memuat riwayat...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">
        Riwayat evaluasi belum ada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">Riwayat Evaluasi</span>
        <span className="text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Terbaru</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-3xl border border-[var(--border2)] bg-black/25 p-3 text-center">
            <div className="font-['JetBrains_Mono'] text-[12px] font-black tracking-[1px] text-[var(--text)]">
              {row.from_result} → {row.new_result}
            </div>
            <div className={`mt-2 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[1px] ${row.is_hit ? "bg-[var(--green-dim)] text-[var(--green)]" : "bg-[var(--red-dim)] text-[var(--red)]"}`}>
              {row.is_hit ? "MASUK" : "TIDAK MASUK"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

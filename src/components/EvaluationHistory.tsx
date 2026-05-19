import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type EvaluationMode = "ai" | "mati" | "jumlah" | "shio";
type EvaluationPosition = "all" | "as" | "kop" | "kepala" | "ekor";
const EVALUATION_HISTORY_LIMIT = 15;

function labelFromMatiDetail(detail: any) {
  if (detail?.position) return detail?.safe ? "MASUK" : "ZONK";
  const asSafe = Boolean(detail?.AS?.safe);
  const kopSafe = Boolean(detail?.KOP?.safe);
  const kepalaSafe = Boolean(detail?.KEPALA?.safe);
  const ekorSafe = Boolean(detail?.EKOR?.safe);
  if (asSafe && kopSafe && kepalaSafe && ekorSafe) return "4D";
  if (kopSafe && kepalaSafe && ekorSafe) return "3D";
  if (kepalaSafe && ekorSafe) return "2D";
  return "ZONK";
}

function displayLabel(row: any, mode: EvaluationMode) {
  if (mode === "mati") {
    const normalized = row.status === "TIDAK MASUK" ? "ZONK" : row.status;
    if (["4D", "3D", "2D", "MASUK", "ZONK"].includes(normalized)) return normalized;
    return labelFromMatiDetail(row.detail);
  }
  const rawLabel = row.status || (row.is_hit ? "MASUK" : "ZONK");
  return rawLabel === "TIDAK MASUK" ? "ZONK" : rawLabel;
}

export default function EvaluationHistory({
  marketId,
  mode,
  param,
  position = "all",
  title = "Riwayat Evaluasi",
}: {
  marketId: string;
  mode: EvaluationMode;
  param: number;
  position?: EvaluationPosition;
  title?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!marketId || !mode || !param) return;
      setLoading(true);
      try {
        let query = supabase
          .from("analysis_evaluations")
          .select("id,from_result,new_result,is_hit,status,detail,evaluated_at,position")
          .eq("market_id", marketId)
          .eq("mode", mode)
          .eq("param", param)
          .order("evaluated_at", { ascending: false })
          .limit(EVALUATION_HISTORY_LIMIT);
        if (position) query = query.eq("position", position);
        const { data, error } = await query;
        if (error) throw error;
        if (active) setRows((data || []).slice(0, EVALUATION_HISTORY_LIMIT));
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [marketId, mode, param, position]);

  if (loading) {
    return <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Memuat riwayat...</div>;
  }

  if (!rows.length) {
    return <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Riwayat evaluasi belum ada</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">{title}</span>
        <span className="text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">15 Terbaru</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map((row) => {
          const label = displayLabel(row, mode);
          const isSuccess = label !== "ZONK";
          return (
            <div key={row.id} className="rounded-3xl border border-[var(--border2)] bg-black/25 p-2 text-center">
              <div className="font-['JetBrains_Mono'] text-[10px] font-black tracking-[0.5px] text-[var(--text)] sm:text-[11px]">{row.from_result} → {row.new_result}</div>
              <div className={`mt-2 rounded-full px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.5px] ${isSuccess ? "bg-[var(--green-dim)] text-[var(--green)]" : "bg-[var(--red-dim)] text-[var(--red)]"}`}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

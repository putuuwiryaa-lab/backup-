import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type EvaluationMode = "ai" | "bbfs" | "mati" | "jumlah" | "shio";
type EvaluationPosition = "all" | "as" | "kop" | "kepala" | "ekor";
type TargetPair = "depan" | "tengah" | "belakang";
type AnalysisScope = "default" | "4d" | "3d" | "2d_depan" | "2d_tengah" | "2d_belakang";

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
  targetPair = "belakang",
  analysisScope = "default",
  title = "Riwayat Evaluasi",
}: {
  marketId: string;
  mode: EvaluationMode;
  param: number;
  position?: EvaluationPosition;
  targetPair?: TargetPair;
  analysisScope?: AnalysisScope;
  title?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const showAi2DigitNote = mode === "ai" && param === 2;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!marketId || !mode || !param) return;
      setLoading(true);

      try {
        let query = supabase
          .from("analysis_evaluations")
          .select("id,from_result,new_result,is_hit,status,detail,evaluated_at,position,target_pair,analysis_scope")
          .eq("market_id", marketId)
          .eq("mode", mode)
          .eq("param", param)
          .eq("analysis_scope", analysisScope)
          .order("evaluated_at", { ascending: false })
          .limit(EVALUATION_HISTORY_LIMIT);

        if (position) query = query.eq("position", position);
        if (mode !== "mati") query = query.eq("target_pair", targetPair);

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
    return () => {
      active = false;
    };
  }, [marketId, mode, param, position, targetPair, analysisScope]);

  if (loading) {
    return (
      <div className="ui-card ui-motion-in rounded-3xl p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--ui-text-muted)]">
        Memuat riwayat...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="ui-card ui-motion-in rounded-3xl p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--ui-text-muted)]">
        Riwayat evaluasi belum ada
      </div>
    );
  }

  return (
    <div className="ui-motion-in space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="ui-title text-[11px]">{title}</span>
        <span className="ui-label text-[9px]">15 Terbaru</span>
      </div>

      {showAi2DigitNote && (
        <div className="ui-note ui-motion-in border-[rgba(246,198,106,0.22)] bg-[rgba(246,198,106,0.08)] px-3 py-2 text-[9.5px] font-bold leading-relaxed tracking-[0.4px] text-[var(--ui-gold-bright)]">
          Catatan: jika AI 2 digit terlalu sering ZONK, lebih bijak jadikan hasilnya sebagai OFF 2 digit.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {rows.map((row) => {
          const label = displayLabel(row, mode);
          const isSuccess = label !== "ZONK";

          return (
            <div key={row.id} className="ui-card ui-motion-soft ui-lift rounded-3xl p-2 text-center">
              <div className="font-['JetBrains_Mono'] text-[10px] font-black tracking-[0.5px] text-[var(--ui-text)] sm:text-[11px]">
                {row.from_result} → {row.new_result}
              </div>
              <div
                className={`mt-2 rounded-full px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.5px] ${
                  isSuccess ? "bg-[var(--green-dim)] text-[var(--ui-green)]" : "bg-[var(--red-dim)] text-[var(--ui-red)]"
                }`}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { MiniLabel } from "./Shared";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RECOMMENDATION_SAMPLE_SIZE = 15;
const RECOMMENDATION_MIN_SAMPLE = 10;
const RECOMMENDATION_FULL_SAMPLE_WINS = 11;
const RECOMMENDATION_PARTIAL_WIN_RATE = 0.75;

type RecommendedMap = Record<string, boolean>;

function isSuccessStatus(row: any) {
  return row?.status !== "TIDAK MASUK" && row?.status !== "ZONK" && row?.is_hit !== false;
}

function pickRecommendation(rows: any[], params: number[], prefer: "low" | "high") {
  const goodParams = params.filter((param) => {
    const sample = rows.filter((row) => Number(row.param) === param).slice(0, RECOMMENDATION_SAMPLE_SIZE);
    if (sample.length < RECOMMENDATION_MIN_SAMPLE) return false;
    const wins = sample.filter(isSuccessStatus).length;
    if (sample.length >= RECOMMENDATION_SAMPLE_SIZE) return wins >= RECOMMENDATION_FULL_SAMPLE_WINS;
    return wins / sample.length >= RECOMMENDATION_PARTIAL_WIN_RATE;
  });
  if (!goodParams.length) return null;
  return prefer === "low" ? Math.min(...goodParams) : Math.max(...goodParams);
}

async function loadRows(marketId: string, mode: string, position: string, params: number[]) {
  const { data, error } = await supabase
    .from("analysis_evaluations")
    .select("param,is_hit,status,evaluated_at")
    .eq("market_id", marketId)
    .eq("mode", mode)
    .eq("position", position)
    .in("param", params)
    .order("evaluated_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return data || [];
}

export default function CustomDigitBuilder({
  show,
  marketId,
  meta,
  customAiDigit,
  setCustomAiDigit,
  customIncludeBBFS,
  setCustomIncludeBBFS,
  customOffKepalaCount,
  setCustomOffKepalaCount,
  customOffEkorCount,
  setCustomOffEkorCount,
  customOffJumlahCount,
  setCustomOffJumlahCount,
  customOffShioCount,
  setCustomOffShioCount,
  onGenerate,
}: {
  show: boolean;
  marketId: string;
  meta: { accent: string; soft: string };
  customAiDigit: 2 | 4 | 6 | null;
  setCustomAiDigit: (value: 2 | 4 | 6) => void;
  customIncludeBBFS: boolean;
  setCustomIncludeBBFS: (fn: (value: boolean) => boolean) => void;
  customOffKepalaCount: number | null;
  setCustomOffKepalaCount: (value: number | null) => void;
  customOffEkorCount: number | null;
  setCustomOffEkorCount: (value: number | null) => void;
  customOffJumlahCount: number | null;
  setCustomOffJumlahCount: (value: number | null) => void;
  customOffShioCount: number | null;
  setCustomOffShioCount: (value: number | null) => void;
  onGenerate: () => void;
}) {
  const [recommended, setRecommended] = useState<RecommendedMap>({});

  useEffect(() => {
    let active = true;
    const loadRecommendations = async () => {
      if (!show || !marketId) return;
      try {
        const [aiRows, bbfsRows, kepalaRows, ekorRows, jumlahRows, shioRows] = await Promise.all([
          loadRows(marketId, "ai", "all", [2, 4, 6]),
          loadRows(marketId, "ai", "all", [8]),
          loadRows(marketId, "mati", "kepala", [1, 2, 3]),
          loadRows(marketId, "mati", "ekor", [1, 2, 3]),
          loadRows(marketId, "jumlah", "all", [1, 2, 3]),
          loadRows(marketId, "shio", "all", [1, 2, 3]),
        ]);
        const next: RecommendedMap = {};
        const aiPick = pickRecommendation(aiRows, [2, 4, 6], "low");
        const kepalaPick = pickRecommendation(kepalaRows, [1, 2, 3], "high");
        const ekorPick = pickRecommendation(ekorRows, [1, 2, 3], "high");
        const jumlahPick = pickRecommendation(jumlahRows, [1, 2, 3], "high");
        const shioPick = pickRecommendation(shioRows, [1, 2, 3], "high");
        const bbfsPick = pickRecommendation(bbfsRows, [8], "low");
        if (aiPick) next[`ai-${aiPick}`] = true;
        if (bbfsPick) next.bbfs = true;
        if (kepalaPick) next[`kepala-${kepalaPick}`] = true;
        if (ekorPick) next[`ekor-${ekorPick}`] = true;
        if (jumlahPick) next[`jumlah-${jumlahPick}`] = true;
        if (shioPick) next[`shio-${shioPick}`] = true;
        if (active) setRecommended(next);
      } catch {
        if (active) setRecommended({});
      }
    };
    loadRecommendations();
    return () => { active = false; };
  }, [show, marketId]);

  const thumbs = useMemo(() => recommended, [recommended]);

  if (!show) return null;

  const optionButton = (active: boolean, label: string, onClick: () => void, extraClass = "", recommendKey?: string) => {
    const isRecommended = recommendKey ? Boolean(thumbs[recommendKey]) : false;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${extraClass} relative rounded-3xl border p-4 text-center transition active:scale-95`}
        style={{ borderColor: active ? meta.accent : isRecommended ? `${meta.accent}88` : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--text-dim)" }}
      >
        {isRecommended && <span className="absolute right-3 top-2 text-[15px] leading-none">👍</span>}
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="premium-panel mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Custom Digit</div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-dim)]">Pilih filter yang mau dipakai, lalu generate.</p>
      </div>

      <section className="space-y-2">
        <MiniLabel>AI</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {optionButton(customAiDigit === 2, "2 Digit", () => setCustomAiDigit(2), "", "ai-2")}
          {optionButton(customAiDigit === 4, "4 Digit", () => setCustomAiDigit(4), "", "ai-4")}
          {optionButton(customAiDigit === 6, "6 Digit", () => setCustomAiDigit(6), "", "ai-6")}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>BBFS</MiniLabel>
        {optionButton(customIncludeBBFS, "Include BBFS", () => setCustomIncludeBBFS((value) => !value), "w-full", "bbfs")}
      </section>

      <section className="space-y-2">
        <MiniLabel>Angka Mati Kepala</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffKepalaCount === n, String(n), () => setCustomOffKepalaCount(customOffKepalaCount === n ? null : n), "", `kepala-${n}`))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>Angka Mati Ekor</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffEkorCount === n, String(n), () => setCustomOffEkorCount(customOffEkorCount === n ? null : n), "", `ekor-${n}`))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>Jumlah Mati</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffJumlahCount === n, String(n), () => setCustomOffJumlahCount(customOffJumlahCount === n ? null : n), "", `jumlah-${n}`))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>Shio Mati</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffShioCount === n, String(n), () => setCustomOffShioCount(customOffShioCount === n ? null : n), "", `shio-${n}`))}
        </div>
      </section>

      <button onClick={onGenerate} className="primary-button flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Generate</button>
    </div>
  );
}

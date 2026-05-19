import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { MiniLabel } from "./Shared";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RECOMMENDATION_SAMPLE_SIZE = 15;
const RECOMMENDATION_MIN_SAMPLE = 10;

const AI_WIN_THRESHOLDS: Record<number, number> = {
  2: 7,
  4: 10,
  6: 13,
  8: 11,
};

const OFF_WIN_THRESHOLDS: Record<number, number> = {
  1: 13,
  2: 12,
  3: 11,
};

const PARTIAL_AI_WIN_RATES: Record<number, number> = {
  2: 7 / 15,
  4: 10 / 15,
  6: 13 / 15,
  8: 11 / 15,
};

const PARTIAL_OFF_WIN_RATES: Record<number, number> = {
  1: 13 / 15,
  2: 12 / 15,
  3: 11 / 15,
};

type RecommendationGroup = "ai" | "off";
type RecommendedMap = Record<string, "thumb" | "fire">;

function isSuccessStatus(row: any) {
  return row?.status !== "TIDAK MASUK" && row?.status !== "ZONK" && row?.is_hit !== false;
}

function getFullThreshold(group: RecommendationGroup, param: number) {
  return group === "ai" ? AI_WIN_THRESHOLDS[param] : OFF_WIN_THRESHOLDS[param];
}

function getPartialWinRate(group: RecommendationGroup, param: number) {
  return group === "ai" ? PARTIAL_AI_WIN_RATES[param] : PARTIAL_OFF_WIN_RATES[param];
}

function scoreParam(rows: any[], param: number, group: RecommendationGroup) {
  const sample = rows.filter((row) => Number(row.param) === param).slice(0, RECOMMENDATION_SAMPLE_SIZE);
  if (sample.length < RECOMMENDATION_MIN_SAMPLE) return null;
  const wins = sample.filter(isSuccessStatus).length;
  const isPerfect = sample.length >= RECOMMENDATION_SAMPLE_SIZE && wins === RECOMMENDATION_SAMPLE_SIZE;
  const fullThreshold = getFullThreshold(group, param);
  const partialWinRate = getPartialWinRate(group, param);
  if (!fullThreshold || !partialWinRate) return null;
  const isRecommended = sample.length >= RECOMMENDATION_SAMPLE_SIZE
    ? wins >= fullThreshold
    : wins / sample.length >= partialWinRate;
  if (!isRecommended) return null;
  return { param, badge: isPerfect ? "fire" as const : "thumb" as const };
}

function pickRecommendation(rows: any[], params: number[], prefer: "low" | "high", group: RecommendationGroup) {
  const scored = params.map((param) => scoreParam(rows, param, group)).filter(Boolean) as Array<{ param: number; badge: "thumb" | "fire" }>;
  if (!scored.length) return null;
  const selectedParam = prefer === "low" ? Math.min(...scored.map((item) => item.param)) : Math.max(...scored.map((item) => item.param));
  return scored.find((item) => item.param === selectedParam) || null;
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
        const aiPick = pickRecommendation(aiRows, [2, 4, 6], "low", "ai");
        const kepalaPick = pickRecommendation(kepalaRows, [1, 2, 3], "high", "off");
        const ekorPick = pickRecommendation(ekorRows, [1, 2, 3], "high", "off");
        const jumlahPick = pickRecommendation(jumlahRows, [1, 2, 3], "high", "off");
        const shioPick = pickRecommendation(shioRows, [1, 2, 3], "high", "off");
        const bbfsPick = pickRecommendation(bbfsRows, [8], "low", "ai");
        if (aiPick) next[`ai-${aiPick.param}`] = aiPick.badge;
        if (bbfsPick) next.bbfs = bbfsPick.badge;
        if (kepalaPick) next[`kepala-${kepalaPick.param}`] = kepalaPick.badge;
        if (ekorPick) next[`ekor-${ekorPick.param}`] = ekorPick.badge;
        if (jumlahPick) next[`jumlah-${jumlahPick.param}`] = jumlahPick.badge;
        if (shioPick) next[`shio-${shioPick.param}`] = shioPick.badge;
        if (active) setRecommended(next);
      } catch {
        if (active) setRecommended({});
      }
    };
    loadRecommendations();
    return () => { active = false; };
  }, [show, marketId]);

  const badges = useMemo(() => recommended, [recommended]);

  if (!show) return null;

  const optionButton = (active: boolean, label: string, onClick: () => void, extraClass = "", recommendKey?: string) => {
    const badge = recommendKey ? badges[recommendKey] : undefined;
    const isRecommended = Boolean(badge);
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${extraClass} relative rounded-3xl border p-4 text-center transition active:scale-95`}
        style={{ borderColor: active ? meta.accent : isRecommended ? `${meta.accent}88` : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--text-dim)" }}
      >
        {badge && <span className="absolute right-3 top-2 text-[15px] leading-none">{badge === "fire" ? "🔥" : "👍"}</span>}
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

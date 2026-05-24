import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { customFocusPairs, customFocusPositionLabels, customFocusPositions, type CustomFocus, type PositionKey, type TargetPair } from "../../lib/analysis/customDigit";
import { MiniLabel } from "./Shared";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RECOMMENDATION_SAMPLE_SIZE = 15;
const RECOMMENDATION_MIN_SAMPLE = 10;

const AI_WIN_THRESHOLDS: Record<number, number> = { 2: 7, 4: 11, 6: 12, 8: 11 };
const OFF_WIN_THRESHOLDS: Record<number, number> = { 1: 13, 2: 12, 3: 11 };
const PARTIAL_AI_WIN_RATES: Record<number, number> = { 2: 7 / 15, 4: 11 / 15, 6: 12 / 15, 8: 11 / 15 };
const PARTIAL_OFF_WIN_RATES: Record<number, number> = { 1: 13 / 15, 2: 12 / 15, 3: 11 / 15 };

type RecommendationGroup = "ai" | "off";
type RecommendedMap = Record<string, "thumb" | "fire">;
type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairCountMap = Partial<Record<TargetPair, number | null>>;
type PairBooleanMap = Partial<Record<TargetPair, boolean>>;

const pairLabel: Record<TargetPair, string> = {
  depan: "DEPAN",
  tengah: "TENGAH",
  belakang: "BELAKANG",
};

const pairSubtitle: Record<TargetPair, string> = {
  depan: "AS - KOP",
  tengah: "KOP - KEPALA",
  belakang: "KEPALA - EKOR",
};

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
  const isRecommended = sample.length >= RECOMMENDATION_SAMPLE_SIZE ? wins >= fullThreshold : wins / sample.length >= partialWinRate;
  if (!isRecommended) return null;
  return { param, badge: isPerfect ? "fire" as const : "thumb" as const };
}

function pickRecommendation(rows: any[], params: number[], prefer: "low" | "high", group: RecommendationGroup) {
  const scored = params.map((param) => scoreParam(rows, param, group)).filter(Boolean) as Array<{ param: number; badge: "thumb" | "fire" }>;
  if (!scored.length) return null;
  const selectedParam = prefer === "low" ? Math.min(...scored.map((item) => item.param)) : Math.max(...scored.map((item) => item.param));
  return scored.find((item) => item.param === selectedParam) || null;
}

async function loadRows(marketId: string, mode: string, position: string, params: number[], targetPair: TargetPair = "belakang") {
  const { data, error } = await supabase
    .from("analysis_evaluations")
    .select("param,is_hit,status,evaluated_at,target_pair")
    .eq("market_id", marketId)
    .eq("mode", mode)
    .eq("position", position)
    .eq("target_pair", targetPair)
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
  customFocus,
  customAiDigitByPair,
  setCustomAiDigitForPair,
  customIncludeBBFSByPair,
  setCustomIncludeBBFSForPair,
  customOffAsCount,
  setCustomOffAsCount,
  customOffKopCount,
  setCustomOffKopCount,
  customOffKepalaCount,
  setCustomOffKepalaCount,
  customOffEkorCount,
  setCustomOffEkorCount,
  customOffJumlahCountByPair,
  setCustomOffJumlahCountForPair,
  customOffShioCountByPair,
  setCustomOffShioCountForPair,
  onGenerate,
}: {
  show: boolean;
  marketId: string;
  meta: { accent: string; soft: string };
  customFocus: CustomFocus;
  customAiDigitByPair: PairAiMap;
  setCustomAiDigitForPair: (pair: TargetPair, value: 2 | 4 | 6 | null) => void;
  customIncludeBBFSByPair: PairBooleanMap;
  setCustomIncludeBBFSForPair: (pair: TargetPair, value: boolean) => void;
  customOffAsCount: number | null;
  setCustomOffAsCount: (value: number | null) => void;
  customOffKopCount: number | null;
  setCustomOffKopCount: (value: number | null) => void;
  customOffKepalaCount: number | null;
  setCustomOffKepalaCount: (value: number | null) => void;
  customOffEkorCount: number | null;
  setCustomOffEkorCount: (value: number | null) => void;
  customOffJumlahCountByPair: PairCountMap;
  setCustomOffJumlahCountForPair: (pair: TargetPair, value: number | null) => void;
  customOffShioCountByPair: PairCountMap;
  setCustomOffShioCountForPair: (pair: TargetPair, value: number | null) => void;
  onGenerate: () => void;
}) {
  const [recommended, setRecommended] = useState<RecommendedMap>({});

  useEffect(() => {
    let active = true;
    const loadRecommendations = async () => {
      if (!show || !marketId) return;
      try {
        const pairs = customFocusPairs(customFocus);
        const next: RecommendedMap = {};
        await Promise.all(pairs.map(async (pair) => {
          const [aiRows, bbfsRows, jumlahRows, shioRows] = await Promise.all([
            loadRows(marketId, "ai", "all", [2, 4, 6], pair),
            loadRows(marketId, "ai", "all", [8], pair),
            loadRows(marketId, "jumlah", "all", [1, 2, 3], pair),
            loadRows(marketId, "shio", "all", [1, 2, 3], pair),
          ]);
          const aiPick = pickRecommendation(aiRows, [2, 4, 6], "low", "ai");
          const jumlahPick = pickRecommendation(jumlahRows, [1, 2, 3], "high", "off");
          const shioPick = pickRecommendation(shioRows, [1, 2, 3], "high", "off");
          const bbfsPick = pickRecommendation(bbfsRows, [8], "low", "ai");
          if (aiPick) next[`ai-${pair}-${aiPick.param}`] = aiPick.badge;
          if (bbfsPick) next[`bbfs-${pair}`] = bbfsPick.badge;
          if (jumlahPick) next[`jumlah-${pair}-${jumlahPick.param}`] = jumlahPick.badge;
          if (shioPick) next[`shio-${pair}-${shioPick.param}`] = shioPick.badge;
        }));

        const [asRows, kopRows, kepalaRows, ekorRows] = await Promise.all([
          loadRows(marketId, "mati", "as", [1, 2, 3]),
          loadRows(marketId, "mati", "kop", [1, 2, 3]),
          loadRows(marketId, "mati", "kepala", [1, 2, 3]),
          loadRows(marketId, "mati", "ekor", [1, 2, 3]),
        ]);
        const asPick = pickRecommendation(asRows, [1, 2, 3], "high", "off");
        const kopPick = pickRecommendation(kopRows, [1, 2, 3], "high", "off");
        const kepalaPick = pickRecommendation(kepalaRows, [1, 2, 3], "high", "off");
        const ekorPick = pickRecommendation(ekorRows, [1, 2, 3], "high", "off");
        if (asPick) next[`as-${asPick.param}`] = asPick.badge;
        if (kopPick) next[`kop-${kopPick.param}`] = kopPick.badge;
        if (kepalaPick) next[`kepala-${kepalaPick.param}`] = kepalaPick.badge;
        if (ekorPick) next[`ekor-${ekorPick.param}`] = ekorPick.badge;
        if (active) setRecommended(next);
      } catch {
        if (active) setRecommended({});
      }
    };
    loadRecommendations();
    return () => { active = false; };
  }, [show, marketId, customFocus]);

  const badges = useMemo(() => recommended, [recommended]);
  const visiblePositions = customFocusPositions(customFocus);
  const visiblePairs = customFocusPairs(customFocus);
  const positionValues: Record<PositionKey, number | null> = { as: customOffAsCount, kop: customOffKopCount, kepala: customOffKepalaCount, ekor: customOffEkorCount };
  const positionSetters: Record<PositionKey, (value: number | null) => void> = { as: setCustomOffAsCount, kop: setCustomOffKopCount, kepala: setCustomOffKepalaCount, ekor: setCustomOffEkorCount };

  if (!show) return null;

  const optionButton = (active: boolean, label: string, onClick: () => void, extraClass = "", recommendKey?: string) => {
    const badge = recommendKey ? badges[recommendKey] : undefined;
    const isRecommended = Boolean(badge);
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${extraClass} ui-motion-soft ui-tap ui-lift relative rounded-3xl border p-4 text-center`}
        style={{ borderColor: active ? meta.accent : isRecommended ? `${meta.accent}88` : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--ui-text-muted)" }}
      >
        {badge && <span className="absolute right-3 top-2 text-[15px] leading-none">{badge === "fire" ? "🔥" : "👍"}</span>}
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="ui-panel ui-motion-in mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="ui-title text-[10px]" style={{ color: meta.accent }}>Custom Digit</div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--ui-text-muted)]">Pilih filter yang mau dipakai, lalu generate.</p>
      </div>

      {visiblePairs.map((pair) => (
        <section key={`ai-${pair}`} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>AI {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[2, 4, 6].map((n) => optionButton(customAiDigitByPair[pair] === n, `${n} Digit`, () => setCustomAiDigitForPair(pair, customAiDigitByPair[pair] === n ? null : n as 2 | 4 | 6), "", `ai-${pair}-${n}`))}
          </div>
        </section>
      ))}

      {visiblePairs.map((pair) => (
        <section key={`bbfs-${pair}`} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>BBFS {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
          {optionButton(Boolean(customIncludeBBFSByPair[pair]), "Include BBFS", () => setCustomIncludeBBFSForPair(pair, !customIncludeBBFSByPair[pair]), "w-full", `bbfs-${pair}`)}
        </section>
      ))}

      {visiblePositions.map((position) => (
        <section key={position} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>Angka Mati {customFocusPositionLabels[position]}</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => optionButton(positionValues[position] === n, String(n), () => positionSetters[position](positionValues[position] === n ? null : n), "", `${position}-${n}`))}
          </div>
        </section>
      ))}

      {visiblePairs.map((pair) => (
        <section key={`jumlah-${pair}`} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>Jumlah Mati {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => optionButton(customOffJumlahCountByPair[pair] === n, String(n), () => setCustomOffJumlahCountForPair(pair, customOffJumlahCountByPair[pair] === n ? null : n), "", `jumlah-${pair}-${n}`))}
          </div>
        </section>
      ))}

      {visiblePairs.map((pair) => (
        <section key={`shio-${pair}`} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>Shio Mati {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => optionButton(customOffShioCountByPair[pair] === n, String(n), () => setCustomOffShioCountForPair(pair, customOffShioCountByPair[pair] === n ? null : n), "", `shio-${pair}-${n}`))}
          </div>
        </section>
      ))}

      <button onClick={onGenerate} className="primary-button ui-motion-soft ui-tap flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px]"><RefreshCw size={18} /> Generate</button>
    </div>
  );
}

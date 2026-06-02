import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  customFocusPairs,
  customFocusPositionLabels,
  customFocusPositions,
  customFocusToBBFSScope,
  type CustomFocus,
  type PositionKey,
  type TargetPair,
} from "../../lib/analysis/customDigit";
import { MiniLabel } from "./Shared";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RECOMMENDATION_SAMPLE_SIZE = 15;
const RECOMMENDATION_MIN_SAMPLE = 10;

const AI_WIN_THRESHOLDS: Record<number, number> = { 1: 9, 2: 9, 3: 11, 4: 11, 5: 13, 6: 13 };
const AI_DERIVED_WIN_THRESHOLDS: Record<number, number> = { 1: 9 };
const BBFS_WIN_THRESHOLDS: Record<number, number> = { 7: 8, 8: 10, 9: 12 };
const MATI_WIN_THRESHOLDS: Record<number, number> = { 1: 14, 2: 13, 3: 11 };
const JUMLAH_WIN_THRESHOLDS: Record<number, number> = { 1: 14, 2: 12, 3: 11 };
const SHIO_WIN_THRESHOLDS: Record<number, number> = { 1: 14, 2: 13, 3: 12 };

const AI_PARTIAL_WIN_RATES: Record<number, number> = { 1: 9 / 15, 2: 9 / 15, 3: 11 / 15, 4: 11 / 15, 5: 13 / 15, 6: 13 / 15 };
const AI_DERIVED_PARTIAL_WIN_RATES: Record<number, number> = { 1: 9 / 15 };
const BBFS_PARTIAL_WIN_RATES: Record<number, number> = { 7: 8 / 15, 8: 10 / 15, 9: 12 / 15 };
const MATI_PARTIAL_WIN_RATES: Record<number, number> = { 1: 14 / 15, 2: 13 / 15, 3: 11 / 15 };
const JUMLAH_PARTIAL_WIN_RATES: Record<number, number> = { 1: 14 / 15, 2: 12 / 15, 3: 11 / 15 };
const SHIO_PARTIAL_WIN_RATES: Record<number, number> = { 1: 14 / 15, 2: 13 / 15, 3: 12 / 15 };

type RecommendationGroup = "ai" | "ai_parity" | "ai_size" | "bbfs" | "mati" | "jumlah" | "shio";
type RecommendationBadge = "thumb" | "fire";
type RecommendedMap = Record<string, RecommendationBadge>;
type ScoredRecommendation = { param: number; badge: RecommendationBadge };

type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairBoolMap = Partial<Record<TargetPair, boolean>>;
type PairCountMap = Partial<Record<TargetPair, number | null>>;
type BBFSDigit = 7 | 8 | 9;
type Ai3DDigit = 1 | 3 | 5;
type Ai4DDigit = 1 | 2 | 4;

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
  if (group === "ai") return AI_WIN_THRESHOLDS[param];
  if (group === "ai_parity" || group === "ai_size") return AI_DERIVED_WIN_THRESHOLDS[param];
  if (group === "bbfs") return BBFS_WIN_THRESHOLDS[param];
  if (group === "jumlah") return JUMLAH_WIN_THRESHOLDS[param];
  if (group === "shio") return SHIO_WIN_THRESHOLDS[param];
  return MATI_WIN_THRESHOLDS[param];
}

function getPartialWinRate(group: RecommendationGroup, param: number) {
  if (group === "ai") return AI_PARTIAL_WIN_RATES[param];
  if (group === "ai_parity" || group === "ai_size") return AI_DERIVED_PARTIAL_WIN_RATES[param];
  if (group === "bbfs") return BBFS_PARTIAL_WIN_RATES[param];
  if (group === "jumlah") return JUMLAH_PARTIAL_WIN_RATES[param];
  if (group === "shio") return SHIO_PARTIAL_WIN_RATES[param];
  return MATI_PARTIAL_WIN_RATES[param];
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

function scoreParams(rows: any[], params: number[], group: RecommendationGroup) {
  return params.map((param) => scoreParam(rows, param, group)).filter(Boolean) as ScoredRecommendation[];
}

function pickRecommendationFromScores(scored: ScoredRecommendation[], prefer: "low" | "high") {
  if (!scored.length) return null;
  const selectedParam = prefer === "low" ? Math.min(...scored.map((item) => item.param)) : Math.max(...scored.map((item) => item.param));
  return scored.find((item) => item.param === selectedParam) || null;
}

function setBadge(next: RecommendedMap, key: string, badge: RecommendationBadge) {
  if (badge === "fire" || next[key] !== "fire") next[key] = badge;
}

function applyRecommendationBadges(
  next: RecommendedMap,
  keyForParam: (param: number) => string,
  rows: any[],
  params: number[],
  prefer: "low" | "high",
  group: RecommendationGroup
) {
  const scored = scoreParams(rows, params, group);
  const pick = pickRecommendationFromScores(scored, prefer);
  if (pick) setBadge(next, keyForParam(pick.param), pick.badge);
  scored.filter((item) => item.badge === "fire").forEach((item) => setBadge(next, keyForParam(item.param), "fire"));
}

async function loadRows(marketId: string, mode: string, position: string, params: number[], targetPair: TargetPair = "belakang", analysisScope = "default") {
  const { data, error } = await supabase
    .from("analysis_evaluations")
    .select("param,is_hit,status,evaluated_at,target_pair,analysis_scope")
    .eq("market_id", marketId)
    .eq("mode", mode)
    .eq("position", position)
    .eq("target_pair", targetPair)
    .eq("analysis_scope", analysisScope)
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
  customAiParityByPair,
  setCustomAiParityForPair,
  customAiSizeByPair,
  setCustomAiSizeForPair,
  customAi3dDigit,
  setCustomAi3dDigit,
  customAi3dParity,
  setCustomAi3dParity,
  customAi3dSize,
  setCustomAi3dSize,
  customAi4dDigit,
  setCustomAi4dDigit,
  customBBFSDigit,
  setCustomBBFSDigit,
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
  customAiParityByPair: PairBoolMap;
  setCustomAiParityForPair: (pair: TargetPair, value: boolean) => void;
  customAiSizeByPair: PairBoolMap;
  setCustomAiSizeForPair: (pair: TargetPair, value: boolean) => void;
  customAi3dDigit: Ai3DDigit | null;
  setCustomAi3dDigit: (value: Ai3DDigit | null) => void;
  customAi3dParity: boolean;
  setCustomAi3dParity: (value: boolean) => void;
  customAi3dSize: boolean;
  setCustomAi3dSize: (value: boolean) => void;
  customAi4dDigit: Ai4DDigit | null;
  setCustomAi4dDigit: (value: Ai4DDigit | null) => void;
  customBBFSDigit: BBFSDigit | null;
  setCustomBBFSDigit: (value: BBFSDigit | null) => void;
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
        const bbfsScope = customFocusToBBFSScope(customFocus);
        const next: RecommendedMap = {};

        await Promise.all(
          pairs.map(async (pair) => {
            const [aiRows, aiParityRows, aiSizeRows, jumlahRows, shioRows] = await Promise.all([
              loadRows(marketId, "ai", "all", [2, 4, 6], pair),
              loadRows(marketId, "ai_parity", "all", [1], pair),
              loadRows(marketId, "ai_size", "all", [1], pair),
              loadRows(marketId, "jumlah", "all", [1, 2, 3], pair),
              loadRows(marketId, "shio", "all", [1, 2, 3], pair),
            ]);

            applyRecommendationBadges(next, (param) => `ai-${pair}-${param}`, aiRows, [2, 4, 6], "low", "ai");
            applyRecommendationBadges(next, () => `ai-${pair}-7`, aiParityRows, [1], "low", "ai_parity");
            applyRecommendationBadges(next, () => `ai-${pair}-8`, aiSizeRows, [1], "low", "ai_size");
            applyRecommendationBadges(next, (param) => `jumlah-${pair}-${param}`, jumlahRows, [1, 2, 3], "high", "jumlah");
            applyRecommendationBadges(next, (param) => `shio-${pair}-${param}`, shioRows, [1, 2, 3], "high", "shio");
          })
        );

        if (customFocus === "3d" || customFocus === "4d") {
          const [ai3dRows, ai3dParityRows, ai3dSizeRows] = await Promise.all([
            loadRows(marketId, "ai", "all", [1, 3, 5], "belakang", "3d"),
            loadRows(marketId, "ai_parity", "all", [1], "belakang", "3d"),
            loadRows(marketId, "ai_size", "all", [1], "belakang", "3d"),
          ]);
          applyRecommendationBadges(next, (param) => `ai3d-${param}`, ai3dRows, [1, 3, 5], "low", "ai");
          applyRecommendationBadges(next, () => "ai3d-7", ai3dParityRows, [1], "low", "ai_parity");
          applyRecommendationBadges(next, () => "ai3d-8", ai3dSizeRows, [1], "low", "ai_size");
        }

        if (customFocus === "4d") {
          const ai4dRows = await loadRows(marketId, "ai", "all", [1, 2, 4], "belakang", "4d");
          applyRecommendationBadges(next, (param) => `ai4d-${param}`, ai4dRows, [1, 2, 4], "low", "ai");
        }

        const bbfsRows = await loadRows(
          marketId,
          "bbfs",
          "all",
          [7, 8, 9],
          bbfsScope.includes("2d_") ? bbfsScope === "2d_depan" ? "depan" : bbfsScope === "2d_tengah" ? "tengah" : "belakang" : "belakang",
          bbfsScope
        );

        applyRecommendationBadges(next, (param) => `bbfs-${param}`, bbfsRows, [7, 8, 9], "low", "bbfs");

        const [asRows, kopRows, kepalaRows, ekorRows] = await Promise.all([
          loadRows(marketId, "mati", "as", [1, 2, 3]),
          loadRows(marketId, "mati", "kop", [1, 2, 3]),
          loadRows(marketId, "mati", "kepala", [1, 2, 3]),
          loadRows(marketId, "mati", "ekor", [1, 2, 3]),
        ]);

        applyRecommendationBadges(next, (param) => `as-${param}`, asRows, [1, 2, 3], "high", "mati");
        applyRecommendationBadges(next, (param) => `kop-${param}`, kopRows, [1, 2, 3], "high", "mati");
        applyRecommendationBadges(next, (param) => `kepala-${param}`, kepalaRows, [1, 2, 3], "high", "mati");
        applyRecommendationBadges(next, (param) => `ekor-${param}`, ekorRows, [1, 2, 3], "high", "mati");

        if (active) setRecommended(next);
      } catch {
        if (active) setRecommended({});
      }
    };

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [show, marketId, customFocus]);

  const badges = useMemo(() => recommended, [recommended]);
  const visiblePositions = customFocusPositions(customFocus);
  const visiblePairs = customFocusPairs(customFocus);
  const bbfsScope = customFocusToBBFSScope(customFocus);
  const showAi3d = customFocus === "3d" || customFocus === "4d";
  const showAi4d = customFocus === "4d";

  const positionValues: Record<PositionKey, number | null> = {
    as: customOffAsCount,
    kop: customOffKopCount,
    kepala: customOffKepalaCount,
    ekor: customOffEkorCount,
  };

  const positionSetters: Record<PositionKey, (value: number | null) => void> = {
    as: setCustomOffAsCount,
    kop: setCustomOffKopCount,
    kepala: setCustomOffKepalaCount,
    ekor: setCustomOffEkorCount,
  };

  if (!show) return null;

  const optionButton = (active: boolean, label: string, onClick: () => void, extraClass = "", recommendKey?: string) => {
    const badge = recommendKey ? badges[recommendKey] : undefined;
    const isRecommended = Boolean(badge);

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${extraClass} ui-motion-soft ui-tap ui-lift relative rounded-3xl border p-4 text-center`}
        style={{
          borderColor: active ? meta.accent : isRecommended ? `${meta.accent}88` : "rgba(255,255,255,0.14)",
          backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)",
          color: active ? meta.accent : "var(--ui-text-muted)",
        }}
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

      {showAi3d && (
        <section className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>AI 3D · KOP - KEPALA - EKOR</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 5].map((n) => optionButton(customAi3dDigit === n, String(n), () => setCustomAi3dDigit(customAi3dDigit === n ? null : (n as Ai3DDigit)), "", `ai3d-${n}`))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {optionButton(customAi3dParity, "GENAP GANJIL", () => setCustomAi3dParity(!customAi3dParity), "", "ai3d-7")}
            {optionButton(customAi3dSize, "BESAR KECIL", () => setCustomAi3dSize(!customAi3dSize), "", "ai3d-8")}
          </div>
        </section>
      )}

      {showAi4d && (
        <section className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>AI 4D · AS - KOP - KEPALA - EKOR</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 4].map((n) => optionButton(customAi4dDigit === n, String(n), () => setCustomAi4dDigit(customAi4dDigit === n ? null : (n as Ai4DDigit)), "", `ai4d-${n}`))}
          </div>
        </section>
      )}

      {visiblePairs.map((pair) => (
        <section key={`ai-${pair}`} className="ui-card space-y-2 rounded-3xl p-3">
          <MiniLabel>AI {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
          <div className="grid grid-cols-3 gap-2">
            {[2, 4, 6].map((n) => optionButton(customAiDigitByPair[pair] === n, String(n), () => setCustomAiDigitForPair(pair, customAiDigitByPair[pair] === n ? null : (n as 2 | 4 | 6)), "", `ai-${pair}-${n}`))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {optionButton(Boolean(customAiParityByPair[pair]), "GENAP GANJIL", () => setCustomAiParityForPair(pair, !customAiParityByPair[pair]), "", `ai-${pair}-7`)}
            {optionButton(Boolean(customAiSizeByPair[pair]), "BESAR KECIL", () => setCustomAiSizeForPair(pair, !customAiSizeByPair[pair]), "", `ai-${pair}-8`)}
          </div>
        </section>
      ))}

      <section className="ui-card space-y-2 rounded-3xl p-3">
        <MiniLabel>BBFS {bbfsScope.toUpperCase().replaceAll("_", " ")}</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[7, 8, 9].map((n) => optionButton(customBBFSDigit === n, String(n), () => setCustomBBFSDigit(customBBFSDigit === n ? null : (n as BBFSDigit)), "", `bbfs-${n}`))}
        </div>
      </section>

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

      <button onClick={onGenerate} className="primary-button ui-motion-soft ui-tap flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px]">
        <RefreshCw size={18} /> Generate
      </button>
    </div>
  );
}

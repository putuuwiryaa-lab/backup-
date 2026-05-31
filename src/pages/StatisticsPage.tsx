import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const statAccent = "#34d399";
const statAccentSoft = "rgba(52,211,153,0.14)";
const statGold = "#f6c96b";
const MIN_WINS_15 = 13;
const MIN_WINS_LAST_5 = 3;
const MAX_LOSS_STREAK_ALLOWED = 2;
const MARKET_STAT_SELECT = "id,market_id,market_name,group_key,group_label,mode,param,position,target_pair,analysis_scope,wins_15,wins_last_5,max_loss_streak,sample_size,score,previous_rank,rank_movement,latest_is_hit,latest_status,updated_at";

type CategoryKey = "ai" | "bbfs" | "off_digit" | "off_jumlah" | "off_shio";
type TargetPair = "depan" | "tengah" | "belakang";
type AnalysisScope = "4d" | "3d" | "2d_depan" | "2d_tengah" | "2d_belakang";

type MarketStatistic = {
  id?: string;
  market_id: string;
  market_name?: string;
  group_key: CategoryKey;
  group_label?: string;
  mode: string;
  param: number;
  position?: string;
  target_pair?: string;
  analysis_scope?: string;
  wins_15: number;
  wins_last_5: number;
  max_loss_streak: number;
  sample_size?: number;
  score?: number;
  previous_rank?: number | null;
  rank_movement?: number | null;
  latest_is_hit?: boolean | null;
  latest_status?: string | null;
  updated_at?: string;
};

type RelatedStatsMap = Record<string, MarketStatistic[]>;
type PositionPairMeta = { label: string; subtitle: string };

const categories: Array<{ key: CategoryKey; title: string }> = [
  { key: "ai", title: "AI" },
  { key: "bbfs", title: "BBFS" },
  { key: "off_digit", title: "Posisi" },
  { key: "off_jumlah", title: "Jumlah" },
  { key: "off_shio", title: "Shio" },
];

const targetPairs: Array<{ key: TargetPair; label: string }> = [
  { key: "depan", label: "Depan" },
  { key: "tengah", label: "Tengah" },
  { key: "belakang", label: "Belakang" },
];

const bbfsScopes: Array<{ key: AnalysisScope; label: string; subtitle: string; targetPair: TargetPair }> = [
  { key: "4d", label: "4D", subtitle: "AS + KOP + Kepala + Ekor", targetPair: "belakang" },
  { key: "3d", label: "3D", subtitle: "KOP + Kepala + Ekor", targetPair: "belakang" },
  { key: "2d_depan", label: "2D Depan", subtitle: "AS + KOP", targetPair: "depan" },
  { key: "2d_tengah", label: "2D Tengah", subtitle: "KOP + Kepala", targetPair: "tengah" },
  { key: "2d_belakang", label: "2D Belakang", subtitle: "Kepala + Ekor", targetPair: "belakang" },
];

const positionPairs: Record<TargetPair, PositionPairMeta> = {
  depan: { label: "Depan", subtitle: "AS + KOP" },
  tengah: { label: "Tengah", subtitle: "KOP + Kepala" },
  belakang: { label: "Belakang", subtitle: "Kepala + Ekor" },
};

function formatUpdatedAt(value?: string) {
  if (!value) return "Belum ada update";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum ada update";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function targetPairLabel(value?: string) {
  if (value === "depan") return "Depan";
  if (value === "tengah") return "Tengah";
  if (value === "belakang") return "Belakang";
  return "Semua";
}

function bbfsScopeMeta(value?: string) {
  return bbfsScopes.find((item) => item.key === value) || bbfsScopes[4];
}

function bbfsScopeLabel(value?: string) {
  return bbfsScopeMeta(value).label;
}

function bbfsScopeSubtitle(value?: string) {
  return bbfsScopeMeta(value).subtitle;
}

function positionPairSubtitle(value?: string) {
  if (value === "depan" || value === "tengah" || value === "belakang") return positionPairs[value].subtitle;
  return "AS + KOP";
}

function statTitle(item: MarketStatistic) {
  if (item.group_key === "ai") return `AI ${targetPairLabel(item.target_pair)} ${item.param}D`;
  if (item.group_key === "bbfs") return `BBFS ${bbfsScopeLabel(item.analysis_scope)} ${item.param}`;
  if (item.group_key === "off_digit") return `2D ${targetPairLabel(item.target_pair)} · OFF ${item.param}`;
  if (item.group_key === "off_jumlah") return `OFF Jumlah ${targetPairLabel(item.target_pair)} ${item.param}`;
  if (item.group_key === "off_shio") return `OFF Shio ${targetPairLabel(item.target_pair)} ${item.param}`;
  return item.group_label || "Statistik";
}

function shortStatTitle(item: MarketStatistic) {
  if (item.group_key === "ai") return `AI ${item.param}D ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "bbfs") return `BBFS ${bbfsScopeLabel(item.analysis_scope)} ${item.param}`;
  if (item.group_key === "off_digit") return `2D ${targetPairLabel(item.target_pair)} OFF ${item.param}`;
  if (item.group_key === "off_jumlah") return `Jumlah ${item.param} ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "off_shio") return `Shio ${item.param} ${targetPairLabel(item.target_pair)}`;
  return item.group_label || "Statistik";
}

function statIdentity(item: MarketStatistic) {
  return [item.market_id, item.group_key, item.mode, item.param, item.position || "all", item.target_pair || "all", item.analysis_scope || "default"].join("|");
}

function relatedGroupKey(item: MarketStatistic) {
  if (item.group_key === "bbfs") return `${item.group_key}|${item.analysis_scope || "default"}`;
  if (item.group_key === "ai" || item.group_key === "off_jumlah" || item.group_key === "off_shio") return `${item.group_key}|${item.target_pair || "all"}`;
  if (item.group_key === "off_digit") return `${item.group_key}|${item.target_pair || "all"}`;
  return item.group_key;
}

function strictnessValue(item: MarketStatistic) {
  if (item.group_key === "ai" || item.group_key === "bbfs") return -Number(item.param || 99);
  if (item.group_key === "off_digit" || item.group_key === "off_jumlah" || item.group_key === "off_shio") return Number(item.param || 0);
  return 0;
}

function preferredRelated(a: MarketStatistic, b: MarketStatistic) {
  const strictA = strictnessValue(a);
  const strictB = strictnessValue(b);
  if (strictA !== strictB) return strictA > strictB ? a : b;
  const scoreA = Number(a.score || 0);
  const scoreB = Number(b.score || 0);
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b;
  return Number(a.wins_last_5 || 0) >= Number(b.wins_last_5 || 0) ? a : b;
}

function relatedLabels(item: MarketStatistic, relatedStats: RelatedStatsMap) {
  const currentIdentity = statIdentity(item);
  const currentGroup = relatedGroupKey(item);
  const bestByGroup = new Map<string, MarketStatistic>();
  for (const related of relatedStats[item.market_id] || []) {
    if (statIdentity(related) === currentIdentity) continue;
    const groupKey = relatedGroupKey(related);
    if (groupKey === currentGroup) continue;
    const existing = bestByGroup.get(groupKey);
    bestByGroup.set(groupKey, existing ? preferredRelated(existing, related) : related);
  }
  return Array.from(bestByGroup.values()).sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 3).map(shortStatTitle);
}

function badgeLabel(item: MarketStatistic) {
  if (item.wins_15 >= 14) return "Unggulan";
  if (item.wins_15 >= MIN_WINS_15) return "Stabil";
  if (item.wins_last_5 >= 5) return "Naik";
  return "Cek";
}

function marketUrl(item: MarketStatistic) {
  return `/analyze/${item.market_id}`;
}

function movementText(value?: number | null) {
  const movement = Number(value || 0);
  if (movement > 0) return `▲${movement}`;
  if (movement < 0) return `▼${Math.abs(movement)}`;
  if (value === 0) return "●";
  return "";
}

function movementTone(item: MarketStatistic) {
  const movement = Number(item.rank_movement || 0);
  if (movement > 0) return { text: "#03120d", bg: "#4ade80", border: "#bbf7d0", shadow: "0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 20px rgba(74,222,128,0.55)" };
  if (movement < 0) {
    const latestZonk = item.latest_is_hit === false || item.latest_status === "ZONK" || item.latest_status === "TIDAK MASUK";
    if (latestZonk) return { text: "#190407", bg: "#fb7185", border: "#fecdd3", shadow: "0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 20px rgba(251,113,133,0.58)" };
    return { text: "#171002", bg: "#facc15", border: "#fef08a", shadow: "0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 20px rgba(250,204,21,0.55)" };
  }
  return { text: "#d1d5db", bg: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.24)", shadow: "0 0 12px rgba(255,255,255,0.08)" };
}

function SectionLabel({ title, right }: { title: string; right?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 px-1">
      <span className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: statAccent }}>{title}</span>
      <span className="h-px flex-1 bg-white/10" />
      {right && <span className="max-w-[48%] truncate text-[9px] font-black uppercase tracking-[1.2px] text-[var(--text-dim)]">{right}</span>}
    </div>
  );
}

function Panel({ children, className = "" }: { children: any; className?: string }) {
  return <div className={`rounded-[1.65rem] border border-white/[0.12] bg-[rgba(8,12,18,0.78)] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl ${className}`}>{children}</div>;
}

export default function StatisticsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryKey>("ai");
  const [targetPair, setTargetPair] = useState<TargetPair>("belakang");
  const [bbfsScope, setBbfsScope] = useState<AnalysisScope>("2d_belakang");
  const [param, setParam] = useState<number>(4);
  const [items, setItems] = useState<MarketStatistic[]>([]);
  const [relatedStats, setRelatedStats] = useState<RelatedStatsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryMeta = categories.find((item) => item.key === category) || categories[0];
  const isPositionCategory = category === "off_digit";
  const isBBFSCategory = category === "bbfs";
  const isPairCategory = category === "ai" || category === "off_digit" || category === "off_jumlah" || category === "off_shio";
  const selectedBBFS = bbfsScopeMeta(bbfsScope);
  const effectiveTargetPair = isBBFSCategory ? selectedBBFS.targetPair : targetPair;
  const paramOptions = category === "ai" ? [2, 4, 6] : category === "bbfs" ? [7, 8, 9] : [1, 2, 3];
  const currentFilterLabel = isBBFSCategory ? `${categoryMeta.title} ${selectedBBFS.label} ${param}` : isPositionCategory ? `2D ${targetPairLabel(targetPair)} OFF ${param}` : `${categoryMeta.title} ${targetPairLabel(targetPair)} ${category === "ai" ? `${param}D` : `OFF ${param}`}`;

  const loadStatistics = async () => {
    setLoading(true);
    setError("");
    try {
      let query = supabase.from("market_statistics").select(MARKET_STAT_SELECT).eq("is_active", true).eq("group_key", category).gte("wins_15", MIN_WINS_15).gte("wins_last_5", MIN_WINS_LAST_5).lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED).order("score", { ascending: false }).order("updated_at", { ascending: false }).limit(200);
      if (isPositionCategory) query = query.eq("mode", "mati_2d").eq("param", param).eq("target_pair", targetPair).eq("analysis_scope", "default");
      else if (isBBFSCategory) query = query.eq("mode", "bbfs").eq("param", param).eq("target_pair", effectiveTargetPair).eq("analysis_scope", bbfsScope);
      else query = query.eq("param", param).eq("analysis_scope", "default");
      if (isPairCategory) query = query.eq("target_pair", targetPair);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      const rankingRows = (data || []) as MarketStatistic[];
      setItems(rankingRows);
      const marketIds = Array.from(new Set(rankingRows.map((item) => item.market_id).filter(Boolean)));
      if (!marketIds.length) {
        setRelatedStats({});
      } else {
        const { data: relatedData, error: relatedError } = await supabase.from("market_statistics").select(MARKET_STAT_SELECT).eq("is_active", true).in("market_id", marketIds).gte("wins_15", MIN_WINS_15).gte("wins_last_5", MIN_WINS_LAST_5).lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED).order("score", { ascending: false }).limit(1000);
        if (relatedError) throw relatedError;
        const cleanRelated = ((relatedData || []) as MarketStatistic[]).filter((row) => row.group_key !== "off_digit" || row.mode === "mati_2d");
        const mapped = cleanRelated.reduce<RelatedStatsMap>((acc, row) => {
          if (!acc[row.market_id]) acc[row.market_id] = [];
          acc[row.market_id].push(row);
          return acc;
        }, {});
        setRelatedStats(mapped);
      }
    } catch (e: any) {
      setItems([]);
      setRelatedStats({});
      setError(e.message || "Belum bisa memuat statistik.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (category === "ai" && ![2, 4, 6].includes(param)) setParam(4);
    if (category === "bbfs" && ![7, 8, 9].includes(param)) setParam(8);
    if (!["ai", "bbfs"].includes(category) && ![1, 2, 3].includes(param)) setParam(1);
  }, [category]);

  useEffect(() => { loadStatistics(); }, [category, targetPair, bbfsScope, param]);

  const topItems = useMemo(() => items.slice(0, 100), [items]);
  const latestUpdate = topItems[0]?.updated_at;

  return (
    <div className="statistics-page fixed inset-0 z-50 overflow-y-auto animate-[riseIn_0.35s_ease-out] px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6" style={{ color: "var(--text)", background: "radial-gradient(circle at 10% 0%, rgba(52,211,153,0.16), transparent 28%), radial-gradient(circle at 90% 18%, rgba(246,201,107,0.12), transparent 26%), radial-gradient(circle at 50% 80%, rgba(99,102,241,0.12), transparent 32%), linear-gradient(180deg,#03070a 0%,#06100e 46%,#030407 100%)" }}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)] shadow-lg active:scale-95">
          <ArrowLeft size={17} /> Beranda
        </button>

        <section>
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(8,18,18,0.96),rgba(13,11,22,0.96))] p-5 shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[2.2px]" style={{ color: statAccent }}>Statistik Pasaran</p>
                <h2 className="mt-2 font-['Orbitron'] text-[28px] font-black uppercase leading-tight tracking-[4px] text-[var(--text)]">Ranking</h2>
                <p className="mt-2 text-[11px] font-semibold uppercase leading-5 tracking-[1.2px] text-[var(--text-dim)]">{currentFilterLabel} · {topItems.length} pasaran</p>
              </div>
              <button onClick={loadStatistics} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] text-[var(--text-dim)] shadow-inner active:scale-95" aria-label="Refresh statistik">
                <RefreshCw size={19} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-300/12 bg-black/35 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Mode</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[12px] font-black uppercase tracking-[1.8px]" style={{ color: statAccent }}>{currentFilterLabel}</p>
              </div>
              <div className="rounded-2xl border border-amber-200/12 bg-black/35 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Update</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[11px] font-black uppercase tracking-[1.4px]" style={{ color: statGold }}>{formatUpdatedAt(latestUpdate)}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel title="Mode Statistik" />
          <Panel className="p-2">
            <div className="grid grid-cols-5 gap-1.5">
              {categories.map((item) => {
                const active = item.key === category;
                return <button key={item.key} type="button" onClick={() => setCategory(item.key)} className="min-h-[68px] rounded-[1.2rem] px-1 py-3 text-center transition active:scale-[0.985]" style={{ background: active ? "linear-gradient(135deg,rgba(52,211,153,0.25),rgba(246,201,107,0.10))" : "rgba(255,255,255,0.035)", border: active ? `1px solid ${statAccent}` : "1px solid rgba(255,255,255,0.075)", boxShadow: active ? "0 14px 30px rgba(52,211,153,0.14)" : "none" }}><span className="block font-['Orbitron'] text-[10px] font-black uppercase leading-tight tracking-[0.9px]" style={{ color: active ? statAccent : "var(--text)" }}>{item.title}</span></button>;
              })}
            </div>
          </Panel>
        </section>

        <section>
          <SectionLabel title="Filter Ranking" right={currentFilterLabel} />
          <Panel className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">{isBBFSCategory ? "Scope BBFS" : isPositionCategory ? "2D Posisi" : "Fokus"}</p>
              <span className="max-w-[62%] truncate rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[1px] text-black" style={{ background: statGold }}>{currentFilterLabel}</span>
            </div>

            {isBBFSCategory ? (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {bbfsScopes.map((item) => {
                    const active = bbfsScope === item.key;
                    return <button key={item.key} type="button" onClick={() => setBbfsScope(item.key)} className={`${item.key === "2d_belakang" ? "col-span-2" : ""} min-h-[54px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]`} style={{ background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)", color: active ? "#03120d" : "var(--text-dim)", border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)", boxShadow: active ? "0 12px 28px rgba(52,211,153,0.22)" : "none" }}>{item.label}</button>;
                  })}
                </div>
                <p className="rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">{selectedBBFS.subtitle}</p>
              </div>
            ) : (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {targetPairs.map((item) => {
                    const active = targetPair === item.key;
                    return <button key={item.key} type="button" onClick={() => setTargetPair(item.key)} className="min-h-[52px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]" style={{ background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)", color: active ? "#03120d" : "var(--text-dim)", border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)" }}>{item.label}</button>;
                  })}
                </div>
                {isPositionCategory && <p className="rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">{positionPairSubtitle(targetPair)}</p>}
              </div>
            )}

            <div className="rounded-[1.35rem] border border-amber-200/[0.10] bg-black/20 p-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">Parameter</p>
              <div className="grid grid-cols-3 gap-2">
                {paramOptions.map((value) => {
                  const active = param === value;
                  return <button key={value} type="button" onClick={() => setParam(value)} className="min-h-[54px] rounded-[1.05rem] px-2 py-3 text-[10px] font-black uppercase tracking-[1.2px] transition active:scale-[0.985]" style={{ background: active ? "linear-gradient(135deg,#f6c96b,#facc15)" : "rgba(255,255,255,0.045)", color: active ? "#120d02" : "var(--text-dim)", border: active ? "1px solid rgba(254,240,138,0.75)" : "1px solid rgba(255,255,255,0.075)", boxShadow: active ? "0 12px 28px rgba(246,201,107,0.18)" : "none" }}>{category === "ai" ? `${value}D` : String(value)}</button>;
                })}
              </div>
            </div>
          </Panel>
        </section>

        <section>
          <SectionLabel title="Hasil Ranking" right={`${topItems.length} pasaran`} />
          {loading ? (
            <Panel className="p-6 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: statAccent }} />
              <p className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Memuat Ranking</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--text-dim)]">Mengambil statistik pasaran terbaru.</p>
            </Panel>
          ) : topItems.length ? (
            <div className="grid gap-3">
              {topItems.map((item, index) => {
                const marketName = item.market_name || item.market_id;
                const topRank = index === 0;
                const alsoLabels = relatedLabels(item, relatedStats);
                const movement = movementText(item.rank_movement);
                const tone = movementTone(item);
                return (
                  <div key={item.id || `${item.market_id}-${item.group_key}-${item.param}-${item.position}-${item.target_pair}-${item.analysis_scope}`} className="rounded-[1.55rem] border p-3 text-left shadow-xl" style={{ borderColor: topRank ? "rgba(246,201,107,0.55)" : "rgba(255,255,255,0.11)", background: topRank ? "linear-gradient(135deg,rgba(246,201,107,0.16),rgba(52,211,153,0.08))" : "rgba(8,12,18,0.78)", backdropFilter: "blur(12px)" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex w-14 shrink-0 flex-col items-center gap-1.5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl font-['Orbitron'] text-[13px] font-black" style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}>#{index + 1}</div>{movement && <span className="mt-1 flex min-h-7 min-w-14 items-center justify-center rounded-xl border px-3 py-1.5 font-['Orbitron'] text-[12px] font-black leading-none tracking-[0.7px]" style={{ color: tone.text, backgroundColor: tone.bg, borderColor: tone.border, boxShadow: tone.shadow }}>{movement}</span>}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-['Orbitron'] text-[16px] font-black uppercase tracking-[2px] text-[var(--text)]">{marketName}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[1.2px]" style={{ color: statAccent }}>{statTitle(item)}</p>{item.group_key === "off_digit" && <p className="mt-1 text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">{positionPairSubtitle(item.target_pair)}</p>}{item.group_key === "bbfs" && <p className="mt-1 text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">{bbfsScopeSubtitle(item.analysis_scope)}</p>}</div><span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ color: statGold }}>{badgeLabel(item)}</span></div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-black/25 p-2"><p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Riwayat</p><p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statGold }}>{item.wins_15}/15</p></div><div className="rounded-xl bg-black/25 p-2"><p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Terbaru</p><p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statAccent }}>{item.wins_last_5}/5</p></div></div>
                        {alsoLabels.length > 0 && <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Juga unggul</p><p className="mt-1 text-[10px] font-black uppercase leading-4 tracking-[1px]" style={{ color: statAccent }}>{alsoLabels.join(" · ")}</p></div>}
                        <button type="button" onClick={() => navigate(marketUrl(item))} className="mt-3 w-full rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[1.4px] active:scale-[0.985]" style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}>Buka Pasaran</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Panel className="p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[var(--text-dim)]"><BarChart3 /></div>
              <p className="font-['Orbitron'] text-[14px] font-black uppercase tracking-[2px] text-[var(--text)]">Belum ada ranking</p>
              <p className="mx-auto mt-3 max-w-sm text-[12px] leading-5 text-[var(--text-dim)]">{error ? "Statistik belum bisa dimuat. Pastikan evaluator statistik sudah berjalan." : `Belum ada pasaran yang masuk kriteria ${currentFilterLabel}.`}</p>
              <button onClick={loadStatistics} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[1.5px] text-[var(--text)] active:scale-[0.985]">Muat Ulang</button>
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}

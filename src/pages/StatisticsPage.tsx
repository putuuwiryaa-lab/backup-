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

type CategoryKey = "ai" | "bbfs" | "off_digit" | "off_jumlah" | "off_shio";
type TargetPair = "depan" | "tengah" | "belakang";

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
  wins_15: number;
  wins_last_5: number;
  max_loss_streak: number;
  sample_size?: number;
  score?: number;
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

function positionPairSubtitle(value?: string) {
  if (value === "depan" || value === "tengah" || value === "belakang") return positionPairs[value].subtitle;
  return "AS + KOP";
}

function statTitle(item: MarketStatistic) {
  if (item.group_key === "ai") return `AI ${targetPairLabel(item.target_pair)} ${item.param}D`;
  if (item.group_key === "bbfs") return `BBFS ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "off_digit") return `2D ${targetPairLabel(item.target_pair)} · OFF ${item.param}`;
  if (item.group_key === "off_jumlah") return `OFF Jumlah ${targetPairLabel(item.target_pair)} ${item.param}`;
  if (item.group_key === "off_shio") return `OFF Shio ${targetPairLabel(item.target_pair)} ${item.param}`;
  return item.group_label || "Statistik";
}

function shortStatTitle(item: MarketStatistic) {
  if (item.group_key === "ai") return `AI ${item.param}D ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "bbfs") return `BBFS ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "off_digit") return `2D ${targetPairLabel(item.target_pair)} OFF ${item.param}`;
  if (item.group_key === "off_jumlah") return `Jumlah ${item.param} ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "off_shio") return `Shio ${item.param} ${targetPairLabel(item.target_pair)}`;
  return item.group_label || "Statistik";
}

function statIdentity(item: MarketStatistic) {
  return [item.market_id, item.group_key, item.mode, item.param, item.position || "all", item.target_pair || "all"].join("|");
}

function relatedGroupKey(item: MarketStatistic) {
  if (item.group_key === "ai" || item.group_key === "bbfs" || item.group_key === "off_jumlah" || item.group_key === "off_shio") {
    return `${item.group_key}|${item.target_pair || "all"}`;
  }
  if (item.group_key === "off_digit") return `${item.group_key}|${item.target_pair || "all"}`;
  return item.group_key;
}

function strictnessValue(item: MarketStatistic) {
  if (item.group_key === "ai") return -Number(item.param || 99);
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

  return Array.from(bestByGroup.values())
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 3)
    .map(shortStatTitle);
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

function SectionLabel({ title, right }: { title: string; right?: string }) {
  return (
    <div className="mb-2 flex items-center gap-3 px-1">
      <span className="text-[9px] font-black uppercase tracking-[1.8px]" style={{ color: statAccent }}>{title}</span>
      <span className="h-px flex-1 bg-white/10" />
      {right && <span className="text-[9px] font-black uppercase tracking-[1.2px] text-[var(--text-dim)]">{right}</span>}
    </div>
  );
}

export default function StatisticsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryKey>("ai");
  const [targetPair, setTargetPair] = useState<TargetPair>("belakang");
  const [param, setParam] = useState<number>(4);
  const [items, setItems] = useState<MarketStatistic[]>([]);
  const [relatedStats, setRelatedStats] = useState<RelatedStatsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryMeta = categories.find((item) => item.key === category) || categories[0];
  const isPositionCategory = category === "off_digit";
  const isPairCategory = category === "ai" || category === "bbfs" || category === "off_digit" || category === "off_jumlah" || category === "off_shio";
  const paramOptions = category === "ai" ? [2, 4, 6] : category === "bbfs" ? [8] : [1, 2, 3];
  const currentFilterLabel = category === "bbfs"
    ? `${categoryMeta.title} ${targetPairLabel(targetPair)}`
    : isPositionCategory
      ? `2D ${targetPairLabel(targetPair)} OFF ${param}`
      : `${categoryMeta.title} ${targetPairLabel(targetPair)} ${category === "ai" ? `${param}D` : `OFF ${param}`}`;

  const loadStatistics = async () => {
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("market_statistics")
        .select("id,market_id,market_name,group_key,group_label,mode,param,position,target_pair,wins_15,wins_last_5,max_loss_streak,sample_size,score,updated_at")
        .eq("is_active", true)
        .eq("group_key", category)
        .gte("wins_15", MIN_WINS_15)
        .gte("wins_last_5", MIN_WINS_LAST_5)
        .lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(200);

      if (isPositionCategory) query = query.eq("mode", "mati_2d").eq("param", param).eq("target_pair", targetPair);
      else if (category === "bbfs") query = query.eq("param", 8);
      else query = query.eq("param", param);
      if (!isPositionCategory && isPairCategory) query = query.eq("target_pair", targetPair);

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      const rankingRows = (data || []) as MarketStatistic[];
      setItems(rankingRows);

      const marketIds = Array.from(new Set(rankingRows.map((item) => item.market_id).filter(Boolean)));
      if (!marketIds.length) {
        setRelatedStats({});
      } else {
        const { data: relatedData, error: relatedError } = await supabase
          .from("market_statistics")
          .select("id,market_id,market_name,group_key,group_label,mode,param,position,target_pair,wins_15,wins_last_5,max_loss_streak,sample_size,score,updated_at")
          .eq("is_active", true)
          .in("market_id", marketIds)
          .gte("wins_15", MIN_WINS_15)
          .gte("wins_last_5", MIN_WINS_LAST_5)
          .lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED)
          .order("score", { ascending: false })
          .limit(1000);
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
    if (category === "bbfs" && param !== 8) setParam(8);
    if (!["ai", "bbfs"].includes(category) && ![1, 2, 3].includes(param)) setParam(1);
  }, [category]);

  useEffect(() => { loadStatistics(); }, [category, targetPair, param]);

  const topItems = useMemo(() => items.slice(0, 100), [items]);
  const latestUpdate = topItems[0]?.updated_at;

  return (
    <div
      className="statistics-page fixed inset-0 z-50 overflow-y-auto animate-[riseIn_0.35s_ease-out] px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6"
      style={{
        color: "var(--text)",
        background: "radial-gradient(circle at 12% 8%, rgba(52,211,153,0.16), transparent 34%), radial-gradient(circle at 88% 18%, rgba(246,201,107,0.10), transparent 30%), linear-gradient(180deg, #061512 0%, #09110f 42%, #050708 100%)"
      }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
          <ArrowLeft size={17} /> Beranda
        </button>

        <section className="mb-5">
          <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,26,24,0.92),rgba(22,16,34,0.70))] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: statAccent }}>Statistik Pasaran</p>
                <h2 className="mt-2 font-['Orbitron'] text-[25px] font-black uppercase leading-tight tracking-[3px] text-[var(--text)]">Ranking</h2>
                <p className="mt-2 text-[11px] font-semibold uppercase leading-5 tracking-[1.2px] text-[var(--text-dim)]">{currentFilterLabel} · {topItems.length} pasaran</p>
              </div>
              <button onClick={loadStatistics} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[var(--text-dim)] active:scale-95" aria-label="Refresh statistik">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Mode</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[12px] font-black uppercase tracking-[1.8px]" style={{ color: statAccent }}>{currentFilterLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Update</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[11px] font-black uppercase tracking-[1.4px]" style={{ color: statGold }}>{formatUpdatedAt(latestUpdate)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionLabel title="Mode Statistik" />
          <div className="rounded-[1.45rem] border border-emerald-300/15 bg-[rgba(5,18,16,0.52)] p-2 shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
            <div className="grid grid-cols-5 gap-1.5">
              {categories.map((item) => {
                const active = item.key === category;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className="min-h-[72px] rounded-[1.15rem] px-1 py-3 text-center active:scale-[0.985]"
                    style={{ background: active ? statAccentSoft : "rgba(0,0,0,0.28)", border: active ? `1px solid ${statAccent}` : "1px solid rgba(255,255,255,0.07)", boxShadow: active ? "0 0 0 1px rgba(52,211,153,0.14), 0 12px 28px rgba(52,211,153,0.10)" : "none" }}
                  >
                    <span className="block font-['Orbitron'] text-[11px] font-black uppercase leading-tight tracking-[0.8px]" style={{ color: active ? statAccent : "var(--text)" }}>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionLabel title="Filter Ranking" right={currentFilterLabel} />
          <div className="rounded-[1.45rem] border border-amber-200/15 bg-[rgba(18,14,7,0.40)] p-3 shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[1.6px] text-[var(--text-dim)]">{isPositionCategory ? "2D Posisi" : "Fokus"}</p>
              <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px] text-black" style={{ background: statGold }}>{currentFilterLabel}</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {targetPairs.map((item) => {
                  const active = targetPair === item.key;
                  return <button key={item.key} type="button" onClick={() => setTargetPair(item.key)} className="rounded-[1rem] px-2 py-3.5 text-[9px] font-black uppercase tracking-[1px] active:scale-[0.985]" style={{ background: active ? statAccent : "rgba(0,0,0,0.30)", color: active ? "#04110d" : "var(--text-dim)", border: active ? "1px solid rgba(52,211,153,0.65)" : "1px solid rgba(255,255,255,0.05)" }}>{item.label}</button>;
                })}
              </div>

              {isPositionCategory && <p className="rounded-xl bg-black/20 px-3 py-2 text-center text-[9px] font-black uppercase tracking-[1.2px] text-[var(--text-dim)]">{positionPairSubtitle(targetPair)}</p>}

              {category !== "bbfs" && (
                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-2">
                  {paramOptions.map((value) => {
                    const active = param === value;
                    return <button key={value} type="button" onClick={() => setParam(value)} className="rounded-[1rem] px-2 py-3.5 text-[9px] font-black uppercase tracking-[1px] active:scale-[0.985]" style={{ background: active ? statGold : "rgba(0,0,0,0.30)", color: active ? "#120d02" : "var(--text-dim)", border: active ? "1px solid rgba(246,201,107,0.7)" : "1px solid rgba(255,255,255,0.05)" }}>{category === "ai" ? `${value}D` : `OFF ${value}`}</button>;
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <SectionLabel title="Hasil Ranking" right={`${topItems.length} pasaran`} />
          {loading ? (
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-6 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: statAccent }} />
              <p className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Memuat Ranking</p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--text-dim)]">Mengambil statistik pasaran terbaru.</p>
            </div>
          ) : topItems.length ? (
            <div className="grid gap-3">
              {topItems.map((item, index) => {
                const marketName = item.market_name || item.market_id;
                const topRank = index === 0;
                const alsoLabels = relatedLabels(item, relatedStats);
                return (
                  <div key={item.id || `${item.market_id}-${item.group_key}-${item.param}-${item.position}-${item.target_pair}`} className="rounded-[1.45rem] border p-3 text-left shadow-xl" style={{ borderColor: topRank ? "rgba(246,201,107,0.55)" : "rgba(255,255,255,0.11)", background: topRank ? "linear-gradient(135deg,rgba(246,201,107,0.14),rgba(52,211,153,0.08))" : "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-['Orbitron'] text-[13px] font-black" style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}>#{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-['Orbitron'] text-[16px] font-black uppercase tracking-[2px] text-[var(--text)]">{marketName}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[1.2px]" style={{ color: statAccent }}>{statTitle(item)}</p>
                            {item.group_key === "off_digit" && <p className="mt-1 text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">{positionPairSubtitle(item.target_pair)}</p>}
                          </div>
                          <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ color: statGold }}>{badgeLabel(item)}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-xl bg-black/22 p-2"><p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Riwayat</p><p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statGold }}>{item.wins_15}/15</p></div>
                          <div className="rounded-xl bg-black/22 p-2"><p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Terbaru</p><p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statAccent }}>{item.wins_last_5}/5</p></div>
                        </div>
                        {alsoLabels.length > 0 && (
                          <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2">
                            <p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Juga unggul</p>
                            <p className="mt-1 text-[10px] font-black uppercase leading-4 tracking-[1px]" style={{ color: statAccent }}>{alsoLabels.join(" · ")}</p>
                          </div>
                        )}
                        <button type="button" onClick={() => navigate(marketUrl(item))} className="mt-3 w-full rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[1.4px] active:scale-[0.985]" style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}>Buka Pasaran</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[var(--text-dim)]"><BarChart3 /></div>
              <p className="font-['Orbitron'] text-[14px] font-black uppercase tracking-[2px] text-[var(--text)]">Belum ada ranking</p>
              <p className="mx-auto mt-3 max-w-sm text-[12px] leading-5 text-[var(--text-dim)]">{error ? "Statistik belum bisa dimuat. Pastikan evaluator statistik sudah berjalan." : `Belum ada pasaran yang masuk kriteria ${currentFilterLabel}.`}</p>
              <button onClick={loadStatistics} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[1.5px] text-[var(--text)] active:scale-[0.985]">Muat Ulang</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

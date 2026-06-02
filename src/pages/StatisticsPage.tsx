import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import StatisticCard from "../components/statistics/StatisticCard";
import {
  MARKET_STAT_SELECT,
  MAX_LOSS_STREAK_ALLOWED,
  MIN_WINS_15,
  MIN_WINS_LAST_5,
  type AiStatScope,
  type AnalysisScope,
  type MarketStatistic,
  type RelatedStatsMap,
  type TargetPair,
  type VisibleCategoryKey,
  aiParamGroupKey,
  aiParamLabel,
  aiParamStatParam,
  aiScopeMeta,
  aiScopeSubtitle,
  aiScopes,
  bbfsScopeMeta,
  bbfsScopes,
  categories,
  formatUpdatedAt,
  positionPairSubtitle,
  statAccent,
  statGold,
  targetPairLabel,
  targetPairs,
} from "../lib/statistics/statisticsPageUtils";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function SectionLabel({ title, right }: { title: string; right?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 px-1">
      <span className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: statAccent }}>
        {title}
      </span>
      <span className="h-px flex-1 bg-white/10" />
      {right && (
        <span className="max-w-[48%] truncate text-[9px] font-black uppercase tracking-[1.2px] text-[var(--text-dim)]">
          {right}
        </span>
      )}
    </div>
  );
}

function Panel({ children, className = "" }: { children: any; className?: string }) {
  return (
    <div className={`rounded-[1.65rem] border border-white/[0.12] bg-[rgba(8,12,18,0.78)] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function aiParamOptions(scope: AiStatScope) {
  if (scope === "3d") return [1, 3, 5, 7, 8];
  if (scope === "4d") return [1, 2, 4];
  return [2, 4, 6, 7, 8];
}

export default function StatisticsPage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState<VisibleCategoryKey>("ai");
  const [targetPair, setTargetPair] = useState<TargetPair>("belakang");
  const [aiScope, setAiScope] = useState<AiStatScope>("default");
  const [bbfsScope, setBbfsScope] = useState<AnalysisScope>("2d_belakang");
  const [param, setParam] = useState<number>(4);
  const [items, setItems] = useState<MarketStatistic[]>([]);
  const [relatedStats, setRelatedStats] = useState<RelatedStatsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryMeta = categories.find((item) => item.key === category) || categories[0];

  const isPositionCategory = category === "off_digit";
  const isBBFSCategory = category === "bbfs";
  const isAICategory = category === "ai";
  const isPairCategory = (category === "ai" && aiScope === "default") || category === "off_digit" || category === "off_jumlah" || category === "off_shio";

  const selectedBBFS = bbfsScopeMeta(bbfsScope);
  const selectedAI = aiScopeMeta(aiScope);
  const effectiveTargetPair = isBBFSCategory ? selectedBBFS.targetPair : targetPair;

  const queryGroupKey = category === "ai" ? aiParamGroupKey(param) : category;
  const queryParam = category === "ai" ? aiParamStatParam(param) : param;

  const paramOptions = category === "ai" ? aiParamOptions(aiScope) : category === "bbfs" ? [7, 8, 9] : [1, 2, 3];

  const currentFilterLabel = isBBFSCategory
    ? `${categoryMeta.title} ${selectedBBFS.label} ${param}`
    : isAICategory
      ? `${selectedAI.label} ${aiScope === "default" ? targetPairLabel(targetPair) : ""} ${aiParamLabel(param)}`.replace(/\s+/g, " ").trim()
      : isPositionCategory
        ? `2D ${targetPairLabel(targetPair)} OFF ${param}`
        : `${categoryMeta.title} ${targetPairLabel(targetPair)} ${`OFF ${param}`}`;

  const loadStatistics = async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase
        .from("market_statistics")
        .select(MARKET_STAT_SELECT)
        .eq("is_active", true)
        .eq("group_key", queryGroupKey)
        .gte("wins_15", MIN_WINS_15)
        .gte("wins_last_5", MIN_WINS_LAST_5)
        .lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(200);

      if (isPositionCategory) {
        query = query
          .eq("mode", "mati_2d")
          .eq("param", queryParam)
          .eq("target_pair", targetPair)
          .eq("analysis_scope", "default");
      } else if (isBBFSCategory) {
        query = query
          .eq("mode", "bbfs")
          .eq("param", queryParam)
          .eq("target_pair", effectiveTargetPair)
          .eq("analysis_scope", bbfsScope);
      } else if (isAICategory) {
        query = query
          .eq("param", queryParam)
          .eq("analysis_scope", aiScope);
      } else {
        query = query
          .eq("param", queryParam)
          .eq("analysis_scope", "default");
      }

      if (isPairCategory) query = query.eq("target_pair", targetPair);
      if (isAICategory && aiScope !== "default") query = query.eq("target_pair", "belakang");

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
          .select(MARKET_STAT_SELECT)
          .eq("is_active", true)
          .in("market_id", marketIds)
          .gte("wins_15", MIN_WINS_15)
          .gte("wins_last_5", MIN_WINS_LAST_5)
          .lte("max_loss_streak", MAX_LOSS_STREAK_ALLOWED)
          .order("score", { ascending: false })
          .limit(1000);

        if (relatedError) throw relatedError;

        const cleanRelated = ((relatedData || []) as MarketStatistic[]).filter(
          (row) => row.group_key !== "off_digit" || row.mode === "mati_2d"
        );

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
    if (category === "ai" && !aiParamOptions(aiScope).includes(param)) setParam(aiParamOptions(aiScope)[0]);
    if (category === "bbfs" && ![7, 8, 9].includes(param)) setParam(8);
    if (!["ai", "bbfs"].includes(category) && ![1, 2, 3].includes(param)) setParam(1);
  }, [category, aiScope]);

  useEffect(() => {
    loadStatistics();
  }, [category, targetPair, aiScope, bbfsScope, param]);

  const topItems = useMemo(() => items.slice(0, 100), [items]);
  const latestUpdate = topItems[0]?.updated_at;

  return (
    <div
      className="statistics-page fixed inset-0 z-50 overflow-y-auto animate-[riseIn_0.35s_ease-out] px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6"
      style={{
        color: "var(--text)",
        background:
          "radial-gradient(circle at 10% 0%, rgba(52,211,153,0.16), transparent 28%), radial-gradient(circle at 90% 18%, rgba(246,201,107,0.12), transparent 26%), radial-gradient(circle at 50% 80%, rgba(99,102,241,0.12), transparent 32%), linear-gradient(180deg,#03070a 0%,#06100e 46%,#030407 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)] shadow-lg active:scale-95"
        >
          <ArrowLeft size={17} /> Beranda
        </button>

        <section>
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(8,18,18,0.96),rgba(13,11,22,0.96))] p-5 shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[2.2px]" style={{ color: statAccent }}>
                  Statistik Pasaran
                </p>
                <h2 className="mt-2 font-['Orbitron'] text-[28px] font-black uppercase leading-tight tracking-[4px] text-[var(--text)]">
                  Ranking
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase leading-5 tracking-[1.2px] text-[var(--text-dim)]">
                  {currentFilterLabel} · {topItems.length} pasaran
                </p>
              </div>

              <button
                onClick={loadStatistics}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] text-[var(--text-dim)] shadow-inner active:scale-95"
                aria-label="Refresh statistik"
              >
                <RefreshCw size={19} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-300/12 bg-black/35 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Mode</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[12px] font-black uppercase tracking-[1.8px]" style={{ color: statAccent }}>
                  {currentFilterLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200/12 bg-black/35 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Update</p>
                <p className="mt-1 truncate font-['Orbitron'] text-[11px] font-black uppercase tracking-[1.4px]" style={{ color: statGold }}>
                  {formatUpdatedAt(latestUpdate)}
                </p>
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

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className="min-h-[68px] rounded-[1.2rem] px-1 py-3 text-center transition active:scale-[0.985]"
                    style={{
                      background: active
                        ? "linear-gradient(135deg,rgba(52,211,153,0.25),rgba(246,201,107,0.10))"
                        : "rgba(255,255,255,0.035)",
                      border: active ? `1px solid ${statAccent}` : "1px solid rgba(255,255,255,0.075)",
                      boxShadow: active ? "0 14px 30px rgba(52,211,153,0.14)" : "none",
                    }}
                  >
                    <span
                      className="block font-['Orbitron'] text-[10px] font-black uppercase leading-tight tracking-[0.9px]"
                      style={{ color: active ? statAccent : "var(--text)" }}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        <section>
          <SectionLabel title="Filter Ranking" right={currentFilterLabel} />

          <Panel className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">
                {isBBFSCategory ? "Scope BBFS" : isAICategory ? "Scope AI" : isPositionCategory ? "2D Posisi" : "Fokus"}
              </p>
              <span
                className="max-w-[62%] truncate rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[1px] text-black"
                style={{ background: statGold }}
              >
                {currentFilterLabel}
              </span>
            </div>

            {isAICategory && (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {aiScopes.map((item) => {
                    const active = aiScope === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setAiScope(item.key)}
                        className="min-h-[54px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]"
                        style={{
                          background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)",
                          color: active ? "#03120d" : "var(--text-dim)",
                          border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <p className="rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">
                  {aiScopeSubtitle(aiScope)}
                </p>
              </div>
            )}

            {isBBFSCategory ? (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {bbfsScopes.map((item) => {
                    const active = bbfsScope === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setBbfsScope(item.key)}
                        className={`${item.key === "2d_belakang" ? "col-span-2" : ""} min-h-[54px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]`}
                        style={{
                          background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)",
                          color: active ? "#03120d" : "var(--text-dim)",
                          border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)",
                          boxShadow: active ? "0 12px 28px rgba(52,211,153,0.22)" : "none",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <p className="rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">
                  {selectedBBFS.subtitle}
                </p>
              </div>
            ) : !isAICategory ? (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {targetPairs.map((item) => {
                    const active = targetPair === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTargetPair(item.key)}
                        className="min-h-[52px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]"
                        style={{
                          background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)",
                          color: active ? "#03120d" : "var(--text-dim)",
                          border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {isPositionCategory && (
                  <p className="rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">
                    {positionPairSubtitle(targetPair)}
                  </p>
                )}
              </div>
            ) : aiScope === "default" ? (
              <div className="space-y-3 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {targetPairs.map((item) => {
                    const active = targetPair === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTargetPair(item.key)}
                        className="min-h-[52px] rounded-[1.05rem] px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-[0.985]"
                        style={{
                          background: active ? "linear-gradient(135deg,#34d399,#22c55e)" : "rgba(255,255,255,0.045)",
                          color: active ? "#03120d" : "var(--text-dim)",
                          border: active ? "1px solid rgba(187,247,208,0.75)" : "1px solid rgba(255,255,255,0.075)",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.35rem] border border-amber-200/[0.10] bg-black/20 p-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">Parameter</p>

              <div className="grid grid-cols-3 gap-2">
                {paramOptions.map((value) => {
                  const active = param === value;
                  const label = category === "ai" ? aiParamLabel(value) : String(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setParam(value)}
                      className={`${category === "ai" && value >= 7 ? "col-span-3" : ""} min-h-[54px] rounded-[1.05rem] px-2 py-3 text-[10px] font-black uppercase tracking-[1.2px] transition active:scale-[0.985]`}
                      style={{
                        background: active ? "linear-gradient(135deg,#f6c96b,#facc15)" : "rgba(255,255,255,0.045)",
                        color: active ? "#120d02" : "var(--text-dim)",
                        border: active ? "1px solid rgba(254,240,138,0.75)" : "1px solid rgba(255,255,255,0.075)",
                        boxShadow: active ? "0 12px 28px rgba(246,201,107,0.18)" : "none",
                      }}
                    >
                      {label}
                    </button>
                  );
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
              {topItems.map((item, index) => (
                <StatisticCard
                  key={item.id || `${item.market_id}-${item.group_key}-${item.param}-${item.position}-${item.target_pair}-${item.analysis_scope}`}
                  item={item}
                  index={index}
                  relatedStats={relatedStats}
                  onOpen={navigate}
                />
              ))}
            </div>
          ) : (
            <Panel className="p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[var(--text-dim)]">
                <BarChart3 />
              </div>
              <p className="font-['Orbitron'] text-[14px] font-black uppercase tracking-[2px] text-[var(--text)]">Belum ada ranking</p>
              <p className="mx-auto mt-3 max-w-sm text-[12px] leading-5 text-[var(--text-dim)]">
                {error ? "Statistik belum bisa dimuat. Pastikan evaluator statistik sudah berjalan." : `Belum ada pasaran yang masuk kriteria ${currentFilterLabel}.`}
              </p>
              <button
                onClick={loadStatistics}
                className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[1.5px] text-[var(--text)] active:scale-[0.985]"
              >
                Muat Ulang
              </button>
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BarChart3, RefreshCw, Sparkles } from "lucide-react";
import { SHIO_2D } from "../lib/analysis/constants";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type EvaluationRow = {
  id?: string;
  market_id: string;
  market_name?: string;
  mode: "ai" | "mati" | "jumlah" | "shio";
  param: number;
  position?: string;
  target_pair?: string;
  is_hit?: boolean;
  status?: string;
  result_snapshot?: any;
  detail?: any;
  evaluated_at?: string;
};

type StableMetric = {
  market_id: string;
  market_name?: string;
  mode: string;
  param: number;
  position: string;
  target_pair: string;
  rows: EvaluationRow[];
  result_snapshot: any;
  wins_15: number;
  wins_last_5: number;
  max_loss_streak: number;
  score: number;
};

type RekapWatchItem = {
  id?: string;
  market_id: string;
  market_name?: string;
  focus?: string;
  focus_label?: string;
  filter_label?: string;
  filters?: any;
  line_count?: number;
  wins_15?: number;
  wins_last_5?: number;
  max_loss_streak?: number;
  score?: number;
  updated_at?: string;
};

const TARGET_PAIR = "belakang";
const MIN_LINE = 50;
const MAX_LINE = 65;
const SAMPLE_SIZE = 15;
const MIN_WINS_15 = 11;
const MIN_WINS_LAST_5 = 3;
const MAX_LOSS_STREAK = 2;
const PAGE_SIZE = 1000;
const MAX_EVALUATION_ROWS = 70000;

function formatFocus(value?: string, label?: string) {
  if (label) return label;
  if (value === "depan") return "2D DEPAN";
  if (value === "tengah") return "2D TENGAH";
  if (value === "belakang") return "2D BELAKANG";
  if (value === "3d") return "3D";
  if (value === "4d") return "4D";
  return "REKAP";
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Belum ada update";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum ada update";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isSuccess(row: EvaluationRow) {
  return row?.status !== "TIDAK MASUK" && row?.status !== "ZONK" && row?.is_hit !== false;
}

function maxLossStreak(rows: EvaluationRow[]) {
  let max = 0;
  let current = 0;
  rows.forEach((row) => {
    if (isSuccess(row)) {
      current = 0;
    } else {
      current += 1;
      max = Math.max(max, current);
    }
  });
  return max;
}

function safeNumberArray(value: any) {
  if (Array.isArray(value)) return value.map(Number).filter((n) => Number.isFinite(n));
  if (Array.isArray(value?.result)) return value.result.map(Number).filter((n: number) => Number.isFinite(n));
  if (Array.isArray(value?.data)) return value.data.map(Number).filter((n: number) => Number.isFinite(n));
  if (Array.isArray(value?.digits)) return value.digits.map(Number).filter((n: number) => Number.isFinite(n));
  return [];
}

function getMatiPositionDigits(snapshot: any, position: "kepala" | "ekor") {
  const key = position === "kepala" ? "KEPALA" : "EKOR";
  return safeNumberArray(snapshot?.[key] || snapshot?.[position] || snapshot?.[key.toLowerCase()]);
}

function jumlah2D(a: number, b: number) {
  const sum = a + b;
  return sum >= 10 ? sum - 9 : sum;
}

function shioOf2D(n: number) {
  for (const [shio, list] of Object.entries(SHIO_2D)) {
    if (list.includes(n)) return Number(shio);
  }
  return 1;
}

function build2DBelakangLineCount(filters: {
  ai?: number[];
  bbfs?: number[];
  offKepala?: number[];
  offEkor?: number[];
  offJumlah?: number[];
  offShio?: number[];
}) {
  let count = 0;
  for (let kepala = 0; kepala <= 9; kepala += 1) {
    for (let ekor = 0; ekor <= 9; ekor += 1) {
      if (filters.offKepala?.includes(kepala)) continue;
      if (filters.offEkor?.includes(ekor)) continue;
      if (filters.ai?.length && !filters.ai.includes(kepala) && !filters.ai.includes(ekor)) continue;
      if (filters.bbfs?.length && (!filters.bbfs.includes(kepala) || !filters.bbfs.includes(ekor))) continue;
      if (filters.offJumlah?.includes(jumlah2D(kepala, ekor))) continue;
      if (filters.offShio?.includes(shioOf2D(kepala * 10 + ekor))) continue;
      count += 1;
    }
  }
  return count;
}

function groupEvaluationRows(rows: EvaluationRow[]) {
  const groups = new Map<string, EvaluationRow[]>();
  rows.forEach((row) => {
    if (!row.market_id || !row.mode || !row.param) return;
    const position = row.position || "all";
    const targetPair = row.target_pair || "belakang";
    const key = [row.market_id, row.mode, row.param, position, targetPair].join("|");
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  });

  const stable = new Map<string, StableMetric>();
  groups.forEach((group) => {
    const sorted = [...group].sort((a, b) => new Date(b.evaluated_at || 0).getTime() - new Date(a.evaluated_at || 0).getTime());
    const sample = sorted.slice(0, SAMPLE_SIZE);
    if (sample.length < SAMPLE_SIZE) return;
    const wins15 = sample.filter(isSuccess).length;
    const winsLast5 = sample.slice(0, 5).filter(isSuccess).length;
    const lossStreak = maxLossStreak(sample);
    if (wins15 < MIN_WINS_15 || winsLast5 < MIN_WINS_LAST_5 || lossStreak > MAX_LOSS_STREAK) return;
    const latest = sample[0];
    const position = latest.position || "all";
    const targetPair = latest.target_pair || "belakang";
    const key = [latest.market_id, latest.mode, latest.param, position, targetPair].join("|");
    stable.set(key, {
      market_id: latest.market_id,
      market_name: latest.market_name,
      mode: latest.mode,
      param: Number(latest.param),
      position,
      target_pair: targetPair,
      rows: sample,
      result_snapshot: latest.result_snapshot,
      wins_15: wins15,
      wins_last_5: winsLast5,
      max_loss_streak: lossStreak,
      score: wins15 * 10 + winsLast5 * 5 - lossStreak * 8,
    });
  });
  return stable;
}

function metricKey(marketId: string, mode: string, param: number, position = "all", targetPair = TARGET_PAIR) {
  return [marketId, mode, param, position, targetPair].join("|");
}

function combineStats(metrics: StableMetric[]) {
  return {
    wins_15: Math.min(...metrics.map((item) => item.wins_15)),
    wins_last_5: Math.min(...metrics.map((item) => item.wins_last_5)),
    max_loss_streak: Math.max(...metrics.map((item) => item.max_loss_streak)),
  };
}

function buildWatchItems(rows: EvaluationRow[]): RekapWatchItem[] {
  const stable = groupEvaluationRows(rows);
  const marketIds = Array.from(new Set(rows.map((row) => row.market_id).filter(Boolean)));
  const items: RekapWatchItem[] = [];

  marketIds.forEach((marketId) => {
    const aiMetrics = [2, 4, 6]
      .map((param) => stable.get(metricKey(marketId, "ai", param)))
      .filter(Boolean) as StableMetric[];
    const bbfsMetric = stable.get(metricKey(marketId, "ai", 8));
    const kepalaMetrics = [1, 2, 3]
      .map((param) => stable.get(metricKey(marketId, "mati", param, "kepala")))
      .filter(Boolean) as StableMetric[];
    const ekorMetrics = [1, 2, 3]
      .map((param) => stable.get(metricKey(marketId, "mati", param, "ekor")))
      .filter(Boolean) as StableMetric[];
    const jumlahMetrics = [1, 2, 3]
      .map((param) => stable.get(metricKey(marketId, "jumlah", param)))
      .filter(Boolean) as StableMetric[];
    const shioMetrics = [1, 2, 3]
      .map((param) => stable.get(metricKey(marketId, "shio", param)))
      .filter(Boolean) as StableMetric[];

    const addItem = (label: string, metrics: StableMetric[], lineCount: number, filters: any) => {
      if (lineCount < MIN_LINE || lineCount > MAX_LINE || !metrics.length) return;
      const stats = combineStats(metrics);
      const lineDistance = Math.abs(lineCount - 55);
      const score = stats.wins_15 * 10 + stats.wins_last_5 * 5 - stats.max_loss_streak * 8 - lineDistance;
      items.push({
        id: `${marketId}-${label}`,
        market_id: marketId,
        market_name: metrics[0]?.market_name || marketId,
        focus: TARGET_PAIR,
        focus_label: "2D BELAKANG",
        filter_label: label,
        filters,
        line_count: lineCount,
        wins_15: stats.wins_15,
        wins_last_5: stats.wins_last_5,
        max_loss_streak: stats.max_loss_streak,
        score,
        updated_at: metrics[0]?.rows?.[0]?.evaluated_at,
      });
    };

    aiMetrics.forEach((ai) => {
      const aiDigits = safeNumberArray(ai.result_snapshot);
      if (!aiDigits.length) return;
      kepalaMetrics.forEach((mati) => {
        const offKepala = getMatiPositionDigits(mati.result_snapshot, "kepala");
        const lineCount = build2DBelakangLineCount({ ai: aiDigits, offKepala });
        addItem(`AI BELAKANG ${ai.param}D + OFF KEPALA ${mati.param}`, [ai, mati], lineCount, { aiByPair: { belakang: ai.param }, offKepala: mati.param });
      });
      ekorMetrics.forEach((mati) => {
        const offEkor = getMatiPositionDigits(mati.result_snapshot, "ekor");
        const lineCount = build2DBelakangLineCount({ ai: aiDigits, offEkor });
        addItem(`AI BELAKANG ${ai.param}D + OFF EKOR ${mati.param}`, [ai, mati], lineCount, { aiByPair: { belakang: ai.param }, offEkor: mati.param });
      });
      jumlahMetrics.forEach((jumlah) => {
        const offJumlah = safeNumberArray(jumlah.result_snapshot);
        const lineCount = build2DBelakangLineCount({ ai: aiDigits, offJumlah });
        addItem(`AI BELAKANG ${ai.param}D + OFF JML BELAKANG ${jumlah.param}`, [ai, jumlah], lineCount, { aiByPair: { belakang: ai.param }, jumlahByPair: { belakang: jumlah.param } });
      });
      shioMetrics.forEach((shio) => {
        const offShio = safeNumberArray(shio.result_snapshot);
        const lineCount = build2DBelakangLineCount({ ai: aiDigits, offShio });
        addItem(`AI BELAKANG ${ai.param}D + OFF SHIO BELAKANG ${shio.param}`, [ai, shio], lineCount, { aiByPair: { belakang: ai.param }, shioByPair: { belakang: shio.param } });
      });
    });

    if (bbfsMetric) {
      const bbfs = safeNumberArray(bbfsMetric.result_snapshot);
      if (bbfs.length) {
        kepalaMetrics.concat(ekorMetrics).forEach((mati) => {
          const isKepala = mati.position === "kepala";
          const offDigits = getMatiPositionDigits(mati.result_snapshot, isKepala ? "kepala" : "ekor");
          const lineCount = build2DBelakangLineCount(isKepala ? { bbfs, offKepala: offDigits } : { bbfs, offEkor: offDigits });
          addItem(`BBFS BELAKANG + OFF ${isKepala ? "KEPALA" : "EKOR"} ${mati.param}`, [bbfsMetric, mati], lineCount, isKepala ? { bbfsByPair: { belakang: true }, offKepala: mati.param } : { bbfsByPair: { belakang: true }, offEkor: mati.param });
        });
      }
    }
  });

  return items.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

function buildFilterLabel(item: RekapWatchItem) {
  if (item.filter_label) return item.filter_label;
  return "Combo rekap tercatat";
}

export default function RekapWatchPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RekapWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowCount, setRowCount] = useState(0);

  const fetchEvaluationRows = async () => {
    const allRows: EvaluationRow[] = [];
    for (let from = 0; from < MAX_EVALUATION_ROWS; from += PAGE_SIZE) {
      const to = from + PAGE_SIZE - 1;
      const { data, error: queryError } = await supabase
        .from("analysis_evaluations")
        .select("id,market_id,market_name,mode,param,position,target_pair,is_hit,status,result_snapshot,detail,evaluated_at")
        .in("mode", ["ai", "mati", "jumlah", "shio"])
        .order("evaluated_at", { ascending: false })
        .range(from, to);
      if (queryError) throw queryError;
      const page = (data || []) as EvaluationRow[];
      allRows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
    return allRows;
  };

  const loadWatchlist = async () => {
    setLoading(true);
    setError("");
    setRowCount(0);
    try {
      const rows = await fetchEvaluationRows();
      setRowCount(rows.length);
      setItems(buildWatchItems(rows));
    } catch (e: any) {
      setItems([]);
      setError(e.message || "Belum bisa membaca analysis_evaluations.");
    }
    setLoading(false);
  };

  useEffect(() => { loadWatchlist(); }, []);

  const bestByMarket = useMemo(() => {
    const map = new Map<string, RekapWatchItem>();
    items.forEach((item) => {
      if (!item.market_id) return;
      const current = map.get(item.market_id);
      if (!current || Number(item.score || 0) > Number(current.score || 0)) map.set(item.market_id, item);
    });
    return Array.from(map.values()).sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  }, [items]);

  return (
    <div className="rekap-watch-page animate-[riseIn_0.35s_ease-out] pb-6">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="premium-panel relative mb-4 overflow-hidden p-5">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[var(--cyan-dim)] blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--gold)]">
            <Sparkles size={12} /> Pantauan
          </div>
          <h2 className="font-['Orbitron'] text-[23px] font-black uppercase tracking-[3.5px] text-[var(--text)]">Pantauan Rekap</h2>
          <p className="mt-3 text-[11px] font-semibold uppercase leading-5 tracking-[1.4px] text-[var(--text-dim)]">Dibentuk dari analysis_evaluations. Menampilkan statistik combo 2D Belakang 50-65 line.</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[1.5px] text-[var(--cyan)]">{bestByMarket.length} pasaran · {rowCount} row</span>
        <button onClick={loadWatchlist} className="ghost-button flex h-12 w-12 shrink-0 items-center justify-center text-[var(--text-dim)] active:scale-95" aria-label="Refresh pantauan rekap">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="premium-panel p-6 text-center text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Membaca analysis_evaluations...</div>
      ) : bestByMarket.length ? (
        <div className="grid gap-3">
          {bestByMarket.map((item) => {
            const marketName = item.market_name || item.market_id;
            return (
              <div key={`${item.market_id}-${item.id || item.filter_label || item.focus}`} className="premium-card relative overflow-hidden p-4 text-left">
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--cyan-dim)] blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] text-[var(--cyan)]">
                    <BarChart3 size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-['Orbitron'] text-[15px] font-black uppercase tracking-[2.4px] text-[var(--text)]">{marketName}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[1.7px] text-[var(--cyan)]">{formatFocus(item.focus, item.focus_label)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">STAT</span>
                    </div>
                    <p className="mt-3 text-[12px] font-bold leading-5 text-[var(--text)]">{buildFilterLabel(item)}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Line</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.line_count || 0}</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Riwayat</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--gold)]">{item.wins_15 || 0}/15</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Last 5</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.wins_last_5 || 0}/5</p></div>
                    </div>
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[1.3px] text-[var(--text-soft)]">Max lose {item.max_loss_streak ?? 0} · Update {formatUpdatedAt(item.updated_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="premium-panel p-6 text-center">
          <BarChart3 className="mx-auto mb-3 text-[var(--text-dim)]" />
          <p className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px] text-[var(--text)]">Belum ada pantauan</p>
          <p className="mt-3 text-[11px] leading-5 text-[var(--text-dim)]">{error ? "analysis_evaluations belum bisa dibaca atau format kolom belum sesuai." : `Sudah membaca ${rowCount} row, tetapi belum ada kombinasi statistik 2D Belakang 50-65 line yang lolos filter.`}</p>
        </div>
      )}
    </div>
  );
}

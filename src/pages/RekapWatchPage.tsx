import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BarChart3, RefreshCw, Sparkles } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type CategoryKey = "ai" | "bbfs" | "off_digit" | "off_jumlah" | "off_shio";
type TargetPair = "depan" | "tengah" | "belakang";
type PositionKey = "as" | "kop" | "kepala" | "ekor";

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

const categories: Array<{ key: CategoryKey; title: string; subtitle: string }> = [
  { key: "ai", title: "AI", subtitle: "Angka ikut 2D, 4D, 6D" },
  { key: "bbfs", title: "BBFS", subtitle: "BBFS per fokus 2D" },
  { key: "off_digit", title: "OFF Digit", subtitle: "AS, KOP, Kepala, Ekor" },
  { key: "off_jumlah", title: "OFF Jumlah", subtitle: "Jumlah mati 2D" },
  { key: "off_shio", title: "OFF Shio", subtitle: "Shio mati 2D" },
];

const targetPairs: Array<{ key: TargetPair; label: string }> = [
  { key: "depan", label: "Depan" },
  { key: "tengah", label: "Tengah" },
  { key: "belakang", label: "Belakang" },
];

const positions: Array<{ key: PositionKey; label: string }> = [
  { key: "as", label: "AS" },
  { key: "kop", label: "KOP" },
  { key: "kepala", label: "Kepala" },
  { key: "ekor", label: "Ekor" },
];

function formatUpdatedAt(value?: string) {
  if (!value) return "Belum diperbarui";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum diperbarui";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function targetPairLabel(value?: string) {
  if (value === "depan") return "Depan";
  if (value === "tengah") return "Tengah";
  if (value === "belakang") return "Belakang";
  return "Semua";
}

function positionLabel(value?: string) {
  if (value === "as") return "AS";
  if (value === "kop") return "KOP";
  if (value === "kepala") return "Kepala";
  if (value === "ekor") return "Ekor";
  return "Semua";
}

function statTitle(item: MarketStatistic) {
  if (item.group_key === "ai") return `AI ${targetPairLabel(item.target_pair)} ${item.param}D`;
  if (item.group_key === "bbfs") return `BBFS ${targetPairLabel(item.target_pair)}`;
  if (item.group_key === "off_digit") return `OFF ${positionLabel(item.position)} ${item.param}`;
  if (item.group_key === "off_jumlah") return `OFF Jumlah ${targetPairLabel(item.target_pair)} ${item.param}`;
  if (item.group_key === "off_shio") return `OFF Shio ${targetPairLabel(item.target_pair)} ${item.param}`;
  return item.group_label || "Statistik";
}

function badgeLabel(item: MarketStatistic) {
  if (item.wins_15 >= 14) return "Unggulan";
  if (item.wins_15 >= 12) return "Stabil";
  if (item.wins_last_5 >= 5) return "Naik";
  return "Cek";
}

function analysisPath(item: MarketStatistic) {
  if (item.group_key === "off_digit") return "mati";
  if (item.group_key === "off_jumlah") return "jumlah";
  if (item.group_key === "off_shio") return "shio";
  return "ai";
}

export default function RekapWatchPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryKey>("ai");
  const [targetPair, setTargetPair] = useState<TargetPair>("belakang");
  const [position, setPosition] = useState<PositionKey>("kepala");
  const [param, setParam] = useState<number>(4);
  const [items, setItems] = useState<MarketStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryMeta = categories.find((item) => item.key === category) || categories[0];
  const isPairCategory = category === "ai" || category === "bbfs" || category === "off_jumlah" || category === "off_shio";
  const isPositionCategory = category === "off_digit";
  const paramOptions = category === "ai" ? [2, 4, 6] : category === "bbfs" ? [8] : [1, 2, 3];

  const loadStatistics = async () => {
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("market_statistics")
        .select("id,market_id,market_name,group_key,group_label,mode,param,position,target_pair,wins_15,wins_last_5,max_loss_streak,sample_size,score,updated_at")
        .eq("is_active", true)
        .eq("group_key", category)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(200);

      if (category === "bbfs") query = query.eq("param", 8);
      else query = query.eq("param", param);
      if (isPairCategory) query = query.eq("target_pair", targetPair);
      if (isPositionCategory) query = query.eq("position", position);

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setItems((data || []) as MarketStatistic[]);
    } catch (e: any) {
      setItems([]);
      setError(e.message || "Belum bisa memuat statistik.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (category === "ai" && ![2, 4, 6].includes(param)) setParam(4);
    if (category === "bbfs" && param !== 8) setParam(8);
    if (!["ai", "bbfs"].includes(category) && ![1, 2, 3].includes(param)) setParam(1);
  }, [category]);

  useEffect(() => { loadStatistics(); }, [category, targetPair, position, param]);

  const topItems = useMemo(() => items.slice(0, 100), [items]);

  return (
    <div className="statistics-page animate-[riseIn_0.35s_ease-out] pb-6">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="premium-panel relative mb-4 overflow-hidden p-5">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[var(--cyan-dim)] blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--gold)]">
            <Sparkles size={12} /> Statistik
          </div>
          <h2 className="font-['Orbitron'] text-[23px] font-black uppercase tracking-[3.5px] text-[var(--text)]">Statistik Pasaran</h2>
          <p className="mt-3 text-[11px] font-semibold uppercase leading-5 tracking-[1.4px] text-[var(--text-dim)]">Pilih jenis analisa, lalu lihat pasaran yang sedang paling stabil berdasarkan riwayat terbaru.</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {categories.map((item) => {
          const active = item.key === category;
          return (
            <button key={item.key} type="button" onClick={() => setCategory(item.key)} className={`rounded-3xl border p-3 text-left active:scale-[0.985] ${active ? "border-[var(--cyan)] bg-[var(--cyan-dim)]" : "border-white/10 bg-white/[0.04]"}`}>
              <span className={`block font-['Orbitron'] text-[11px] font-black uppercase tracking-[1.8px] ${active ? "text-[var(--cyan)]" : "text-[var(--text)]"}`}>{item.title}</span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[1px] text-[var(--text-dim)]">{item.subtitle}</span>
            </button>
          );
        })}
      </div>

      <div className="premium-panel mb-4 space-y-3 p-3">
        <div>
          <p className="mb-2 text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Pilihan</p>
          <div className="flex flex-wrap gap-2">
            {isPairCategory && targetPairs.map((item) => (
              <button key={item.key} type="button" onClick={() => setTargetPair(item.key)} className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-[1.2px] ${targetPair === item.key ? "bg-[var(--cyan)] text-black" : "bg-white/[0.06] text-[var(--text-dim)]"}`}>{item.label}</button>
            ))}
            {isPositionCategory && positions.map((item) => (
              <button key={item.key} type="button" onClick={() => setPosition(item.key)} className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-[1.2px] ${position === item.key ? "bg-[var(--cyan)] text-black" : "bg-white/[0.06] text-[var(--text-dim)]"}`}>{item.label}</button>
            ))}
          </div>
        </div>

        {category !== "bbfs" && (
          <div>
            <p className="mb-2 text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">Level</p>
            <div className="flex flex-wrap gap-2">
              {paramOptions.map((value) => (
                <button key={value} type="button" onClick={() => setParam(value)} className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-[1.2px] ${param === value ? "bg-[var(--gold)] text-black" : "bg-white/[0.06] text-[var(--text-dim)]"}`}>{category === "ai" ? `${value}D` : `OFF ${value}`}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[1.5px] text-[var(--cyan)]">{topItems.length} pasaran masuk</span>
        <button onClick={loadStatistics} className="ghost-button flex h-12 w-12 shrink-0 items-center justify-center text-[var(--text-dim)] active:scale-95" aria-label="Refresh statistik">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="premium-panel p-6 text-center text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Memuat statistik terbaru...</div>
      ) : topItems.length ? (
        <div className="grid gap-3">
          {topItems.map((item, index) => {
            const marketName = item.market_name || item.market_id;
            return (
              <div key={item.id || `${item.market_id}-${item.group_key}-${item.param}-${item.position}-${item.target_pair}`} className="premium-card relative overflow-hidden p-4 text-left">
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--cyan-dim)] blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] text-[var(--cyan)]">
                    <span className="font-['Orbitron'] text-[13px] font-black">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-['Orbitron'] text-[15px] font-black uppercase tracking-[2.4px] text-[var(--text)]">{marketName}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[1.7px] text-[var(--cyan)]">{statTitle(item)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[1.4px] text-[var(--gold)]">{badgeLabel(item)}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Riwayat</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--gold)]">{item.wins_15}/15</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Terbaru</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.wins_last_5}/5</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Kosong</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.max_loss_streak}</p></div>
                    </div>

                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[1.3px] text-[var(--text-soft)]">Update {formatUpdatedAt(item.updated_at)}</p>
                    <button type="button" onClick={() => navigate(`/analyze/${item.market_id}/${analysisPath(item)}`)} className="mt-4 w-full rounded-2xl bg-[var(--cyan)] px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-black active:scale-[0.985]">Buka Analisa</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="premium-panel p-6 text-center">
          <BarChart3 className="mx-auto mb-3 text-[var(--text-dim)]" />
          <p className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px] text-[var(--text)]">Belum ada statistik</p>
          <p className="mt-3 text-[11px] leading-5 text-[var(--text-dim)]">{error ? "Statistik belum bisa dimuat. Pastikan tabel market_statistics sudah dibuat dan evaluator sudah berjalan." : `Belum ada pasaran yang masuk kriteria ${categoryMeta.title}.`}</p>
        </div>
      )}
    </div>
  );
}

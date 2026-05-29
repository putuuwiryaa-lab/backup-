import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BarChart3, RefreshCw, Sparkles } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  is_active?: boolean;
  updated_at?: string;
};

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
  if (!value) return "Belum diperbarui";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum diperbarui";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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

  const loadWatchlist = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: queryError } = await supabase
        .from("rekap_watchlist")
        .select("id,market_id,market_name,focus,focus_label,filter_label,filters,line_count,wins_15,wins_last_5,max_loss_streak,score,is_active,updated_at")
        .eq("is_active", true)
        .gte("line_count", 50)
        .lte("line_count", 60)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(200);
      if (queryError) throw queryError;
      setItems((data || []) as RekapWatchItem[]);
    } catch (e: any) {
      setItems([]);
      setError(e.message || "Belum bisa memuat pantauan.");
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
          <p className="mt-3 text-[11px] font-semibold uppercase leading-5 tracking-[1.4px] text-[var(--text-dim)]">Ringkasan combo rekap yang sedang stabil berdasarkan riwayat terbaru.</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[1.5px] text-[var(--cyan)]">{bestByMarket.length} pasaran terpantau</span>
        <button onClick={loadWatchlist} className="ghost-button flex h-12 w-12 shrink-0 items-center justify-center text-[var(--text-dim)] active:scale-95" aria-label="Refresh pantauan rekap">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="premium-panel p-6 text-center text-[11px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Memuat pantauan terbaru...</div>
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
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">PANTAU</span>
                    </div>
                    <p className="mt-3 text-[12px] font-bold leading-5 text-[var(--text)]">{buildFilterLabel(item)}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Line</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.line_count || 0}</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Riwayat</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--gold)]">{item.wins_15 || 0}/15</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/18 p-2"><p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Terbaru</p><p className="mt-1 font-['Orbitron'] text-[13px] font-black text-[var(--cyan)]">{item.wins_last_5 || 0}/5</p></div>
                    </div>
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[1.3px] text-[var(--text-soft)]">Runtun kosong maks. {item.max_loss_streak ?? 0} · Update {formatUpdatedAt(item.updated_at)}</p>
                    <button
  type="button"
  onClick={() => {
  sessionStorage.setItem("supreme_rekap_watch_preset", JSON.stringify(item));
  navigate(`/analyze/${item.market_id}/rekap`);
}}
  className="mt-4 w-full rounded-2xl bg-[var(--cyan)] px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-black active:scale-[0.985]"
>
  Buka Rekap
</button>
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
          <p className="mt-3 text-[11px] leading-5 text-[var(--text-dim)]">{error ? "Pantauan belum bisa dimuat. Coba refresh beberapa saat lagi." : "Belum ada combo rekap 50–60 line yang masuk kriteria pantauan."}</p>
        </div>
      )}
    </div>
  );
}

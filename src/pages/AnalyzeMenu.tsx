import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { RefreshCw, Cpu, ArrowLeft, Sparkles, Activity, ShieldAlert, Hash, Gauge, Trophy } from "lucide-react";
import AnalysisPage from "./AnalysisPageV2";

const MODE_META: any = {
  ai: { icon: "✦", lucide: Activity, accent: "#f3c14b", glow: "rgba(243, 193, 75, 0.16)", subtitle: "Rekomendasi angka pendamping", badge: "25 RUMUS" },
  mati: { icon: "×", lucide: ShieldAlert, accent: "#ff647c", glow: "rgba(255, 100, 124, 0.14)", subtitle: "Filter angka berisiko", badge: "50 RUMUS" },
  jumlah: { icon: "#", lucide: Hash, accent: "#b58cff", glow: "rgba(181, 140, 255, 0.14)", subtitle: "Analisa jumlah rawan", badge: "50 RUMUS" },
  shio: { icon: "◎", lucide: Gauge, accent: "#28d7ff", glow: "rgba(40, 215, 255, 0.14)", subtitle: "Filter shio rawan", badge: "12 SHIO" },
  rekap: { icon: "◆", lucide: Trophy, accent: "#6ea8ff", glow: "rgba(110, 168, 255, 0.16)", subtitle: "Invest dan top pilihan", badge: "GENERATOR" },
};

export default function AnalyzeMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAnalyzeRoute = location.pathname.startsWith("/analyze/");
    if (!isAnalyzeRoute) return;
    const marker = `guard:${location.pathname}`;
    if (history.state?.mobileBackGuard !== marker) history.pushState({ ...(history.state || {}), mobileBackGuard: marker }, "", location.pathname + location.search + location.hash);
    const handleBack = () => {
      const pathParts = location.pathname.split("/").filter(Boolean);
      const hasModeDetail = pathParts.length >= 3;
      if (hasModeDetail) navigate(`/analyze/${pathParts[1]}`, { replace: true });
      else navigate("/", { replace: true });
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <Routes>
      <Route path="/" element={<AnalyzeList />} />
      <Route path="/ai" element={<AnalysisWrapper type="ai" title="ANGKA IKUT 2D" />} />
      <Route path="/mati" element={<AnalysisWrapper type="mati" title="ANGKA MATI 4D" />} />
      <Route path="/jumlah" element={<AnalysisWrapper type="jumlah" title="JUMLAH MATI 2D" />} />
      <Route path="/shio" element={<AnalysisWrapper type="shio" title="SHIO MATI" />} />
      <Route path="/rekap" element={<AnalysisWrapper type="rekap" title="MENU REKAP" />} />
    </Routes>
  );
}

function AnalysisWrapper({ type, title }: any) {
  const { marketId } = useParams();
  return <AnalysisPage type={type} title={title} icon={MODE_META[type]?.icon || "✦"} marketId={marketId || "SGP"} />;
}

function AnalyzeList() {
  const navigate = useNavigate();
  const { marketId } = useParams();
  const [marketName, setMarketName] = useState(marketId);
  const [lastResult, setLastResult] = useState<string>("...");
  const [dataCount, setDataCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/markets");
      const allMarkets = await res.json();
      const mData = allMarkets.find((m: any) => m.id === marketId);
      if (mData) {
        if (mData.name) setMarketName(mData.name);
        const data = String(mData.history_data || "").split(/[\s\n\r\t,]+/).filter((token: string) => /^\d{4}$/.test(token));
        setDataCount(data.length);
        setLastResult(data.length > 0 ? data[data.length - 1] : "KOSONG");
      } else {
        setLastResult("KOSONG");
        setDataCount(0);
      }
    } catch {
      setLastResult("ERROR");
      setDataCount(0);
    }
    setRefreshing(false);
  };

  useEffect(() => { if (marketId) fetchData(); }, [marketId]);

  return (
    <div className="animate-[slideIn_0.22s_ease-out] pb-4">
      <button onClick={() => navigate("/")} className="ghost-button mb-4 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="premium-panel relative mb-5 overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[var(--cyan-dim)] blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">
            <Sparkles size={12} /> Market Selected
          </div>
          <h3 className="font-['Orbitron'] text-[30px] font-black uppercase leading-none tracking-[4px] text-[var(--text)] sm:text-[36px]">{marketName}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Last Result</p>
              <p className="mt-1 font-['JetBrains_Mono'] text-[24px] font-black tracking-[2px] text-[var(--cyan)]">{lastResult}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">History</p>
              <p className="mt-1 font-['JetBrains_Mono'] text-[24px] font-black tracking-[1px] text-[var(--gold)]">{dataCount}</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={refreshing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95 disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/18" />
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] ring-1 ring-white/10">
          <Cpu size={12} className="text-[var(--cyan)]" /> Select Mode
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/18" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <SubMenuCard label="ANGKA IKUT 2D" meta={MODE_META.ai} onClick={() => navigate("ai")} />
        <SubMenuCard label="ANGKA MATI 4D" meta={MODE_META.mati} onClick={() => navigate("mati")} />
        <SubMenuCard label="JUMLAH MATI 2D" meta={MODE_META.jumlah} onClick={() => navigate("jumlah")} />
        <SubMenuCard label="SHIO MATI" meta={MODE_META.shio} onClick={() => navigate("shio")} />
        <SubMenuCard label="MENU REKAP" meta={MODE_META.rekap} onClick={() => navigate("rekap")} />
      </div>
    </div>
  );
}

function SubMenuCard({ label, meta, onClick }: any) {
  const Icon = meta.lucide;
  return (
    <button onClick={onClick} className="premium-card group relative flex min-h-[98px] w-full items-center gap-4 overflow-hidden p-4 text-left transition active:scale-[0.985]" style={{ boxShadow: `0 18px 45px rgba(0,0,0,0.24), 0 0 36px ${meta.glow}` }}>
      <div className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ backgroundColor: meta.accent }} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: meta.glow }} />
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border bg-white/[0.035]" style={{ borderColor: `${meta.accent}80`, color: meta.accent }}>
        <Icon size={24} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">{meta.badge}</div>
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2.2px]" style={{ color: meta.accent }}>{label}</span>
        <span className="mt-1 block text-[11px] font-semibold text-[var(--text-dim)]">{meta.subtitle}</span>
      </div>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[20px] text-[var(--text-dim)] group-active:text-[var(--gold)]">›</div>
    </button>
  );
}

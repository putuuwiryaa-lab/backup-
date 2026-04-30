import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { RefreshCw, Cpu, ArrowLeft, Sparkles, Activity, ShieldAlert, Hash, Gauge, Trophy } from "lucide-react";
import AnalysisPage from "./AnalysisPageV2";

const MODE_META: any = {
  ai: { icon: "✦", lucide: Activity, accent: "#f3c14b", glow: "rgba(243, 193, 75, 0.16)" },
  mati: { icon: "×", lucide: ShieldAlert, accent: "#ff647c", glow: "rgba(255, 100, 124, 0.14)" },
  jumlah: { icon: "#", lucide: Hash, accent: "#b58cff", glow: "rgba(181, 140, 255, 0.14)" },
  shio: { icon: "◎", lucide: Gauge, accent: "#28d7ff", glow: "rgba(40, 215, 255, 0.14)" },
  rekap: { icon: "◆", lucide: Trophy, accent: "#6ea8ff", glow: "rgba(110, 168, 255, 0.16)" },
};

export default function AnalyzeMenu() {
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
        setLastResult(data.length > 0 ? data[data.length - 1] : "KOSONG");
      } else {
        setLastResult("KOSONG");
      }
    } catch {
      setLastResult("ERROR");
    }
    setRefreshing(false);
  };

  useEffect(() => { if (marketId) fetchData(); }, [marketId]);

  return (
    <div className="animate-[slideIn_0.22s_ease-out] pb-4">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="premium-panel relative mb-4 overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[var(--cyan-dim)] blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--cyan-dim)] px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-[var(--cyan)]">
            <Sparkles size={11} /> Market Selected
          </div>
          <h3 className="font-['Orbitron'] text-[24px] font-black uppercase leading-tight tracking-[4px] text-[var(--text)] sm:text-[30px]">{marketName}</h3>
          <div className="mt-3 rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Last Result</p>
            <p className="mt-1 font-['JetBrains_Mono'] text-[20px] font-black tracking-[2px] text-[var(--cyan)]">{lastResult}</p>
          </div>
          <button onClick={fetchData} disabled={refreshing} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95 disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/18" />
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)] ring-1 ring-white/10">
          <Cpu size={11} className="text-[var(--cyan)]" /> Select Mode
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
    <button onClick={onClick} className="premium-card group relative flex min-h-[92px] w-full items-center gap-4 overflow-hidden p-4 text-left transition active:scale-[0.985]" style={{ boxShadow: `0 18px 45px rgba(0,0,0,0.24), 0 0 36px ${meta.glow}` }}>
      <div className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ backgroundColor: meta.accent }} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: meta.glow }} />
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border bg-white/[0.035]" style={{ borderColor: `${meta.accent}80`, color: meta.accent }}>
        <Icon size={24} />
      </div>
      <div className="relative min-w-0 flex-1">
        <span className="block font-['Orbitron'] text-[14px] font-black uppercase tracking-[2.4px]" style={{ color: meta.accent }}>{label}</span>
      </div>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[20px] text-[var(--text-dim)] group-active:text-[var(--gold)]">›</div>
    </button>
  );
}

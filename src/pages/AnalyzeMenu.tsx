import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Activity, ShieldAlert, Hash, Gauge, Trophy, ChevronRight } from "lucide-react";
import AnalysisPage from "./AnalysisPageV3";

const MODE_META: any = {
  ai: { icon: "✦", lucide: Activity, accent: "#f3c14b", glow: "rgba(243, 193, 75, 0.10)" },
  mati: { icon: "×", lucide: ShieldAlert, accent: "#ff647c", glow: "rgba(255, 100, 124, 0.10)" },
  jumlah: { icon: "#", lucide: Hash, accent: "#b58cff", glow: "rgba(181, 140, 255, 0.10)" },
  shio: { icon: "◎", lucide: Gauge, accent: "#28d7ff", glow: "rgba(40, 215, 255, 0.10)" },
  rekap: { icon: "◆", lucide: Trophy, accent: "#6ea8ff", glow: "rgba(110, 168, 255, 0.10)" },
};

export default function AnalyzeMenu() {
  return (
    <Routes>
      <Route index element={<AnalyzeList />} />
      <Route path="ai" element={<AnalysisWrapper type="ai" title="ANGKA IKUT / BBFS" />} />
      <Route path="mati" element={<AnalysisWrapper type="mati" title="ANGKA MATI 4D" />} />
      <Route path="jumlah" element={<AnalysisWrapper type="jumlah" title="JUMLAH MATI 2D" />} />
      <Route path="shio" element={<AnalysisWrapper type="shio" title="SHIO MATI" />} />
      <Route path="rekap" element={<AnalysisWrapper type="rekap" title="MENU REKAP" />} />
      <Route path="*" element={<AnalyzeList />} />
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

  const fetchData = async () => {
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
  };

  useEffect(() => { if (marketId) fetchData(); }, [marketId]);

  const menuItems = [
    { label: "ANGKA IKUT / BBFS", meta: MODE_META.ai, path: "ai" },
    { label: "ANGKA MATI 4D", meta: MODE_META.mati, path: "mati" },
    { label: "JUMLAH MATI 2D", meta: MODE_META.jumlah, path: "jumlah" },
    { label: "SHIO MATI", meta: MODE_META.shio, path: "shio" },
    { label: "MENU REKAP", meta: MODE_META.rekap, path: "rekap" },
  ];

  return (
    <div className="analyze-menu-page animate-[slideIn_0.22s_ease-out] pb-4">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="analyze-market-hero premium-panel relative mb-4 overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-[var(--cyan-dim)] blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="relative rounded-[1.7rem] border border-white/10 bg-black/20 px-4 py-5 text-center">
          <h3 className="mx-auto max-w-[94%] break-words font-['Orbitron'] text-[22px] font-black uppercase leading-tight tracking-[3.4px] text-[var(--text)] sm:text-[28px]">
            {marketName}
          </h3>
          <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="mt-3 text-[8px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Last Result</p>
          <p className="analyze-last-result mt-2 font-['JetBrains_Mono'] text-[24px] font-black tracking-[4px] text-[var(--cyan)]">{lastResult}</p>
        </div>
      </div>

      <div className="analyze-section-title mb-3 px-1">
        <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Pilih Analisa</p>
      </div>

      <div className="analyze-menu-grid grid grid-cols-1 gap-3">
        {menuItems.map((item, index) => (
          <SubMenuCard
            key={item.path}
            label={item.label}
            meta={item.meta}
            onClick={() => navigate(item.path)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function SubMenuCard({ label, meta, onClick, index = 0 }: any) {
  const Icon = meta.lucide;
  return (
    <button
      onClick={onClick}
      className="analyze-menu-card premium-card group relative flex min-h-[82px] w-full items-center gap-4 overflow-hidden p-4 text-left transition active:scale-[0.985]"
      style={{
        boxShadow: `0 16px 38px rgba(0,0,0,0.22), 0 0 24px ${meta.glow}`,
        animationDelay: `${index * 55 + 80}ms`,
      }}
    >
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full" style={{ backgroundColor: meta.accent }} />
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: meta.glow }} />
      <div className="analyze-menu-icon relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.026]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>
        <Icon size={21} strokeWidth={1.9} />
      </div>
      <div className="relative min-w-0 flex-1">
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2.2px]" style={{ color: meta.accent }}>{label}</span>
      </div>
      <div className="analyze-menu-chevron relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.045] text-[var(--text-dim)] group-active:text-[var(--gold)]">
        <ChevronRight size={18} strokeWidth={2.3} />
      </div>
    </button>
  );
}
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Activity, ShieldAlert, Hash, Gauge, Trophy, ChevronRight, Grid3X3 } from "lucide-react";
import AnalysisPage from "./AnalysisPageV3";

const MODE_META: any = {
  ai: { icon: "✦", lucide: Activity, accent: "#f3c14b", glow: "rgba(243, 193, 75, 0.10)" },
  bbfs: { icon: "▦", lucide: Grid3X3, accent: "#ff9f43", glow: "rgba(255, 159, 67, 0.10)" },
  mati: { icon: "×", lucide: ShieldAlert, accent: "#ff647c", glow: "rgba(255, 100, 124, 0.10)" },
  jumlah: { icon: "#", lucide: Hash, accent: "#14b8a6", glow: "rgba(20, 184, 166, 0.10)" },
  shio: { icon: "◎", lucide: Gauge, accent: "#28d7ff", glow: "rgba(40, 215, 255, 0.10)" },
  rekap: { icon: "◆", lucide: Trophy, accent: "#6ea8ff", glow: "rgba(110, 168, 255, 0.10)" },
};

export default function AnalyzeMenu() {
  return (
    <Routes>
      <Route index element={<AnalyzeList />} />
      <Route path="ai" element={<AnalysisWrapper type="ai" title="ANGKA IKUT" />} />
      <Route path="bbfs" element={<AnalysisWrapper type="bbfs" title="BBFS" />} />
      <Route path="mati" element={<AnalysisWrapper type="mati" title="ANGKA MATI" />} />
      <Route path="jumlah" element={<AnalysisWrapper type="jumlah" title="JUMLAH MATI" />} />
      <Route path="shio" element={<AnalysisWrapper type="shio" title="SHIO MATI" />} />
      <Route path="rekap" element={<AnalysisWrapper type="rekap" title="CUSTOM REKAP" />} />
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

  const fetchData = async () => {
    try {
      const res = await fetch("/api/markets");
      const allMarkets = await res.json();
      const mData = allMarkets.find((m: any) => m.id === marketId);
      if (mData?.name) setMarketName(mData.name);
    } catch {
      setMarketName(marketId || "MARKET");
    }
  };

  useEffect(() => { if (marketId) fetchData(); }, [marketId]);

  const analysisItems = [
    { label: "ANGKA IKUT", meta: MODE_META.ai, path: "ai" },
    { label: "BBFS", meta: MODE_META.bbfs, path: "bbfs" },
    { label: "ANGKA MATI", meta: MODE_META.mati, path: "mati" },
    { label: "JUMLAH MATI", meta: MODE_META.jumlah, path: "jumlah" },
    { label: "SHIO MATI", meta: MODE_META.shio, path: "shio" },
  ];

  const customItems = [
    { label: "CUSTOM REKAP", meta: MODE_META.rekap, path: "rekap" },
  ];

  return (
    <div className="analyze-menu-page pb-4">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="analyze-market-hero premium-panel relative mb-5 overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-[var(--cyan-dim)] blur-xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="relative rounded-[1.7rem] border border-white/10 bg-black/20 px-4 py-7 text-center sm:py-8">
          <h3 className="ui-font-display mx-auto max-w-[96%] break-words text-[25px] font-black uppercase leading-tight tracking-[4px] text-[var(--text)] sm:text-[31px]">
            {marketName}
          </h3>
        </div>
      </div>

      <div className="analyze-section-title mb-3 px-1">
        <p className="ui-font-display text-[10px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Pilih Analisa</p>
      </div>

      <div className="analyze-menu-grid grid grid-cols-1 gap-3">
        {analysisItems.map((item, index) => (
          <SubMenuCard
            key={item.path}
            label={item.label}
            meta={item.meta}
            onClick={() => navigate(item.path)}
            index={index}
          />
        ))}
      </div>

      <div className="analyze-section-title mb-3 mt-5 px-1">
        <p className="ui-font-display text-[10px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Racik Angka</p>
      </div>

      <div className="analyze-menu-grid grid grid-cols-1 gap-3">
        {customItems.map((item, index) => (
          <SubMenuCard
            key={item.path}
            label={item.label}
            meta={item.meta}
            onClick={() => navigate(item.path)}
            index={analysisItems.length + index}
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
      className="analyze-menu-card premium-card group relative flex min-h-[70px] w-full items-center gap-3 overflow-hidden px-4 py-3 text-left transition active:scale-[0.985]"
      style={{
        boxShadow: `0 14px 30px rgba(0,0,0,0.20), 0 0 14px ${meta.glow}`,
        animationDelay: `${index * 45 + 70}ms`,
      }}
    >
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full" style={{ backgroundColor: meta.accent }} />
      <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full blur-xl" style={{ backgroundColor: meta.glow }} />
      <div className="analyze-menu-icon relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.026]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>
        <Icon size={20} strokeWidth={1.9} />
      </div>
      <div className="relative min-w-0 flex-1">
        <span className="ui-font-display block text-[13px] font-black uppercase tracking-[2.2px]" style={{ color: meta.accent }}>{label}</span>
      </div>
      <div className="analyze-menu-chevron relative flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white/[0.045] text-[var(--text-dim)] group-active:text-[var(--gold)]">
        <ChevronRight size={17} strokeWidth={2.3} />
      </div>
    </button>
  );
}

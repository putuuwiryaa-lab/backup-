import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Activity, ShieldAlert, Hash, Gauge, Trophy, ChevronRight, Grid3X3 } from "lucide-react";
import AnalysisPage from "./AnalysisPageV3";

const MODE_META: any = {
  ai: { icon: "✦", lucide: Activity, accent: "#f3c14b", glow: "rgba(243, 193, 75, 0.10)" },
  bbfs: { icon: "▦", lucide: Grid3X3, accent: "#ff9f43", glow: "rgba(255, 159, 67, 0.10)" },
  mati: { icon: "×", lucide: ShieldAlert, accent: "#ff647c", glow: "rgba(255, 100, 124, 0.10)" },
  jumlah: { icon: "#", lucide: Hash, accent: "#b58cff", glow: "rgba(181, 140, 255, 0.10)" },
  shio: { icon: "◎", lucide: Gauge, accent: "#28d7ff", glow: "rgba(40, 215, 255, 0.10)" },
  rekap: { icon: "◆", lucide: Trophy, accent: "#6ea8ff", glow: "rgba(110, 168, 255, 0.12)", custom: true },
};

export default function AnalyzeMenu() {
  return (
    <Routes>
      <Route index element={<AnalyzeList />} />
      <Route path="ai" element={<AnalysisWrapper type="ai" title="ANGKA IKUT" />} />
      <Route path="bbfs" element={<AnalysisWrapper type="bbfs" title="BBFS" />} />
      <Route path="mati" element={<AnalysisWrapper type="mati" title="ANGKA MATI 4D" />} />
      <Route path="jumlah" element={<AnalysisWrapper type="jumlah" title="JUMLAH MATI 2D" />} />
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

  const menuItems = [
    { label: "ANGKA IKUT", meta: MODE_META.ai, path: "ai" },
    { label: "BBFS", meta: MODE_META.bbfs, path: "bbfs" },
    { label: "ANGKA MATI 4D", meta: MODE_META.mati, path: "mati" },
    { label: "JUMLAH MATI 2D", meta: MODE_META.jumlah, path: "jumlah" },
    { label: "SHIO MATI", meta: MODE_META.shio, path: "shio" },
    { label: "CUSTOM REKAP", meta: MODE_META.rekap, path: "rekap" },
  ];

  return (
    <div className="analyze-menu-page pb-4">
      <button onClick={() => navigate("/")} className="ghost-button mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] active:scale-95">
        <ArrowLeft size={16} /> Beranda
      </button>

      <div className="analyze-market-hero premium-panel relative mb-4 overflow-hidden p-4">
        <div className="absolute -right-10 -top-10 h-16 w-16 rounded-full bg-[var(--cyan-dim)] blur-xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="relative rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-center">
          <h3 className="mx-auto max-w-[94%] break-words font-['Orbitron'] text-[20px] font-black uppercase leading-tight tracking-[3.2px] text-[var(--text)] sm:text-[24px]">
            {marketName}
          </h3>
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
  const isCustom = Boolean(meta.custom);
  return (
    <button
      onClick={onClick}
      className={`analyze-menu-card premium-card group relative flex w-full items-center overflow-hidden text-left transition active:scale-[0.985] ${isCustom ? "min-h-[74px] gap-3 px-4 py-3.5" : "min-h-[70px] gap-3 px-4 py-3"}`}
      style={{
        boxShadow: isCustom ? `0 18px 42px rgba(0,0,0,0.24), inset 0 0 0 1px ${meta.accent}24, 0 0 18px ${meta.glow}` : `0 14px 30px rgba(0,0,0,0.20), 0 0 14px ${meta.glow}`,
        animationDelay: `${index * 45 + 70}ms`,
      }}
    >
      <div className={`absolute left-0 rounded-r-full ${isCustom ? "inset-y-4 w-1.5" : "inset-y-5 w-1"}`} style={{ backgroundColor: meta.accent }} />
      <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full blur-xl" style={{ backgroundColor: meta.glow }} />
      {isCustom && <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />}
      <div className={`analyze-menu-icon relative flex shrink-0 items-center justify-center rounded-2xl border bg-white/[0.026] ${isCustom ? "h-12 w-12" : "h-11 w-11"}`} style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>
        <Icon size={isCustom ? 21 : 20} strokeWidth={1.9} />
      </div>
      <div className="relative min-w-0 flex-1">
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2.2px]" style={{ color: meta.accent }}>{label}</span>
        {isCustom && <span className="mt-1 block text-[8px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">Gabungan & filter manual</span>}
      </div>
      <div className={`analyze-menu-chevron relative flex shrink-0 items-center justify-center rounded-2xl bg-white/[0.045] text-[var(--text-dim)] group-active:text-[var(--gold)] ${isCustom ? "h-9 w-9" : "h-8 w-8"}`}>
        <ChevronRight size={isCustom ? 18 : 17} strokeWidth={2.3} />
      </div>
    </button>
  );
}

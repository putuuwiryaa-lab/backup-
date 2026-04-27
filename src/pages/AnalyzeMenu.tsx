import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { RefreshCw, Cpu, ArrowLeft, Sparkles } from "lucide-react";
import AnalysisPage from "./AnalysisPageV2";

const MODE_META: any = {
  ai: { icon: "✦", accent: "#22C55E", bg: "rgba(34, 197, 94, 0.10)", border: "#14532D" },
  mati: { icon: "×", accent: "#EF4444", bg: "rgba(239, 68, 68, 0.10)", border: "#7F1D1D" },
  jumlah: { icon: "#", accent: "#A855F7", bg: "rgba(168, 85, 247, 0.11)", border: "#581C87" },
  shio: { icon: "◎", accent: "#06B6D4", bg: "rgba(6, 182, 212, 0.10)", border: "#164E63" },
  rekap: { icon: "◆", accent: "#3B82F6", bg: "rgba(59, 130, 246, 0.10)", border: "#1E3A8A" },
};

export default function AnalyzeMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAnalyzeRoute = location.pathname.startsWith("/analyze/");
    if (!isAnalyzeRoute) return;

    const marker = `guard:${location.pathname}`;
    if (history.state?.mobileBackGuard !== marker) {
      history.pushState({ ...(history.state || {}), mobileBackGuard: marker }, "", location.pathname + location.search + location.hash);
    }

    const handleBack = () => {
      const pathParts = location.pathname.split("/").filter(Boolean);
      const hasModeDetail = pathParts.length >= 3;

      if (hasModeDetail) {
        navigate(`/analyze/${pathParts[1]}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/markets");
      const allMarkets = await res.json();
      const mData = allMarkets.find((m: any) => m.id === marketId);

      if (mData) {
        if (mData.name) setMarketName(mData.name);
        const dataString = mData.history_data || "";
        const rawTokens = dataString.split(/[\s\n\r\t,]+/);
        const data = rawTokens.filter((token: string) => /^\d{4}$/.test(token));
        setLastResult(data.length > 0 ? data[data.length - 1] : "KOSONG");
      } else {
        setLastResult("KOSONG");
      }
    } catch {
      setLastResult("ERROR");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (marketId) fetchData();
  }, [marketId]);

  return (
    <div className="animate-[slideIn_0.22s_ease-out]">
      <div className="premium-panel relative mb-5 overflow-hidden p-5 text-center sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]"></div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">
          <Sparkles size={12} /> Market Selected
        </div>
        <h3 className="font-['Orbitron'] text-[26px] font-black tracking-[4px] text-[var(--text)] uppercase sm:text-[32px]">
          {marketName}
        </h3>

        <div className="mt-5 flex justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border2)] bg-[#111824]/80 p-2.5 px-4 shadow-inner">
            <span className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Last Result</span>
            <span className="font-['Orbitron'] text-[18px] font-black tracking-[2px] text-[var(--cyan)]">{lastResult}</span>
            <button onClick={fetchData} disabled={refreshing} className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-[var(--text-dim)] transition active:scale-95 disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] ring-1 ring-white/10">
          <Cpu size={12} className="text-[var(--cyan)]" /> Select Mode
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SubMenuCard label="ANGKA IKUT 2D" icon={MODE_META.ai.icon} meta={MODE_META.ai} onClick={() => navigate("ai")} />
        <SubMenuCard label="ANGKA MATI 4D" icon={MODE_META.mati.icon} meta={MODE_META.mati} onClick={() => navigate("mati")} />
        <SubMenuCard label="JUMLAH MATI 2D" icon={MODE_META.jumlah.icon} meta={MODE_META.jumlah} onClick={() => navigate("jumlah")} />
        <SubMenuCard label="SHIO MATI" icon={MODE_META.shio.icon} meta={MODE_META.shio} onClick={() => navigate("shio")} />
        <SubMenuCard label="MENU REKAP" icon={MODE_META.rekap.icon} meta={MODE_META.rekap} onClick={() => navigate("rekap")} wide />
      </div>

      <button onClick={() => navigate("/")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border2)] bg-[var(--card)] p-4 text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)] shadow-sm transition active:scale-95">
        <ArrowLeft size={16} /> Kembali ke Beranda
      </button>
    </div>
  );
}

function SubMenuCard({ label, icon, meta, onClick, wide }: any) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-h-[88px] w-full items-center gap-4 rounded-3xl border p-4 text-left transition active:scale-[0.985] ${wide ? "sm:col-span-2" : ""}`}
      style={{
        borderColor: meta.border,
        background: `linear-gradient(135deg, #101826 0%, ${meta.bg} 100%)`,
      }}
    >
      <div
        className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border font-['Orbitron'] text-[22px] font-black"
        style={{ borderColor: meta.accent, backgroundColor: meta.bg, color: meta.accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{label}</span>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-[var(--text-dim)] transition group-active:text-[var(--gold)]">〉</div>
    </button>
  );
}

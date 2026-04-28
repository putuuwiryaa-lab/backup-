import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { RefreshCw, Cpu, ArrowLeft, Sparkles } from "lucide-react";
import AnalysisPage from "./AnalysisPageV2";

const MODE_META: any = {
  ai: {
    icon: "✦",
    accent: "#22D3EE",
    glow: "rgba(34, 211, 238, 0.14)",
    subtitle: "Rekomendasi angka pendamping",
  },
  mati: {
    icon: "×",
    accent: "#FB7185",
    glow: "rgba(251, 113, 133, 0.13)",
    subtitle: "Filter angka berisiko",
  },
  jumlah: {
    icon: "#",
    accent: "#C084FC",
    glow: "rgba(192, 132, 252, 0.13)",
    subtitle: "Analisa jumlah rawan",
  },
  shio: {
    icon: "◎",
    accent: "#38BDF8",
    glow: "rgba(56, 189, 248, 0.13)",
    subtitle: "Filter shio rawan",
  },
  rekap: {
    icon: "◆",
    accent: "#F5C542",
    glow: "rgba(245, 197, 66, 0.15)",
    subtitle: "Invest dan top pilihan",
  },
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

      <div className="grid grid-cols-1 gap-3">
        <SubMenuCard label="ANGKA IKUT 2D" meta={MODE_META.ai} onClick={() => navigate("ai")} />
        <SubMenuCard label="ANGKA MATI 4D" meta={MODE_META.mati} onClick={() => navigate("mati")} />
        <SubMenuCard label="JUMLAH MATI 2D" meta={MODE_META.jumlah} onClick={() => navigate("jumlah")} />
        <SubMenuCard label="SHIO MATI" meta={MODE_META.shio} onClick={() => navigate("shio")} />
        <SubMenuCard label="MENU REKAP" meta={MODE_META.rekap} onClick={() => navigate("rekap")} />
      </div>

      <button onClick={() => navigate("/")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border2)] bg-[var(--card)] p-4 text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)] shadow-sm transition active:scale-95">
        <ArrowLeft size={16} /> Kembali ke Beranda
      </button>
    </div>
  );
}

function SubMenuCard({ label, meta, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="group relative flex min-h-[92px] w-full items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[#111824]/90 p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition active:scale-[0.985]"
      style={{
        boxShadow: `0 18px 45px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 34px ${meta.glow}`,
      }}
    >
      <div className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ backgroundColor: meta.accent }} />
      <div className="absolute right-[-42px] top-[-42px] h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: meta.glow }} />

      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.035] font-['Orbitron'] text-[21px] font-black"
        style={{ borderColor: `${meta.accent}70`, color: meta.accent }}
      >
        {meta.icon}
      </div>

      <div className="relative min-w-0 flex-1">
        <span className="block font-['Orbitron'] text-[12px] font-black uppercase tracking-[2.2px]" style={{ color: meta.accent }}>
          {label}
        </span>
        <span className="mt-1 block text-[11px] font-semibold tracking-[0.2px] text-[var(--text-dim)]">
          {meta.subtitle}
        </span>
      </div>

      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[16px] text-[var(--text-dim)] transition group-active:text-[var(--gold)]">
        ›
      </div>
    </button>
  );
}

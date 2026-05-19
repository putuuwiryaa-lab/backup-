import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import ParamSelector from "../components/analysis/ParamSelector";
import CustomDigitBuilder from "../components/analysis/CustomDigitBuilder";
import RekapResult from "../components/analysis/RekapResult";
import AnalysisResult from "../components/analysis/AnalysisResult";
import { typeMeta } from "../lib/analysis/constants";
import { buildCustomDigitLines, toNumberList } from "../lib/analysis/utils";

export default function AnalysisPageV3({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const [param, setParam] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [detailValidationOpen, setDetailValidationOpen] = useState(false);
  const [angkaJadiOpen, setAngkaJadiOpen] = useState(false);
  const [customAiDigit, setCustomAiDigit] = useState<2 | 4 | 6 | null>(null);
  const [customIncludeBBFS, setCustomIncludeBBFS] = useState(false);
  const [customOffKepalaCount, setCustomOffKepalaCount] = useState<number | null>(null);
  const [customOffEkorCount, setCustomOffEkorCount] = useState<number | null>(null);
  const [customOffJumlahCount, setCustomOffJumlahCount] = useState<number | null>(null);
  const [customOffShioCount, setCustomOffShioCount] = useState<number | null>(null);
  const meta = typeMeta[type] || typeMeta.ai;

  const resetBeforeAnalyze = () => {
    setLoading(true);
    setError("");
    setResult(null);
    setDetailValidationOpen(false);
    setAngkaJadiOpen(false);
  };

  const getMarketData = async () => {
    const resMarkets = await fetch("/api/markets");
    const allMarkets = await resMarkets.json();
    const currentMarket = allMarkets.find((m: any) => m.id === marketId);
    if (!currentMarket) throw new Error(`Data histori ${marketId} belum disetup oleh Admin!`);
    const data = String(currentMarket.history_data || "").split(/[\s\n\r\t,]+/).filter((token: string) => /^\d{4}$/.test(token));
    if (!data || data.length < 17) throw new Error("Data dari server kurang! Min 17 result.");
    return data;
  };

  const postAnalyze = async (analysisType: string, data: string[], analysisParam: number) => {
    const token = localStorage.getItem("supreme_token");
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: analysisType, data, param: analysisParam }),
    });
    const json = await res.json();
    if (json.success || json.data) return json.data || json;
    throw new Error(json.error || "Gagal memproses analisa");
  };

  const handleAnalyze = async (selectedParam: number) => {
    setParam(selectedParam);
    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      setResult(await postAnalyze(type, data, selectedParam));
    } catch (e: any) {
      setError(e.message || "Error koneksi server");
    }
    setLoading(false);
  };

  const handleCustomDigitGenerate = async () => {
    const hasAnyFilter = Boolean(customAiDigit || customIncludeBBFS || customOffKepalaCount || customOffEkorCount || customOffJumlahCount || customOffShioCount);
    if (!hasAnyFilter) {
      setError("Pilih minimal satu filter dulu.");
      return;
    }

    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      const aiData = customAiDigit ? await postAnalyze("ai", data, customAiDigit) : null;
      const bbfsData = customIncludeBBFS ? await postAnalyze("ai", data, 8) : null;
      const matiKepalaData = customOffKepalaCount ? await postAnalyze("mati", data, customOffKepalaCount) : null;
      const matiEkorData = customOffEkorCount ? await postAnalyze("mati", data, customOffEkorCount) : null;
      const jumlahData = customOffJumlahCount ? await postAnalyze("jumlah", data, customOffJumlahCount) : null;
      const shioData = customOffShioCount ? await postAnalyze("shio", data, customOffShioCount) : null;

      const ai = customAiDigit ? toNumberList(aiData?.result) : [];
      const bbfs = customIncludeBBFS ? toNumberList(bbfsData?.result) : [];
      const offKepala = customOffKepalaCount ? toNumberList(matiKepalaData?.KEPALA?.result) : [];
      const offEkor = customOffEkorCount ? toNumberList(matiEkorData?.EKOR?.result) : [];
      const offJumlah = customOffJumlahCount ? toNumberList(jumlahData?.result) : [];
      const offShio = customOffShioCount ? toNumberList(shioData?.result) : [];
      const lines = buildCustomDigitLines({ ai, bbfs, includeBBFS: customIncludeBBFS, offKepala, offEkor, offJumlah, offShio });

      setResult({ custom: true, ai, bbfs, includeBBFS: customIncludeBBFS, offKepala, offEkor, offJumlah, offShio, lines });
    } catch (e: any) {
      setError(e.message || "Gagal generate custom digit");
    }
    setLoading(false);
  };

  const isRekapCustom = type === "rekap" && param === 3;

  return (
    <div className={`analysis-mode-${type} animate-[fadeIn_0.35s_ease-out] pb-8`}>
      <button onClick={() => navigate(-1)} className="ghost-button mb-4 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] transition active:scale-95"><ArrowLeft size={16} /> Kembali</button>

      <div className="premium-panel relative mb-4 overflow-hidden p-5">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accent}20` }} />
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
        <div className="relative mb-4 flex items-center gap-3">
          <div className="flex h-15 w-15 items-center justify-center rounded-3xl border text-[24px] shadow-sm" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>{icon}</div>
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: meta.soft, color: meta.accent }}><Sparkles size={11} /> Prediction Mode</div>
            <h2 className="truncate font-['Orbitron'] text-[18px] font-black uppercase tracking-[4px] text-[var(--text)]">{title}</h2>
          </div>
        </div>
        <div className="relative rounded-3xl bg-black/25 p-4 text-center ring-1 ring-white/10"><span className="mr-3 text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Pasaran:</span><span className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[4px] text-[var(--text)]">{marketId}</span></div>
      </div>

      {!result && !loading && param !== 0 && !isRekapCustom && <button onClick={() => handleAnalyze(param || 1)} className="primary-button mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Mulai Analisa</button>}

      <ParamSelector
        type={type}
        param={param}
        meta={meta}
        onAnalyze={handleAnalyze}
        onCustomDigit={() => { setParam(3); setResult(null); setError(""); }}
      />

      <CustomDigitBuilder
        show={type === "rekap" && param === 3 && !result}
        meta={meta}
        customAiDigit={customAiDigit}
        setCustomAiDigit={setCustomAiDigit}
        customIncludeBBFS={customIncludeBBFS}
        setCustomIncludeBBFS={setCustomIncludeBBFS}
        customOffKepalaCount={customOffKepalaCount}
        setCustomOffKepalaCount={setCustomOffKepalaCount}
        customOffEkorCount={customOffEkorCount}
        setCustomOffEkorCount={setCustomOffEkorCount}
        customOffJumlahCount={customOffJumlahCount}
        setCustomOffJumlahCount={setCustomOffJumlahCount}
        customOffShioCount={customOffShioCount}
        setCustomOffShioCount={setCustomOffShioCount}
        onGenerate={handleCustomDigitGenerate}
      />

      {loading && <div className="premium-panel my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Memproses Analisa</div></div>}
      {error && <div className="my-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}

      {result && type === "rekap" && <RekapResult result={result} param={param} marketId={marketId} meta={meta} />}
      {result && type !== "rekap" && <AnalysisResult type={type} result={result} param={param} marketId={marketId} meta={meta} detailValidationOpen={detailValidationOpen} setDetailValidationOpen={setDetailValidationOpen} angkaJadiOpen={angkaJadiOpen} setAngkaJadiOpen={setAngkaJadiOpen} />}
    </div>
  );
}

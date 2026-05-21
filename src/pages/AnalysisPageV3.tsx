import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import ParamSelector from "../components/analysis/ParamSelector";
import CustomDigitBuilder from "../components/analysis/CustomDigitBuilder";
import RekapResult from "../components/analysis/RekapResult";
import AnalysisResult from "../components/analysis/AnalysisResult";
import { typeMeta } from "../lib/analysis/constants";
import { toNumberList } from "../lib/analysis/utils";
import { buildCustomDigitLines, CUSTOM_FOCUS_OPTIONS, customFocusLabel, customFocusPairs, customFocusSubtitle, type CustomFocus, type TargetPair } from "../lib/analysis/customDigit";

const TARGET_PAIR_OPTIONS: Array<{ key: TargetPair; title: string; subtitle: string }> = [
  { key: "depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
];

type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairCountMap = Partial<Record<TargetPair, number | null>>;
type PairBooleanMap = Partial<Record<TargetPair, boolean>>;

function TargetPairSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (pair: TargetPair) => void }) {
  return (
    <div className="premium-panel mt-4 p-4">
      <div className="mb-3 text-center text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Pilih Fokus 2D</div>
      <div className="space-y-2">
        {TARGET_PAIR_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            className="flex w-full items-center justify-between rounded-3xl border p-4 text-left transition active:scale-95"
            style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}
          >
            <span className="font-['Orbitron'] text-[14px] font-black uppercase tracking-[2px]">{option.title}</span>
            <span className="text-[10px] font-black uppercase tracking-[1.5px] opacity-80">{option.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RekapFocusSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (focus: CustomFocus) => void }) {
  const twoDOptions = CUSTOM_FOCUS_OPTIONS.filter((item) => ["depan", "tengah", "belakang"].includes(item.key));
  const fullOptions = CUSTOM_FOCUS_OPTIONS.filter((item) => ["3d", "4d"].includes(item.key));
  return (
    <div className="premium-panel mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Pilih Jenis Rekap</div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-dim)]">Pilih dulu jenis line yang mau dibuat.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {twoDOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="rounded-3xl border p-3 text-center transition active:scale-95"
            style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}
          >
            <span className="block font-['Orbitron'] text-[10px] font-black uppercase tracking-[1.5px]">{item.title}</span>
            <span className="mt-2 block text-[7px] font-black uppercase tracking-[0.8px] opacity-75">{item.subtitle}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {fullOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="w-full rounded-3xl border p-4 text-center transition active:scale-95"
            style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}
          >
            <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{item.title}</span>
            <span className="mt-2 block text-[8px] font-black uppercase tracking-[1px] opacity-75">{item.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function targetPairLabel(pair: TargetPair | null) {
  if (!pair) return "";
  const option = TARGET_PAIR_OPTIONS.find((item) => item.key === pair);
  return option ? `${option.title} · ${option.subtitle}` : "";
}

export default function AnalysisPageV3({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const needsTargetPair = ["ai", "jumlah", "shio"].includes(type);
  const [param, setParam] = useState<number | null>(type === "rekap" ? 3 : 0);
  const [targetPair, setTargetPair] = useState<TargetPair | null>(needsTargetPair ? null : "belakang");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [detailValidationOpen, setDetailValidationOpen] = useState(false);
  const [angkaJadiOpen, setAngkaJadiOpen] = useState(false);
  const [customFocus, setCustomFocus] = useState<CustomFocus | null>(type === "rekap" ? null : "belakang");
  const [customAiDigitByPair, setCustomAiDigitByPair] = useState<PairAiMap>({});
  const [customIncludeBBFSByPair, setCustomIncludeBBFSByPair] = useState<PairBooleanMap>({});
  const [customOffAsCount, setCustomOffAsCount] = useState<number | null>(null);
  const [customOffKopCount, setCustomOffKopCount] = useState<number | null>(null);
  const [customOffKepalaCount, setCustomOffKepalaCount] = useState<number | null>(null);
  const [customOffEkorCount, setCustomOffEkorCount] = useState<number | null>(null);
  const [customOffJumlahCountByPair, setCustomOffJumlahCountByPair] = useState<PairCountMap>({});
  const [customOffShioCountByPair, setCustomOffShioCountByPair] = useState<PairCountMap>({});
  const meta = typeMeta[type] || typeMeta.ai;

  const setCustomAiDigitForPair = (pair: TargetPair, value: 2 | 4 | 6 | null) => setCustomAiDigitByPair((prev) => ({ ...prev, [pair]: value }));
  const setCustomIncludeBBFSForPair = (pair: TargetPair, value: boolean) => setCustomIncludeBBFSByPair((prev) => ({ ...prev, [pair]: value }));
  const setCustomOffJumlahCountForPair = (pair: TargetPair, value: number | null) => setCustomOffJumlahCountByPair((prev) => ({ ...prev, [pair]: value }));
  const setCustomOffShioCountForPair = (pair: TargetPair, value: number | null) => setCustomOffShioCountByPair((prev) => ({ ...prev, [pair]: value }));

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

  const postAnalyze = async (analysisType: string, data: string[], analysisParam: number, analysisTargetPair: TargetPair = "belakang") => {
    const token = localStorage.getItem("supreme_token");
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: analysisType, data, param: analysisParam, target_pair: analysisTargetPair }),
    });
    const json = await res.json();
    if (json.success || json.data) return json.data || json;
    throw new Error(json.error || "Gagal memproses analisa");
  };

  const handleTargetPairSelect = (pair: TargetPair) => {
    setTargetPair(pair);
    setParam(0);
    setResult(null);
    setError("");
  };

  const handleTargetPairReset = () => {
    setTargetPair(null);
    setParam(0);
    setResult(null);
    setError("");
  };

  const handleCustomFocusReset = () => {
    setCustomFocus(null);
    setResult(null);
    setError("");
  };

  const handleBack = () => {
    if (loading) return;
    if (result) {
      setResult(null);
      setError("");
      return;
    }
    if (isRekapCustom && customFocus) {
      setCustomFocus(null);
      setError("");
      return;
    }
    if (needsTargetPair && targetPair) {
      setTargetPair(null);
      setParam(0);
      setError("");
      return;
    }
    navigate(-1);
  };

  const handleAnalyze = async (selectedParam: number) => {
    if (needsTargetPair && !targetPair) {
      setError("Pilih fokus 2D dulu.");
      return;
    }
    setParam(selectedParam);
    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      setResult(await postAnalyze(type, data, selectedParam, targetPair || "belakang"));
    } catch (e: any) {
      setError(e.message || "Error koneksi server");
    }
    setLoading(false);
  };

  const handleCustomDigitGenerate = async () => {
    if (!customFocus) {
      setError("Pilih jenis rekap dulu.");
      return;
    }
    const pairs = customFocusPairs(customFocus);
    const hasAnyPairFilter = pairs.some((pair) => customAiDigitByPair[pair] || customIncludeBBFSByPair[pair] || customOffJumlahCountByPair[pair] || customOffShioCountByPair[pair]);
    const hasAnyFilter = Boolean(hasAnyPairFilter || customOffAsCount || customOffKopCount || customOffKepalaCount || customOffEkorCount);
    if (!hasAnyFilter) {
      setError("Pilih minimal satu filter dulu.");
      return;
    }

    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      const aiByPair: Partial<Record<TargetPair, number[]>> = {};
      const bbfsByPair: Partial<Record<TargetPair, number[]>> = {};
      const jumlahByPair: Partial<Record<TargetPair, number[]>> = {};
      const shioByPair: Partial<Record<TargetPair, number[]>> = {};
      const matiCache: Partial<Record<number, any>> = {};

      for (const pair of pairs) {
        const aiDigit = customAiDigitByPair[pair];
        const useBBFS = Boolean(customIncludeBBFSByPair[pair]);
        const jumlahCount = customOffJumlahCountByPair[pair];
        const shioCount = customOffShioCountByPair[pair];
        if (aiDigit) aiByPair[pair] = toNumberList((await postAnalyze("ai", data, aiDigit, pair))?.result);
        if (useBBFS) bbfsByPair[pair] = toNumberList((await postAnalyze("ai", data, 8, pair))?.result);
        if (jumlahCount) jumlahByPair[pair] = toNumberList((await postAnalyze("jumlah", data, jumlahCount, pair))?.result);
        if (shioCount) shioByPair[pair] = toNumberList((await postAnalyze("shio", data, shioCount, pair))?.result);
      }

      const getMati = async (count: number | null) => {
        if (!count) return null;
        if (!matiCache[count]) matiCache[count] = await postAnalyze("mati", data, count);
        return matiCache[count];
      };

      const matiAsData = await getMati(customOffAsCount);
      const matiKopData = await getMati(customOffKopCount);
      const matiKepalaData = await getMati(customOffKepalaCount);
      const matiEkorData = await getMati(customOffEkorCount);
      const offAs = customOffAsCount ? toNumberList(matiAsData?.AS?.result) : [];
      const offKop = customOffKopCount ? toNumberList(matiKopData?.KOP?.result) : [];
      const offKepala = customOffKepalaCount ? toNumberList(matiKepalaData?.KEPALA?.result) : [];
      const offEkor = customOffEkorCount ? toNumberList(matiEkorData?.EKOR?.result) : [];
      const lines = buildCustomDigitLines({ focus: customFocus, aiByPair, bbfsByPair, offAs, offKop, offKepala, offEkor, jumlahByPair, shioByPair });

      setResult({ custom: true, customFocus, aiByPair, bbfsByPair, customIncludeBBFSByPair, offAs, offKop, offKepala, offEkor, jumlahByPair, shioByPair, lines });
    } catch (e: any) {
      setError(e.message || "Gagal generate custom digit");
    }
    setLoading(false);
  };

  const isRekapCustom = type === "rekap" && param === 3;
  const showRekapFocusSelector = isRekapCustom && !customFocus && !result && !loading;
  const showCustomDigitBuilder = isRekapCustom && Boolean(customFocus) && !result;
  const showTargetPairSelector = needsTargetPair && !targetPair && !result && !loading;
  const showParamSelector = !showTargetPairSelector && !showRekapFocusSelector;

  return (
    <div className={`analysis-mode-${type} animate-[fadeIn_0.35s_ease-out] pb-8`}>
      <button onClick={handleBack} className="ghost-button mb-4 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] transition active:scale-95"><ArrowLeft size={16} /> Kembali</button>

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
        {needsTargetPair && targetPair && <div className="relative mt-3 flex items-center justify-between gap-3 rounded-3xl bg-black/20 p-3 ring-1 ring-white/10"><div className="min-w-0 text-left"><span className="mr-2 text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Fokus:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{targetPairLabel(targetPair)}</span></div><button type="button" onClick={handleTargetPairReset} className="shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px] transition active:scale-95" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
        {isRekapCustom && customFocus && <div className="relative mt-3 flex items-center justify-between gap-3 rounded-3xl bg-black/20 p-3 ring-1 ring-white/10"><div className="min-w-0 text-left"><span className="mr-2 text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Rekap:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{customFocusLabel(customFocus)} · {customFocusSubtitle(customFocus)}</span></div><button type="button" onClick={handleCustomFocusReset} className="shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px] transition active:scale-95" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
      </div>

      {!result && !loading && param !== 0 && !isRekapCustom && <button onClick={() => handleAnalyze(param || 1)} className="primary-button mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Mulai Analisa</button>}

      {showTargetPairSelector && <TargetPairSelector meta={meta} onSelect={handleTargetPairSelect} />}
      {showRekapFocusSelector && <RekapFocusSelector meta={meta} onSelect={(focus) => { setCustomFocus(focus); setError(""); }} />}

      {showParamSelector && <ParamSelector
        type={type}
        param={param}
        meta={meta}
        onAnalyze={handleAnalyze}
        onCustomDigit={() => { setParam(3); setResult(null); setError(""); }}
      />}

      {customFocus && <CustomDigitBuilder
        show={showCustomDigitBuilder}
        marketId={marketId}
        meta={meta}
        customFocus={customFocus}
        customAiDigitByPair={customAiDigitByPair}
        setCustomAiDigitForPair={setCustomAiDigitForPair}
        customIncludeBBFSByPair={customIncludeBBFSByPair}
        setCustomIncludeBBFSForPair={setCustomIncludeBBFSForPair}
        customOffAsCount={customOffAsCount}
        setCustomOffAsCount={setCustomOffAsCount}
        customOffKopCount={customOffKopCount}
        setCustomOffKopCount={setCustomOffKopCount}
        customOffKepalaCount={customOffKepalaCount}
        setCustomOffKepalaCount={setCustomOffKepalaCount}
        customOffEkorCount={customOffEkorCount}
        setCustomOffEkorCount={setCustomOffEkorCount}
        customOffJumlahCountByPair={customOffJumlahCountByPair}
        setCustomOffJumlahCountForPair={setCustomOffJumlahCountForPair}
        customOffShioCountByPair={customOffShioCountByPair}
        setCustomOffShioCountForPair={setCustomOffShioCountForPair}
        onGenerate={handleCustomDigitGenerate}
      />}

      {loading && <div className="premium-panel my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Memproses Analisa</div></div>}
      {error && <div className="my-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}

      {result && type === "rekap" && <RekapResult result={result} param={param} marketId={marketId} meta={meta} />}
      {result && type !== "rekap" && <AnalysisResult type={type} result={result} param={param} marketId={marketId} meta={meta} targetPair={targetPair || "belakang"} detailValidationOpen={detailValidationOpen} setDetailValidationOpen={setDetailValidationOpen} angkaJadiOpen={angkaJadiOpen} setAngkaJadiOpen={setAngkaJadiOpen} />}
    </div>
  );
}

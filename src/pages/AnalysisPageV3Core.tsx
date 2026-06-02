import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import ParamSelector from "../components/analysis/ParamSelector";
import CustomDigitBuilder from "../components/analysis/CustomDigitBuilder";
import RekapResult from "../components/analysis/RekapResult";
import AnalysisResult from "../components/analysis/AnalysisResult";
import { useStepBackNavigation } from "../hooks/useStepBackNavigation";
import { typeMeta } from "../lib/analysis/constants";
import { toNumberList } from "../lib/analysis/utils";
import {
  buildCustomDigitLines,
  bbfsScopeToTargetPair,
  customFocusLabel,
  customFocusPairs,
  customFocusSubtitle,
  customFocusToBBFSScope,
  type BBFSAnalysisScope,
  type CustomFocus,
  type TargetPair,
} from "../lib/analysis/customDigit";
import {
  AIScopeSelector,
  BBFSScopeSelector,
  RekapFocusSelector,
  TargetPairSelector,
  BBFS_SCOPE_OPTIONS,
  analysisScopeLabel,
  targetPairLabel,
  type AnalysisScope,
} from "../components/analysis/ScopeSelectors";

const VALID_TARGET_PAIRS: TargetPair[] = ["depan", "tengah", "belakang"];

type BBFSDigit = 7 | 8 | 9;
type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairBoolMap = Partial<Record<TargetPair, boolean>>;
type PairCountMap = Partial<Record<TargetPair, number | null>>;

function parseTargetPair(value: string | null): TargetPair {
  return VALID_TARGET_PAIRS.includes(value as TargetPair) ? (value as TargetPair) : "belakang";
}

function parseAnalysisScope(value: string | null): AnalysisScope {
  return BBFS_SCOPE_OPTIONS.some((item) => item.key === value) ? (value as AnalysisScope) : "default";
}

function targetPairFromScope(scope: AnalysisScope): TargetPair {
  if (scope === "default") return "belakang";
  return bbfsScopeToTargetPair(scope);
}

export default function AnalysisPageV3Core({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoStartedRef = useRef(false);
  const isAI = type === "ai";
  const needsTargetPair = ["jumlah", "shio"].includes(type);
  const isBBFS = type === "bbfs";
  const autoMode = searchParams.get("auto") === "1";
  const autoParam = Number(searchParams.get("param"));
  const autoTargetPair = parseTargetPair(searchParams.get("target_pair"));
  const autoAnalysisScope = parseAnalysisScope(searchParams.get("analysis_scope"));
  const initialParam = autoMode && Number.isFinite(autoParam) && autoParam > 0 ? autoParam : type === "rekap" ? 3 : 0;

  const [param, setParam] = useState<number | null>(initialParam);
  const [targetPair, setTargetPair] = useState<TargetPair | null>(needsTargetPair ? (autoMode ? autoTargetPair : null) : "belakang");
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope | null>(isBBFS ? (autoMode ? autoAnalysisScope : null) : isAI ? (autoMode ? autoAnalysisScope : null) : "default");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [detailValidationOpen, setDetailValidationOpen] = useState(false);
  const [angkaJadiOpen, setAngkaJadiOpen] = useState(false);
  const [customFocus, setCustomFocus] = useState<CustomFocus | null>(type === "rekap" ? null : "belakang");
  const [customAiDigitByPair, setCustomAiDigitByPair] = useState<PairAiMap>({});
  const [customAiParityByPair, setCustomAiParityByPair] = useState<PairBoolMap>({});
  const [customAiSizeByPair, setCustomAiSizeByPair] = useState<PairBoolMap>({});
  const [customBBFSDigit, setCustomBBFSDigit] = useState<BBFSDigit | null>(null);
  const [customOffAsCount, setCustomOffAsCount] = useState<number | null>(null);
  const [customOffKopCount, setCustomOffKopCount] = useState<number | null>(null);
  const [customOffKepalaCount, setCustomOffKepalaCount] = useState<number | null>(null);
  const [customOffEkorCount, setCustomOffEkorCount] = useState<number | null>(null);
  const [customOffJumlahCountByPair, setCustomOffJumlahCountByPair] = useState<PairCountMap>({});
  const [customOffShioCountByPair, setCustomOffShioCountByPair] = useState<PairCountMap>({});
  const meta = typeMeta[type] || typeMeta.ai;
  const isRekapCustom = type === "rekap" && param === 3;

  const setCustomAiDigitForPair = (pair: TargetPair, value: 2 | 4 | 6 | null) => setCustomAiDigitByPair((prev) => ({ ...prev, [pair]: value }));
  const setCustomAiParityForPair = (pair: TargetPair, value: boolean) => setCustomAiParityByPair((prev) => ({ ...prev, [pair]: value }));
  const setCustomAiSizeForPair = (pair: TargetPair, value: boolean) => setCustomAiSizeByPair((prev) => ({ ...prev, [pair]: value }));
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

  const postAnalyze = async (analysisType: string, data: string[], analysisParam: number, analysisTargetPair: TargetPair = "belakang", scope: AnalysisScope = "default") => {
    const token = localStorage.getItem("supreme_token");
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: analysisType, data, param: analysisParam, target_pair: analysisTargetPair, analysis_scope: scope }),
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

  const handleBBFSScopeSelect = (scope: Exclude<AnalysisScope, "default">) => {
    setAnalysisScope(scope);
    setTargetPair(targetPairFromScope(scope));
    setParam(0);
    setResult(null);
    setError("");
  };

  const handleAIScopeSelect = (scope: Exclude<AnalysisScope, "default">) => {
    setAnalysisScope(scope);
    setTargetPair(targetPairFromScope(scope));
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

  const handleBBFSScopeReset = () => {
    setAnalysisScope(null);
    setParam(0);
    setResult(null);
    setError("");
  };

  const handleAIScopeReset = () => {
    setAnalysisScope(null);
    setParam(0);
    setResult(null);
    setError("");
  };

  const handleCustomFocusReset = () => {
    setCustomFocus(null);
    setCustomBBFSDigit(null);
    setResult(null);
    setError("");
  };

  const stepBack = () => {
    if (loading) return true;
    if (result) {
      setResult(null);
      setError("");
      if (needsTargetPair) {
        setTargetPair(null);
        setParam(0);
      }
      if (isAI) {
        setAnalysisScope(null);
        setParam(0);
      }
      if (isBBFS) {
        setAnalysisScope(null);
        setParam(0);
      }
      if (isRekapCustom) setCustomFocus(null);
      return true;
    }
    if (isRekapCustom && customFocus) {
      setCustomFocus(null);
      setError("");
      return true;
    }
    if (isAI && analysisScope) {
      setAnalysisScope(null);
      setParam(0);
      setError("");
      return true;
    }
    if (isBBFS && analysisScope) {
      setAnalysisScope(null);
      setParam(0);
      setError("");
      return true;
    }
    if (needsTargetPair && targetPair) {
      setTargetPair(null);
      setParam(0);
      setError("");
      return true;
    }
    return false;
  };

  const canStepBack = Boolean(result || loading || (isRekapCustom && customFocus) || (isAI && analysisScope) || (isBBFS && analysisScope) || (needsTargetPair && targetPair));
  useStepBackNavigation(canStepBack, stepBack);

  const handleBack = () => {
    if (!stepBack()) navigate(-1);
  };

  const handleAnalyze = async (selectedParam: number, selectedTargetPair?: TargetPair) => {
    const finalScope = analysisScope || "default";
    if (isAI && !analysisScope) {
      setError("Pilih jenis Angka Ikut dulu.");
      return;
    }
    if (isBBFS && finalScope === "default") {
      setError("Pilih jenis BBFS dulu.");
      return;
    }
    const finalTargetPair = isBBFS || isAI ? targetPairFromScope(finalScope) : selectedTargetPair || targetPair || "belakang";
    if (needsTargetPair && !finalTargetPair) {
      setError("Pilih fokus 2D dulu.");
      return;
    }
    setTargetPair(finalTargetPair);
    setParam(selectedParam);
    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      setResult(await postAnalyze(type, data, selectedParam, finalTargetPair, finalScope));
      setDetailValidationOpen(false);
    } catch (e: any) {
      setError(e.message || "Error koneksi server");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!autoMode || autoStartedRef.current || type === "rekap") return;
    if (!Number.isFinite(autoParam) || autoParam <= 0) return;
    autoStartedRef.current = true;
    handleAnalyze(autoParam, autoTargetPair);
  }, [autoMode, autoParam, autoTargetPair, type]);

  const handleCustomDigitGenerate = async () => {
    if (!customFocus) {
      setError("Pilih jenis rekap dulu.");
      return;
    }
    const pairs = customFocusPairs(customFocus);
    const hasAnyPairFilter = pairs.some((pair) => customAiDigitByPair[pair] || customAiParityByPair[pair] || customAiSizeByPair[pair] || customOffJumlahCountByPair[pair] || customOffShioCountByPair[pair]);
    const hasAnyFilter = Boolean(hasAnyPairFilter || customBBFSDigit || customOffAsCount || customOffKopCount || customOffKepalaCount || customOffEkorCount);
    if (!hasAnyFilter) {
      setError("Pilih minimal satu filter dulu.");
      return;
    }
    resetBeforeAnalyze();
    try {
      const data = await getMarketData();
      const aiByPair: Partial<Record<TargetPair, number[]>> = {};
      const aiParityByPair: Partial<Record<TargetPair, string>> = {};
      const aiSizeByPair: Partial<Record<TargetPair, string>> = {};
      const jumlahByPair: Partial<Record<TargetPair, number[]>> = {};
      const shioByPair: Partial<Record<TargetPair, number[]>> = {};
      const matiCache: Partial<Record<number, any>> = {};
      let bbfsGlobal: number[] = [];

      for (const pair of pairs) {
        const aiDigit = customAiDigitByPair[pair];
        const jumlahCount = customOffJumlahCountByPair[pair];
        const shioCount = customOffShioCountByPair[pair];
        if (aiDigit) aiByPair[pair] = toNumberList((await postAnalyze("ai", data, aiDigit, pair))?.result);
        if (customAiParityByPair[pair]) {
          const rawResult = (await postAnalyze("ai", data, 7, pair))?.result;
          const value = Array.isArray(rawResult) ? rawResult[0] : rawResult;
          aiParityByPair[pair] = String(value || "").trim().toUpperCase();
        }
        if (customAiSizeByPair[pair]) {
          const rawResult = (await postAnalyze("ai", data, 8, pair))?.result;
          const value = Array.isArray(rawResult) ? rawResult[0] : rawResult;
          aiSizeByPair[pair] = String(value || "").trim().toUpperCase();
        }
        if (jumlahCount) jumlahByPair[pair] = toNumberList((await postAnalyze("jumlah", data, jumlahCount, pair))?.result);
        if (shioCount) shioByPair[pair] = toNumberList((await postAnalyze("shio", data, shioCount, pair))?.result);
      }

      if (customBBFSDigit) {
        const bbfsScope = customFocusToBBFSScope(customFocus);
        const bbfsTargetPair = bbfsScopeToTargetPair(bbfsScope);
        bbfsGlobal = toNumberList((await postAnalyze("bbfs", data, customBBFSDigit, bbfsTargetPair, bbfsScope))?.result);
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
      const lines = buildCustomDigitLines({ focus: customFocus, aiByPair, aiParityByPair, aiSizeByPair, bbfsGlobal, offAs, offKop, offKepala, offEkor, jumlahByPair, shioByPair });
      setResult({
        lines,
        focus: customFocus,
        customFocus,
        aiByPair,
        aiParityByPair,
        aiSizeByPair,
        bbfsGlobal,
        offAs,
        offKop,
        offKepala,
        offEkor,
        jumlahByPair,
        shioByPair,
        selectedFilters: {
          aiDigitByPair: customAiDigitByPair,
          aiParityEnabledByPair: customAiParityByPair,
          aiSizeEnabledByPair: customAiSizeByPair,
          aiParityByPair,
          aiSizeByPair,
          bbfsDigit: customBBFSDigit,
          offCounts: { as: customOffAsCount, kop: customOffKopCount, kepala: customOffKepalaCount, ekor: customOffEkorCount },
          jumlahCountByPair: customOffJumlahCountByPair,
          shioCountByPair: customOffShioCountByPair,
        },
      });
    } catch (e: any) {
      setError(e.message || "Gagal generate custom digit");
    }
    setLoading(false);
  };

  const showRekapFocusSelector = isRekapCustom && !customFocus && !result && !loading;
  const showCustomDigitBuilder = isRekapCustom && Boolean(customFocus) && !result;
  const showAIScopeSelector = isAI && !analysisScope && !result && !loading;
  const showTargetPairSelector = needsTargetPair && !targetPair && !result && !loading;
  const showBBFSScopeSelector = isBBFS && !analysisScope && !result && !loading;
  const showParamSelector = !showAIScopeSelector && !showTargetPairSelector && !showBBFSScopeSelector && !showRekapFocusSelector;

  return (
    <div className={`analysis-mode-${type} ui-motion-in pb-8`}>
      <button onClick={handleBack} className="ghost-button ui-motion-soft ui-tap mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--ui-text-muted)]"><ArrowLeft size={16} /> Kembali</button>

      <div className="ui-panel ui-motion-in relative mb-4 overflow-hidden p-4">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accent}18` }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
        <div className="relative mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.028] text-[18px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[1.8px]" style={{ backgroundColor: meta.soft, color: meta.accent }}><Sparkles size={10} /> Mode Analisa</div>
            <h2 className="truncate font-['Orbitron'] text-[16px] font-black uppercase tracking-[3px] text-[var(--ui-text)]">{title}</h2>
          </div>
        </div>
        <div className="ui-card relative flex min-h-[78px] items-center justify-center rounded-2xl px-4 py-4 text-center">
          <p className="break-words font-['Orbitron'] text-[24px] font-black uppercase leading-tight tracking-[4px] text-[var(--ui-text)] sm:text-[28px]">{marketId}</p>
        </div>
        {isAI && analysisScope && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">AI:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{analysisScopeLabel(analysisScope)}</span></div><button type="button" onClick={handleAIScopeReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
        {needsTargetPair && targetPair && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">Fokus:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{targetPairLabel(targetPair)}</span></div><button type="button" onClick={handleTargetPairReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
        {isBBFS && analysisScope && analysisScope !== "default" && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">BBFS:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{analysisScopeLabel(analysisScope)}</span></div><button type="button" onClick={handleBBFSScopeReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
        {isRekapCustom && customFocus && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">Rekap:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{customFocusLabel(customFocus)} · {customFocusSubtitle(customFocus)}</span></div><button type="button" onClick={handleCustomFocusReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
      </div>

      {!result && !loading && param !== 0 && !isRekapCustom && !autoMode && <button onClick={() => handleAnalyze(param || 1)} className="primary-button ui-motion-soft ui-tap mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px]"><RefreshCw size={18} /> Mulai Analisa</button>}
      {showAIScopeSelector && <AIScopeSelector meta={meta} onSelect={handleAIScopeSelect} />}
      {showTargetPairSelector && <TargetPairSelector meta={meta} onSelect={handleTargetPairSelect} />}
      {showBBFSScopeSelector && <BBFSScopeSelector meta={meta} onSelect={handleBBFSScopeSelect} />}
      {showRekapFocusSelector && <RekapFocusSelector meta={meta} onSelect={(focus) => { setCustomFocus(focus); setCustomBBFSDigit(null); setError(""); }} />}
      {showParamSelector && !autoMode && <ParamSelector type={type} param={param} meta={meta} analysisScope={analysisScope || "default"} onAnalyze={handleAnalyze} onCustomDigit={() => { setParam(3); setResult(null); setError(""); }} />}
      {customFocus && <CustomDigitBuilder show={showCustomDigitBuilder} marketId={marketId} meta={meta} customFocus={customFocus} customAiDigitByPair={customAiDigitByPair} setCustomAiDigitForPair={setCustomAiDigitForPair} customAiParityByPair={customAiParityByPair} setCustomAiParityForPair={setCustomAiParityForPair} customAiSizeByPair={customAiSizeByPair} setCustomAiSizeForPair={setCustomAiSizeForPair} customBBFSDigit={customBBFSDigit} setCustomBBFSDigit={setCustomBBFSDigit} customOffAsCount={customOffAsCount} setCustomOffAsCount={setCustomOffAsCount} customOffKopCount={customOffKopCount} setCustomOffKopCount={setCustomOffKopCount} customOffKepalaCount={customOffKepalaCount} setCustomOffKepalaCount={setCustomOffKepalaCount} customOffEkorCount={customOffEkorCount} setCustomOffEkorCount={setCustomOffEkorCount} customOffJumlahCountByPair={customOffJumlahCountByPair} setCustomOffJumlahCountForPair={setCustomOffJumlahCountForPair} customOffShioCountByPair={customOffShioCountByPair} setCustomOffShioCountForPair={setCustomOffShioCountForPair} onGenerate={handleCustomDigitGenerate} />}
      {loading && <div className="ui-panel ui-motion-in my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px]">Memproses Analisa</div></div>}
      {error && <div className="ui-note ui-motion-in my-4 border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}
      {result && type === "rekap" && <RekapResult result={result} param={param} marketId={marketId} meta={meta} />}
      {result && type !== "rekap" && <AnalysisResult type={type} result={result} param={param} marketId={marketId} meta={meta} targetPair={targetPair || "belakang"} analysisScope={analysisScope || "default"} detailValidationOpen={detailValidationOpen} setDetailValidationOpen={setDetailValidationOpen} angkaJadiOpen={angkaJadiOpen} setAngkaJadiOpen={setAngkaJadiOpen} />}
    </div>
  );
}

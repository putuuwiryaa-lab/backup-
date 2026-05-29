import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import ParamSelector from "../components/analysis/ParamSelector";
import CustomDigitBuilder from "../components/analysis/CustomDigitBuilder";
import RekapResult from "../components/analysis/RekapResult";
import AnalysisResult from "../components/analysis/AnalysisResult";
import { useStepBackNavigation } from "../hooks/useStepBackNavigation";
import { typeMeta } from "../lib/analysis/constants";
import { toNumberList } from "../lib/analysis/utils";
import { buildCustomDigitLines, CUSTOM_FOCUS_OPTIONS, customFocusLabel, customFocusPairs, customFocusSubtitle, type CustomFocus, type TargetPair } from "../lib/analysis/customDigit";
import { presetAiMap, presetBooleanMap, presetCountMap, readRekapWatchPreset } from "../lib/analysis/rekapWatchPreset";

const TARGET_PAIR_OPTIONS: Array<{ key: TargetPair; title: string; subtitle: string }> = [
  { key: "depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
];

type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairCountMap = Partial<Record<TargetPair, number | null>>;
type PairBooleanMap = Partial<Record<TargetPair, boolean>>;

function hasPendingRekapPreset(marketId: string, type: string) {
  if (type !== "rekap") return false;
  try {
    const raw = sessionStorage.getItem("supreme_rekap_watch_preset");
    if (!raw) return false;
    const preset = JSON.parse(raw);
    return preset?.market_id === marketId;
  } catch {
    return false;
  }
}

function TargetPairSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (pair: TargetPair) => void }) {
  return (
    <div className="ui-panel ui-motion-in mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="ui-title text-[11px]" style={{ color: meta.accent }}>Pilih Fokus 2D</div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--ui-text-muted)]">Pilih posisi angka yang mau dianalisa.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {TARGET_PAIR_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            className="ui-motion-soft ui-tap ui-lift min-h-[76px] w-full rounded-3xl border px-5 py-4 text-center"
            style={{ borderColor: `${meta.accent}77`, backgroundColor: meta.soft, color: meta.accent }}
          >
            <span className="block font-['Orbitron'] text-[15px] font-black uppercase tracking-[2.2px]">{option.title}</span>
            <span className="mt-3 block text-[10px] font-black uppercase tracking-[1.4px] opacity-80">{option.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RekapFocusSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (focus: CustomFocus) => void }) {
  return (
    <div className="ui-panel ui-motion-in mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="ui-title text-[11px]" style={{ color: meta.accent }}>Pilih Jenis Rekap</div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--ui-text-muted)]">Pilih dulu jenis line yang mau dibuat.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {CUSTOM_FOCUS_OPTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="ui-motion-soft ui-tap ui-lift min-h-[76px] w-full rounded-3xl border px-5 py-4 text-center"
            style={{ borderColor: `${meta.accent}77`, backgroundColor: meta.soft, color: meta.accent }}
          >
            <span className="block font-['Orbitron'] text-[15px] font-black uppercase tracking-[2.2px]">{item.title}</span>
            <span className="mt-3 block text-[10px] font-black uppercase tracking-[1.4px] opacity-80">{item.subtitle}</span>
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
  const [loading, setLoading] = useState(() => hasPendingRekapPreset(marketId, type));
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
  const [returnToWatch, setReturnToWatch] = useState(false);
  const meta = typeMeta[type] || typeMeta.ai;
  const isRekapCustom = type === "rekap" && param === 3;

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

  const generateCustomDigitFromPreset = async (focus: CustomFocus, filters: any) => {
    const aiPreset = presetAiMap(filters);
    const bbfsPreset = presetBooleanMap(filters);
    const jumlahPreset = presetCountMap(filters?.jumlahByPair);
    const shioPreset = presetCountMap(filters?.shioByPair);
    const offAsCount = filters?.offAs ? Number(filters.offAs) : null;
    const offKopCount = filters?.offKop ? Number(filters.offKop) : null;
    const offKepalaCount = filters?.offKepala ? Number(filters.offKepala) : null;
    const offEkorCount = filters?.offEkor ? Number(filters.offEkor) : null;

    setParam(3);
    setCustomFocus(focus);
    setCustomAiDigitByPair(aiPreset);
    setCustomIncludeBBFSByPair(bbfsPreset);
    setCustomOffJumlahCountByPair(jumlahPreset);
    setCustomOffShioCountByPair(shioPreset);
    setCustomOffAsCount(offAsCount);
    setCustomOffKopCount(offKopCount);
    setCustomOffKepalaCount(offKepalaCount);
    setCustomOffEkorCount(offEkorCount);

    resetBeforeAnalyze();
    try {
      const pairs = customFocusPairs(focus);
      const hasAnyPairFilter = pairs.some((pair) => aiPreset[pair] || bbfsPreset[pair] || jumlahPreset[pair] || shioPreset[pair]);
      const hasAnyFilter = Boolean(hasAnyPairFilter || offAsCount || offKopCount || offKepalaCount || offEkorCount);
      if (!hasAnyFilter) throw new Error("Belum ada filter rekap dari pantauan.");

      const data = await getMarketData();
      const aiByPair: Partial<Record<TargetPair, number[]>> = {};
      const bbfsByPair: Partial<Record<TargetPair, number[]>> = {};
      const jumlahByPair: Partial<Record<TargetPair, number[]>> = {};
      const shioByPair: Partial<Record<TargetPair, number[]>> = {};
      const matiCache: Partial<Record<number, any>> = {};

      for (const pair of pairs) {
        const aiDigit = aiPreset[pair];
        const useBBFS = Boolean(bbfsPreset[pair]);
        const jumlahCount = jumlahPreset[pair];
        const shioCount = shioPreset[pair];
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

      const matiAsData = await getMati(offAsCount);
      const matiKopData = await getMati(offKopCount);
      const matiKepalaData = await getMati(offKepalaCount);
      const matiEkorData = await getMati(offEkorCount);
      const offAs = offAsCount ? toNumberList(matiAsData?.AS?.result) : [];
      const offKop = offKopCount ? toNumberList(matiKopData?.KOP?.result) : [];
      const offKepala = offKepalaCount ? toNumberList(matiKepalaData?.KEPALA?.result) : [];
      const offEkor = offEkorCount ? toNumberList(matiEkorData?.EKOR?.result) : [];
      const lines = buildCustomDigitLines({ focus, aiByPair, bbfsByPair, offAs, offKop, offKepala, offEkor, jumlahByPair, shioByPair });

      setResult({ custom: true, customFocus: focus, aiByPair, bbfsByPair, customIncludeBBFSByPair: bbfsPreset, offAs, offKop, offKepala, offEkor, jumlahByPair, shioByPair, lines });
    } catch (e: any) {
      setError(e.message || "Gagal generate custom digit");
    }
    setLoading(false);
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

  const stepBack = () => {
    if (loading) {
      if (returnToWatch) navigate("/pantauan-rekap", { replace: true });
      return true;
    }
    if (result) {
      if (returnToWatch && type === "rekap") {
        navigate("/pantauan-rekap", { replace: true });
        return true;
      }
      setResult(null);
      setError("");
      if (needsTargetPair) {
        setTargetPair(null);
        setParam(0);
      }
      if (isRekapCustom) {
        setCustomFocus(null);
      }
      return true;
    }
    if (isRekapCustom && customFocus) {
      setCustomFocus(null);
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

  const canStepBack = Boolean(result || loading || (isRekapCustom && customFocus) || (needsTargetPair && targetPair));

  useStepBackNavigation(canStepBack, stepBack);

  const handleBack = () => {
    if (!stepBack()) navigate(-1);
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

  useEffect(() => {
    if (type !== "rekap") return;
    const preset = readRekapWatchPreset(marketId);
    if (!preset) return;
    setReturnToWatch(true);
    generateCustomDigitFromPreset((preset.focus || "belakang") as CustomFocus, preset.filters || {});
  }, [type, marketId]);

  const hideRekapControls = Boolean(returnToWatch && !result);
  const showRekapFocusSelector = !hideRekapControls && isRekapCustom && !customFocus && !result && !loading;
  const showCustomDigitBuilder = !hideRekapControls && isRekapCustom && Boolean(customFocus) && !result;
  const showTargetPairSelector = !hideRekapControls && needsTargetPair && !targetPair && !result && !loading;
  const showParamSelector = !hideRekapControls && !showTargetPairSelector && !showRekapFocusSelector;

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

        {needsTargetPair && targetPair && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">Fokus:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{targetPairLabel(targetPair)}</span></div><button type="button" onClick={handleTargetPairReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
        {isRekapCustom && customFocus && !hideRekapControls && <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3"><div className="min-w-0 text-left"><span className="mr-2 ui-label text-[9px]">Rekap:</span><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px]" style={{ color: meta.accent }}>{customFocusLabel(customFocus)} · {customFocusSubtitle(customFocus)}</span></div><button type="button" onClick={handleCustomFocusReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>Ganti</button></div>}
      </div>

      {!result && !loading && param !== 0 && !isRekapCustom && <button onClick={() => handleAnalyze(param || 1)} className="primary-button ui-motion-soft ui-tap mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px]"><RefreshCw size={18} /> Mulai Analisa</button>}

      {showTargetPairSelector && <TargetPairSelector meta={meta} onSelect={handleTargetPairSelect} />}
      {showRekapFocusSelector && <RekapFocusSelector meta={meta} onSelect={(focus) => { setCustomFocus(focus); setError(""); }} />}

      {showParamSelector && <ParamSelector type={type} param={param} meta={meta} onAnalyze={handleAnalyze} onCustomDigit={() => { setParam(3); setResult(null); setError(""); }} />}

      {customFocus && !hideRekapControls && <CustomDigitBuilder show={showCustomDigitBuilder} marketId={marketId} meta={meta} customFocus={customFocus} customAiDigitByPair={customAiDigitByPair} setCustomAiDigitForPair={setCustomAiDigitForPair} customIncludeBBFSByPair={customIncludeBBFSByPair} setCustomIncludeBBFSForPair={setCustomIncludeBBFSForPair} customOffAsCount={customOffAsCount} setCustomOffAsCount={setCustomOffAsCount} customOffKopCount={customOffKopCount} setCustomOffKopCount={setCustomOffKopCount} customOffKepalaCount={customOffKepalaCount} setCustomOffKepalaCount={setCustomOffKepalaCount} customOffEkorCount={customOffEkorCount} setCustomOffEkorCount={setCustomOffEkorCount} customOffJumlahCountByPair={customOffJumlahCountByPair} setCustomOffJumlahCountForPair={setCustomOffJumlahCountForPair} customOffShioCountByPair={customOffShioCountByPair} setCustomOffShioCountForPair={setCustomOffShioCountForPair} onGenerate={handleCustomDigitGenerate} />}

      {loading && <div className="ui-panel ui-motion-in my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px]">Memproses Analisa</div></div>}
      {error && <div className="ui-note ui-motion-in my-4 border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}

      {result && type === "rekap" && <RekapResult result={result} param={param} marketId={marketId} meta={meta} />}
      {result && type !== "rekap" && <AnalysisResult type={type} result={result} param={param} marketId={marketId} meta={meta} targetPair={targetPair || "belakang"} detailValidationOpen={detailValidationOpen} setDetailValidationOpen={setDetailValidationOpen} angkaJadiOpen={angkaJadiOpen} setAngkaJadiOpen={setAngkaJadiOpen} />}
    </div>
  );
}

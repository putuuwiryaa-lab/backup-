import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { customFocusLabel, customFocusSubtitle, type CustomFocus, type TargetPair } from "../../lib/analysis/customDigit";
import { analysisScopeLabel, targetPairLabel, type AnalysisScope } from "./ScopeSelectors";

type Meta = { accent: string; soft: string };

function StatusPill({ label, value, accent, onReset }: { label: string; value: string; accent: string; onReset: () => void }) {
  return (
    <div className="ui-card ui-motion-in relative mt-3 flex items-center justify-between gap-3 rounded-2xl p-3">
      <div className="min-w-0 text-left">
        <span className="mr-2 ui-label text-[9px]">{label}:</span>
        <span className="ui-font-display text-[10px] font-black uppercase tracking-[2px]" style={{ color: accent }}>{value}</span>
      </div>
      <button type="button" onClick={onReset} className="ui-motion-soft ui-tap shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[1px]" style={{ borderColor: `${accent}66`, color: accent }}>Ganti</button>
    </div>
  );
}

export default function AnalysisPageChrome({
  type,
  title,
  icon,
  marketId,
  meta,
  isAI,
  isBBFS,
  isRekapCustom,
  needsTargetPair,
  analysisScope,
  targetPair,
  customFocus,
  loading,
  canStartAnalyze,
  onBack,
  onStartAnalyze,
  onAIScopeReset,
  onTargetPairReset,
  onBBFSScopeReset,
  onCustomFocusReset,
}: {
  type: string;
  title: string;
  icon: string;
  marketId: string;
  meta: Meta;
  isAI: boolean;
  isBBFS: boolean;
  isRekapCustom: boolean;
  needsTargetPair: boolean;
  analysisScope: AnalysisScope | null;
  targetPair: TargetPair | null;
  customFocus: CustomFocus | null;
  loading: boolean;
  canStartAnalyze: boolean;
  onBack: () => void;
  onStartAnalyze: () => void;
  onAIScopeReset: () => void;
  onTargetPairReset: () => void;
  onBBFSScopeReset: () => void;
  onCustomFocusReset: () => void;
}) {
  return (
    <>
      <button onClick={onBack} className="ghost-button ui-motion-soft ui-tap mb-3 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--ui-text-muted)]"><ArrowLeft size={16} /> Kembali</button>

      <div className="ui-panel ui-motion-in relative mb-4 overflow-hidden p-4">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accent}18` }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
        <div className="relative mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.028] text-[18px]" style={{ borderColor: `${meta.accent}66`, color: meta.accent }}>{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[1.8px]" style={{ backgroundColor: meta.soft, color: meta.accent }}><Sparkles size={10} /> Mode Analisa</div>
            <h2 className="ui-font-display truncate text-[16px] font-black uppercase tracking-[3px] text-[var(--ui-text)]">{title}</h2>
          </div>
        </div>
        <div className="ui-card relative flex min-h-[78px] items-center justify-center rounded-2xl px-4 py-4 text-center">
          <p className="ui-font-display break-words text-[24px] font-black uppercase leading-tight tracking-[4px] text-[var(--ui-text)] sm:text-[28px]">{marketId}</p>
        </div>
        {isAI && analysisScope && <StatusPill label="AI" value={analysisScopeLabel(analysisScope)} accent={meta.accent} onReset={onAIScopeReset} />}
        {needsTargetPair && targetPair && <StatusPill label="Fokus" value={targetPairLabel(targetPair)} accent={meta.accent} onReset={onTargetPairReset} />}
        {isBBFS && analysisScope && analysisScope !== "default" && <StatusPill label="BBFS" value={analysisScopeLabel(analysisScope)} accent={meta.accent} onReset={onBBFSScopeReset} />}
        {isRekapCustom && customFocus && <StatusPill label="Rekap" value={`${customFocusLabel(customFocus)} · ${customFocusSubtitle(customFocus)}`} accent={meta.accent} onReset={onCustomFocusReset} />}
      </div>

      {canStartAnalyze && <button onClick={onStartAnalyze} className="primary-button ui-font-display ui-motion-soft ui-tap mb-4 flex w-full items-center justify-center gap-3 p-5 text-[12px] font-black uppercase tracking-[4px]"><RefreshCw size={18} /> Mulai Analisa</button>}

      {loading && <div className="ui-panel ui-motion-in my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="ui-font-display text-[11px] font-black uppercase tracking-[3px]">Memproses Analisa</div></div>}
    </>
  );
}

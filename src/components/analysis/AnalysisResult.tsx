import { useState } from "react";
import { Trophy } from "lucide-react";
import EvaluationHistory from "../EvaluationHistory";
import { evaluationModes } from "../../lib/analysis/constants";
import { safeArray, statsFrom } from "../../lib/analysis/utils";
import { DetailToggle, ResultHeader, SectionTitle, ShioChip } from "./Shared";
import AngkaJadiPanel from "./AngkaJadiPanel";

type TargetPair = "depan" | "tengah" | "belakang";

function StatsList({ stats, accent }: { stats: any[]; accent: string }) {
  if (!stats.length) return <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)]">Belum ada statistik aktif</div>;
  return (
    <div className="space-y-2">
      {stats.map((s: any, i: number) => {
        const score = s.hits ?? s.score ?? 0;
        const pct = Math.min(100, Math.max(8, (Number(score) / 14) * 100));
        return (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
            <span className="rounded-full border px-2 py-1 text-[7px] font-black uppercase tracking-[1px]" style={{ borderColor: accent, color: accent }}>Elite</span>
            <div className="min-w-0">
              <div className="truncate text-[9px] font-semibold uppercase tracking-[1px] text-[var(--text)] opacity-90">{s.name || `Rumus ${i + 1}`}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} /></div>
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] font-black" style={{ color: accent }}>{score}/14</span>
          </div>
        );
      })}
    </div>
  );
}

function DigitPills({ items, accent, compact = true, singleLine = false, center = false }: { items: any[]; accent: string; compact?: boolean; singleLine?: boolean; center?: boolean }) {
  return (
    <div className={`${singleLine ? `flex flex-nowrap ${center ? "justify-center" : "justify-end"} gap-1 overflow-x-auto pb-1` : `flex flex-wrap ${center ? "justify-center" : "justify-end"} gap-2`}`}>
      {items.map((item: any, i: number) => (
        <div key={i} className={`${singleLine ? "h-10 min-w-9 shrink-0 px-2 text-[16px]" : compact ? "h-10 min-w-10 px-3 text-[16px]" : "h-13 min-w-13 px-3 text-[22px]"} flex items-center justify-center rounded-2xl border font-['Orbitron'] font-black`} style={{ borderColor: accent, backgroundColor: `${accent}14`, color: "var(--text)" }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function ResultRow({ label, values, accent, shio = false }: any) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
      <span className="shrink-0 font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span>
      <div className="min-w-0 flex-1">
        {shio ? <div className="flex flex-wrap justify-end gap-2">{safeArray(values).map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : <DigitPills items={safeArray(values)} accent={accent} compact />}
      </div>
    </div>
  );
}

function MainResultCard({ label, values, accent, shio = false, singleLine = false, stacked = false }: any) {
  const arr = safeArray(values);
  const useStacked = stacked || shio;
  return (
    <div className="premium-panel result-glow relative overflow-hidden p-5">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${accent}22` }} />
      <div className="relative mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: `${accent}1f`, color: accent }}><Trophy size={12} /> Hasil Utama</div>
      {useStacked ? (
        <div className="relative rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center">
          <h3 className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">{label}</h3>
          <div className="mt-4">{shio ? <div className="flex flex-wrap justify-center gap-2">{arr.map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : <DigitPills items={arr} accent={accent} compact={false} singleLine={singleLine} center />}</div>
        </div>
      ) : (
        <div className="relative flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
          <h3 className="shrink-0 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">{label}</h3>
          <div className="min-w-0 flex-1"><DigitPills items={arr} accent={accent} compact={false} singleLine={singleLine} /></div>
        </div>
      )}
    </div>
  );
}

function MatiEvaluationTabs({ marketId, param, accent, soft }: { marketId: string; param: number; accent: string; soft: string }) {
  const [activePosition, setActivePosition] = useState<"as" | "kop" | "kepala" | "ekor">("as");
  const tabs = [
    { key: "as", label: "AS" },
    { key: "kop", label: "KOP" },
    { key: "kepala", label: "KEPALA" },
    { key: "ekor", label: "EKOR" },
  ] as const;
  const activeLabel = tabs.find((tab) => tab.key === activePosition)?.label || "AS";

  return (
    <div className="premium-panel space-y-3 p-4">
      <div className="flex items-center justify-between px-1">
        <span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">Riwayat Evaluasi</span>
        <span className="text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Per Posisi</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = activePosition === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActivePosition(tab.key)}
              className="rounded-2xl border px-2 py-3 text-[9px] font-black uppercase tracking-[1px] transition active:scale-95"
              style={{ borderColor: active ? accent : "rgba(255,255,255,0.14)", backgroundColor: active ? soft : "rgba(255,255,255,0.04)", color: active ? accent : "var(--text-dim)" }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <EvaluationHistory marketId={marketId} mode="mati" param={param} position={activePosition} title={`Riwayat ${activeLabel}`} />
    </div>
  );
}

export default function AnalysisResult({ type, result, param, marketId, meta, targetPair = "belakang", detailValidationOpen, setDetailValidationOpen, angkaJadiOpen, setAngkaJadiOpen }: {
  type: string;
  result: any;
  param: number | null;
  marketId: string;
  meta: { accent: string; soft: string; label: string };
  targetPair?: TargetPair;
  detailValidationOpen: boolean;
  setDetailValidationOpen: (fn: (value: boolean) => boolean) => void;
  angkaJadiOpen: boolean;
  setAngkaJadiOpen: (fn: (value: boolean) => boolean) => void;
}) {
  if (type === "mati") {
    const POS = ["AS", "KOP", "KEPALA", "EKOR"];
    const totalActive = POS.reduce((acc, p) => acc + statsFrom(result[p]).length, 0);
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <ResultHeader label="HASIL ANALISA" value={`RUMUS ACTIVE ${totalActive}/53`} accent={meta.accent} />
        <div className="premium-panel space-y-3 p-4">{POS.map((p) => <ResultRow key={p} label={`OFF ${p}`} values={result[p]?.result} accent={meta.accent} />)}</div>
        <div className="premium-panel space-y-5 p-4">
          <div className="flex items-center justify-between gap-3"><SectionTitle accent={meta.accent} title="Detail Validasi" /><DetailToggle open={detailValidationOpen} accent={meta.accent} onClick={() => setDetailValidationOpen((open) => !open)} /></div>
          {detailValidationOpen && POS.map((p) => <section key={p} className="space-y-3"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{p}</span><div className="h-px flex-1 bg-white/10" /></div><StatsList stats={statsFrom(result[p])} accent={meta.accent} /></section>)}
        </div>
        <AngkaJadiPanel type={type} result={result} open={angkaJadiOpen} setOpen={setAngkaJadiOpen} meta={meta} />
        {param !== 0 && <MatiEvaluationTabs marketId={marketId} param={param || 1} accent={meta.accent} soft={meta.soft} />}
      </div>
    );
  }

  const stats = safeArray(result.stats);
  const displayResult = safeArray(result.result);
  const active = result.elitCount ?? result.eliteTotal ?? stats.length;
  const formulaTotal = type === "ai" ? 35 : type === "jumlah" ? 51 : 50;
  const isBBFSResult = type === "ai" && param === 8;
  const resultLabel = isBBFSResult ? "BBFS" : meta.label;

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <MainResultCard label={resultLabel} values={displayResult} accent={meta.accent} shio={type === "shio"} singleLine={isBBFSResult} stacked={type === "ai"} />
      <ResultHeader label="VALIDASI" value={`RUMUS ACTIVE ${active}/${formulaTotal}`} accent={meta.accent} />
      <div className="premium-panel p-4">
        <div className="flex items-center justify-between gap-3"><SectionTitle accent={meta.accent} title="Detail Validasi" /><DetailToggle open={detailValidationOpen} accent={meta.accent} onClick={() => setDetailValidationOpen((open) => !open)} /></div>
        {detailValidationOpen && <div className="mt-4"><StatsList stats={stats} accent={meta.accent} /></div>}
      </div>
      <AngkaJadiPanel type={type} result={result} open={angkaJadiOpen} setOpen={setAngkaJadiOpen} meta={meta} />
      {evaluationModes.has(type) && param !== 0 && <div className="premium-panel space-y-3 p-4"><EvaluationHistory marketId={marketId} mode={type as any} param={param || 1} targetPair={targetPair} /></div>}
    </div>
  );
}

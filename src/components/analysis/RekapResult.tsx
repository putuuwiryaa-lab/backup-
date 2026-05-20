import { Copy } from "lucide-react";
import RekapHistory from "../RekapHistory";
import { safeArray } from "../../lib/analysis/utils";

export default function RekapResult({ result, param, marketId, meta }: {
  result: any;
  param: number | null;
  marketId: string;
  meta: { accent: string; soft: string };
}) {
  const isTop = param === 2;
  const isCustom = Boolean(result?.custom);
  const mode = isTop ? "top" : "invest";
  const lines = safeArray(result.lines);
  const displayLines = lines.join(" * ");
  const copyLines = lines.join("*");
  const rows = isCustom ? [
    ...(safeArray(result.ai).length ? [["AI", safeArray(result.ai).join(" "), "🔥", "#f3c14b"]] : []),
    ...(safeArray(result.bbfs).length ? [["BBFS", safeArray(result.bbfs).join(" "), "✨", "#f3c14b"]] : []),
    ...(safeArray(result.offKepala).length ? [["OFF KEP", safeArray(result.offKepala).join(" . "), "🎯", "#ff647c"]] : []),
    ...(safeArray(result.offEkor).length ? [["OFF EKR", safeArray(result.offEkor).join(" . "), "🎯", "#ff647c"]] : []),
    ...(safeArray(result.offJumlah).length ? [["OFF JML", safeArray(result.offJumlah).join(" . "), "🔢", "#b58cff"]] : []),
    ...(safeArray(result.offShio).length ? [["OFF SHIO", safeArray(result.offShio).map((s: any) => String(s).padStart(2, "0")).join(" . "), "🐲", "#28d7ff"]] : []),
  ] : [
    [isTop ? "AI TOP" : "AI CT", safeArray(result.ai).join(" "), "🔥", "#f3c14b"],
    ["OFF KEP", safeArray(result.offKepala).join(" . "), "🎯", "#ff647c"],
    ["OFF EKR", safeArray(result.offEkor).join(" . "), "🎯", "#ff647c"],
    ["OFF JML", safeArray(result.offJumlah).join(" . "), "🔢", "#b58cff"],
    ...(safeArray(result.offShio).length ? [["OFF SHIO", safeArray(result.offShio).map((s: any) => String(s).padStart(2, "0")).join(" . "), "🐲", "#28d7ff"]] : []),
  ];

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="premium-panel result-glow p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Hasil Rekap</p>
            <h3 className="font-['Orbitron'] text-[18px] font-black uppercase tracking-[3px] text-[var(--text)]">Mode {isCustom ? "Custom Digit" : isTop ? "Top" : "Invest"}</h3>
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>READY</span>
        </div>
        <div className="space-y-3">
          {rows.map(([label, value, emoji, color]: any) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
              <div className="flex shrink-0 items-center gap-3"><span className="text-base">{emoji}</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span></div>
              <span className="min-w-0 text-right font-['Orbitron'] text-[13px] font-black tracking-[2px]" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-panel space-y-3 p-4">
        <div className="flex items-center justify-between"><span className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Generate Lines</span><span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>{lines.length} LINE</span></div>
        <div className="max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--border2)] bg-black/30 p-4 font-['JetBrains_Mono'] text-[14px] font-bold leading-8 tracking-[2px] custom-scrollbar" style={{ color: meta.accent }}>{displayLines}</div>
        <button onClick={() => navigator.clipboard?.writeText(copyLines)} className="flex w-full items-center justify-center gap-2 rounded-3xl p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-black transition active:scale-95" style={{ backgroundColor: meta.accent }}><Copy size={16} /> Copy Semua</button>
      </div>

      {!isCustom && <div className="premium-panel space-y-3 p-4"><RekapHistory marketId={marketId} mode={mode} /></div>}
    </div>
  );
}

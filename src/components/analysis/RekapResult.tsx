import { Copy } from "lucide-react";
import RekapHistory from "../RekapHistory";
import { safeArray } from "../../lib/analysis/utils";
import { customFocusPairs, customFocusPositionLabels, customFocusPositions, type TargetPair } from "../../lib/analysis/customDigit";

const pairLabel: Record<TargetPair, string> = {
  depan: "DEPAN",
  tengah: "TENGAH",
  belakang: "BELAKANG",
};

function formatValue(value: any, pad = false) {
  return safeArray(value).map((item: any) => pad ? String(item).padStart(2, "0") : String(item)).join(" . ");
}

function formatCompact(value: any) {
  return safeArray(value).map((item: any) => String(item)).join("");
}

function customRows(result: any) {
  const focus = result?.customFocus || "belakang";
  const pairs = customFocusPairs(focus);
  const positions = customFocusPositions(focus);
  const rows: any[] = [];

  pairs.forEach((pair) => {
    if (safeArray(result.aiByPair?.[pair]).length) rows.push([`AI ${pairLabel[pair]}`, formatCompact(result.aiByPair[pair]), "🔥", "#f3c14b"]);
    if (safeArray(result.bbfsByPair?.[pair]).length) rows.push([`BBFS ${pairLabel[pair]}`, formatCompact(result.bbfsByPair[pair]), "✨", "#f3c14b"]);
  });

  positions.forEach((position) => {
    const key = position === "as" ? "offAs" : position === "kop" ? "offKop" : position === "kepala" ? "offKepala" : "offEkor";
    if (safeArray(result[key]).length) rows.push([`OFF ${customFocusPositionLabels[position]}`, formatValue(result[key]), "🎯", "#ff647c"]);
  });

  pairs.forEach((pair) => {
    if (safeArray(result.jumlahByPair?.[pair]).length) rows.push([`OFF JML ${pairLabel[pair]}`, formatValue(result.jumlahByPair[pair]), "🔢", "#b58cff"]);
    if (safeArray(result.shioByPair?.[pair]).length) rows.push([`OFF SHIO ${pairLabel[pair]}`, formatValue(result.shioByPair[pair], true), "🐲", "#28d7ff"]);
  });

  return rows;
}

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
  const rows = isCustom ? customRows(result) : [
    [isTop ? "AI TOP" : "AI CT", safeArray(result.ai).join(""), "🔥", "#f3c14b"],
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
          {rows.map(([label, value, emoji, color]: any, index: number) => (
            <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
              <div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-base">{emoji}</span><span className="min-w-0 text-[10px] font-black uppercase tracking-[1.8px] text-[var(--text-dim)]">{label}</span></div>
              <span className="max-w-[54%] truncate text-right font-['Orbitron'] text-[12px] font-black tracking-[1.5px]" style={{ color }}>{value}</span>
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

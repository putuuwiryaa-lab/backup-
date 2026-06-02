import { Copy, Grid3X3 } from "lucide-react";
import { safeArray } from "../../lib/analysis/utils";
import { customFocusPairs, customFocusPositionLabels, customFocusPositions, customFocusToBBFSScope, type TargetPair } from "../../lib/analysis/customDigit";

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

function bbfsLabelFromFocus(focus: any) {
  const scope = customFocusToBBFSScope(focus);
  if (scope === "4d") return "BBFS 4D";
  if (scope === "3d") return "BBFS 3D";
  if (scope === "2d_depan") return "BBFS DEPAN";
  if (scope === "2d_tengah") return "BBFS TENGAH";
  return "BBFS BELAKANG";
}

function customRows(result: any) {
  const focus = result?.customFocus || result?.focus || "belakang";
  const pairs = customFocusPairs(focus);
  const positions = customFocusPositions(focus);
  const rows: any[] = [];

  pairs.forEach((pair) => {
    if (safeArray(result.aiByPair?.[pair]).length) rows.push([`AI ${pairLabel[pair]}`, formatCompact(result.aiByPair[pair]), "🔥", "#f3c14b", "emoji"]);
    if (result.aiParityByPair?.[pair]) rows.push([`GENAP/GANJIL ${pairLabel[pair]}`, String(result.aiParityByPair[pair]), "⚖️", "#34d399", "emoji"]);
    if (result.aiSizeByPair?.[pair]) rows.push([`BESAR/KECIL ${pairLabel[pair]}`, String(result.aiSizeByPair[pair]), "📐", "#38bdf8", "emoji"]);
  });

  if (safeArray(result.bbfsGlobal).length) {
    rows.push([bbfsLabelFromFocus(focus), formatCompact(result.bbfsGlobal), "bbfs", "#ff9f43", "bbfs"]);
  }

  pairs.forEach((pair) => {
    if (safeArray(result.bbfsByPair?.[pair]).length) rows.push([`BBFS ${pairLabel[pair]}`, formatCompact(result.bbfsByPair[pair]), "bbfs", "#ff9f43", "bbfs"]);
  });

  positions.forEach((position) => {
    const key = position === "as" ? "offAs" : position === "kop" ? "offKop" : position === "kepala" ? "offKepala" : "offEkor";
    if (safeArray(result[key]).length) rows.push([`OFF ${customFocusPositionLabels[position]}`, formatValue(result[key]), "🎯", "#ff647c", "emoji"]);
  });

  pairs.forEach((pair) => {
    if (safeArray(result.jumlahByPair?.[pair]).length) rows.push([`OFF JML ${pairLabel[pair]}`, formatValue(result.jumlahByPair[pair]), "🔢", "#b58cff", "emoji"]);
    if (safeArray(result.shioByPair?.[pair]).length) rows.push([`OFF SHIO ${pairLabel[pair]}`, formatValue(result.shioByPair[pair], true), "🐲", "#28d7ff", "emoji"]);
  });

  return rows;
}

function RowIcon({ icon, color, type }: { icon: any; color: string; type?: string }) {
  if (type === "bbfs") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: `${color}66`, backgroundColor: `${color}18`, color }}>
        <Grid3X3 size={16} strokeWidth={2.4} />
      </span>
    );
  }
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[20px] leading-none">{icon}</span>;
}

export default function RekapResult({ result, meta }: {
  result: any;
  param: number | null;
  marketId: string;
  meta: { accent: string; soft: string };
}) {
  const lines = safeArray(result.lines);
  const displayLines = lines.join(" * ");
  const copyLines = lines.join("*");
  const rows = customRows(result);

  return (
    <div className="ui-motion-in space-y-4">
      <div className="ui-panel ui-motion-in result-glow p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="ui-label text-[9px]">Hasil Rekap</p>
            <h3 className="font-['Orbitron'] text-[18px] font-black uppercase tracking-[3px] text-[var(--ui-text)]">Mode Custom Digit</h3>
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>READY</span>
        </div>
        <div className="space-y-3">
          {rows.length ? rows.map(([label, value, icon, color, iconType]: any, index: number) => (
            <div key={`${label}-${index}`} className="ui-card ui-motion-soft ui-lift flex items-center justify-between gap-3 rounded-3xl p-3">
              <div className="flex min-w-0 items-center gap-3"><RowIcon icon={icon} color={color} type={iconType} /><span className="ui-label min-w-0 text-[10px]">{label}</span></div>
              <span className="max-w-[54%] truncate text-right font-['Orbitron'] text-[12px] font-black tracking-[1.5px]" style={{ color }}>{value}</span>
            </div>
          )) : (
            <div className="ui-card rounded-3xl p-4 text-center text-[11px] font-bold uppercase tracking-[1.4px] text-[var(--ui-text-muted)]">Filter yang dipilih belum terbaca pada hasil ini.</div>
          )}
        </div>
      </div>

      <div className="ui-panel ui-motion-in space-y-3 p-4">
        <div className="flex items-center justify-between"><span className="ui-title text-[12px]">Generate Lines</span><span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>{lines.length} LINE</span></div>
        <div className="max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--ui-border-soft)] bg-black/30 p-4 font-['JetBrains_Mono'] text-[14px] font-bold leading-8 tracking-[2px] custom-scrollbar" style={{ color: meta.accent }}>{displayLines}</div>
        <button onClick={() => navigator.clipboard?.writeText(copyLines)} className="ui-motion-soft ui-tap flex w-full items-center justify-center gap-2 rounded-3xl p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-black" style={{ backgroundColor: meta.accent }}><Copy size={16} /> Copy Semua</button>
      </div>
    </div>
  );
}

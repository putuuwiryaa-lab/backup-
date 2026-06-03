import { CUSTOM_FOCUS_OPTIONS, customFocusSubtitle, type BBFSAnalysisScope, type CustomFocus, type TargetPair } from "../../lib/analysis/customDigit";

export type AnalysisScope = "default" | BBFSAnalysisScope;

export const TARGET_PAIR_OPTIONS: Array<{ key: TargetPair; title: string; subtitle: string }> = [
  { key: "depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
];

export const BBFS_SCOPE_OPTIONS: Array<{ key: Exclude<AnalysisScope, "default">; title: string; subtitle: string }> = [
  { key: "2d_depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "2d_tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "2d_belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
  { key: "3d", title: "3D", subtitle: "KOP - KEPALA - EKOR" },
  { key: "4d", title: "4D", subtitle: "AS - KOP - KEPALA - EKOR" },
];

export const AI_SCOPE_OPTIONS: Array<{ key: Exclude<AnalysisScope, "default">; title: string; subtitle: string }> = [
  { key: "2d_depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "2d_tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "2d_belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
  { key: "3d", title: "3D", subtitle: "KOP - KEPALA - EKOR" },
  { key: "4d", title: "4D", subtitle: "AS - KOP - KEPALA - EKOR" },
];

export const VALID_TARGET_PAIRS: TargetPair[] = ["depan", "tengah", "belakang"];

export function targetPairLabel(pair: TargetPair | null) {
  if (!pair) return "";
  const option = TARGET_PAIR_OPTIONS.find((item) => item.key === pair);
  return option ? `${option.title} · ${option.subtitle}` : "";
}

export function analysisScopeLabel(scope: AnalysisScope | null) {
  if (!scope || scope === "default") return "";
  const option = BBFS_SCOPE_OPTIONS.find((item) => item.key === scope);
  return option ? `${option.title} · ${option.subtitle}` : "";
}

function SelectorPanel({ title, subtitle, children, meta }: { title: string; subtitle: string; children: any; meta: { accent: string; soft: string } }) {
  return (
    <div className="ui-panel ui-motion-in mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="ui-title text-[11px]" style={{ color: meta.accent }}>{title}</div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--ui-text-muted)]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3">{children}</div>
    </div>
  );
}

function SelectorButton({ option, meta, onClick }: { option: { key: string; title: string; subtitle: string }; meta: { accent: string; soft: string }; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ui-motion-soft ui-tap ui-lift min-h-[76px] w-full rounded-3xl border px-5 py-4 text-center" style={{ borderColor: `${meta.accent}77`, backgroundColor: meta.soft, color: meta.accent }}>
      <span className="ui-font-display block text-[15px] font-black uppercase tracking-[2.2px]">{option.title}</span>
      <span className="mt-3 block text-[10px] font-black uppercase tracking-[1.4px] opacity-80">{option.subtitle}</span>
    </button>
  );
}

export function TargetPairSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (pair: TargetPair) => void }) {
  return (
    <SelectorPanel meta={meta} title="Pilih Fokus 2D" subtitle="Pilih posisi angka yang mau dianalisa.">
      {TARGET_PAIR_OPTIONS.map((option) => <SelectorButton key={option.key} option={option} meta={meta} onClick={() => onSelect(option.key)} />)}
    </SelectorPanel>
  );
}

export function BBFSScopeSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (scope: Exclude<AnalysisScope, "default">) => void }) {
  return (
    <SelectorPanel meta={meta} title="Pilih Jenis BBFS" subtitle="Pilih target backtest BBFS.">
      {BBFS_SCOPE_OPTIONS.map((option) => <SelectorButton key={option.key} option={option} meta={meta} onClick={() => onSelect(option.key)} />)}
    </SelectorPanel>
  );
}

export function AIScopeSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (scope: Exclude<AnalysisScope, "default">) => void }) {
  return (
    <SelectorPanel meta={meta} title="Pilih Jenis Angka Ikut" subtitle="Pilih target AI yang mau dianalisa.">
      {AI_SCOPE_OPTIONS.map((option) => <SelectorButton key={option.key} option={option} meta={meta} onClick={() => onSelect(option.key)} />)}
    </SelectorPanel>
  );
}

export function RekapFocusSelector({ meta, onSelect }: { meta: { accent: string; soft: string }; onSelect: (focus: CustomFocus) => void }) {
  return (
    <SelectorPanel meta={meta} title="Pilih Jenis Rekap" subtitle="Pilih dulu jenis line yang mau dibuat.">
      {CUSTOM_FOCUS_OPTIONS.map((item) => <SelectorButton key={item.key} option={{ key: item.key, title: item.title, subtitle: customFocusSubtitle(item.key) }} meta={meta} onClick={() => onSelect(item.key)} />)}
    </SelectorPanel>
  );
}

import { BarChart3, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { SHIO_EMOJI, SHIO_NAMES } from "../../lib/analysis/constants";

export function MiniLabel({ children }: { children: React.ReactNode }) {
  return <div className="ui-label text-[9px]">{children}</div>;
}

export function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return <div className="flex items-center gap-2"><BarChart3 size={16} style={{ color: accent }} /><span className="ui-title text-[11px]">{title}</span></div>;
}

export function DetailToggle({ open, accent, onClick }: { open: boolean; accent: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="ui-motion-soft ui-tap inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[1px]" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }} aria-label={open ? "Tutup" : "Buka"}>{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{open ? "Tutup" : "Buka"}</button>;
}

export function ResultHeader({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className="ui-panel ui-motion-in flex items-center justify-between gap-3 p-4"><span className="ui-label text-[10px]">{label}</span><span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>{value}</span></div>;
}

export function ShioChip({ value }: { value: any }) {
  const normalized = Number(String(value ?? "").match(/\d+/)?.[0] ?? value);
  const safeValue = Number.isFinite(normalized) && normalized >= 1 && normalized <= 12 ? normalized : 0;
  const label = safeValue ? `${safeValue < 10 ? "0" + safeValue : safeValue} ${SHIO_NAMES[safeValue]}` : String(value ?? "-");
  const emoji = safeValue ? SHIO_EMOJI[safeValue] : "🐾";
  return <span className="ui-motion-soft inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-[11px] font-black" style={{ borderColor: "rgba(40,215,255,0.35)", backgroundColor: "rgba(40,215,255,0.14)", color: "var(--ui-cyan)" }}>{emoji} {label}</span>;
}

export function LineBox({ label, lines, accent, soft }: { label: string; lines: string[]; accent: string; soft: string }) {
  const displayPayload = lines.join(" * ");
  const copyPayload = lines.join("*");
  return <div key={label} className="ui-card ui-motion-in rounded-3xl p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="ui-title text-[11px]">{label}</span><span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: soft, color: accent }}>{lines.length} LINE</span></div><div className="ui-mono max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--ui-border-soft)] bg-black/30 p-4 text-[14px] font-bold leading-8 tracking-[2px] custom-scrollbar" style={{ color: accent }}>{displayPayload || "-"}</div><button onClick={() => navigator.clipboard?.writeText(copyPayload)} className="ui-font-display ui-motion-soft ui-tap mt-3 flex w-full items-center justify-center gap-2 rounded-3xl p-4 text-[11px] font-black uppercase tracking-[3px] text-black" style={{ backgroundColor: accent }}><Copy size={16} /> Copy Semua</button></div>;
}

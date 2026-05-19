import { RefreshCw } from "lucide-react";
import { MiniLabel } from "./Shared";

export default function CustomDigitBuilder({
  show,
  meta,
  customAiDigit,
  setCustomAiDigit,
  customIncludeBBFS,
  setCustomIncludeBBFS,
  customOffDigitCount,
  setCustomOffDigitCount,
  customOffJumlahCount,
  setCustomOffJumlahCount,
  customOffShioCount,
  setCustomOffShioCount,
  onGenerate,
}: {
  show: boolean;
  meta: { accent: string; soft: string };
  customAiDigit: 4 | 6 | null;
  setCustomAiDigit: (value: 4 | 6) => void;
  customIncludeBBFS: boolean;
  setCustomIncludeBBFS: (fn: (value: boolean) => boolean) => void;
  customOffDigitCount: number | null;
  setCustomOffDigitCount: (value: number | null) => void;
  customOffJumlahCount: number | null;
  setCustomOffJumlahCount: (value: number | null) => void;
  customOffShioCount: number | null;
  setCustomOffShioCount: (value: number | null) => void;
  onGenerate: () => void;
}) {
  if (!show) return null;

  const optionButton = (active: boolean, label: string, onClick: () => void, extraClass = "") => (
    <button
      type="button"
      onClick={onClick}
      className={`${extraClass} rounded-3xl border p-4 text-center transition active:scale-95`}
      style={{ borderColor: active ? meta.accent : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--text-dim)" }}
    >
      <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{label}</span>
    </button>
  );

  return (
    <div className="premium-panel mt-4 space-y-4 p-4">
      <div className="text-center">
        <div className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Custom Digit</div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-dim)]">Pilih filter yang mau dipakai, lalu generate.</p>
      </div>

      <section className="space-y-2">
        <MiniLabel>AI</MiniLabel>
        <div className="grid grid-cols-2 gap-2">
          {optionButton(customAiDigit === 4, "4 Digit", () => setCustomAiDigit(4))}
          {optionButton(customAiDigit === 6, "6 Digit", () => setCustomAiDigit(6))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>BBFS</MiniLabel>
        {optionButton(customIncludeBBFS, "Include BBFS", () => setCustomIncludeBBFS((value) => !value), "w-full")}
      </section>

      <section className="space-y-2">
        <MiniLabel>Angka Mati Kepala/Ekor</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffDigitCount === n, String(n), () => setCustomOffDigitCount(customOffDigitCount === n ? null : n)))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>Jumlah Mati</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffJumlahCount === n, String(n), () => setCustomOffJumlahCount(customOffJumlahCount === n ? null : n)))}
        </div>
      </section>

      <section className="space-y-2">
        <MiniLabel>Shio Mati</MiniLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => optionButton(customOffShioCount === n, String(n), () => setCustomOffShioCount(customOffShioCount === n ? null : n)))}
        </div>
      </section>

      <button onClick={onGenerate} className="primary-button flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Generate</button>
    </div>
  );
}

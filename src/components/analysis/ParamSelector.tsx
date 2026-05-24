export default function ParamSelector({ type, param, meta, onAnalyze, onCustomDigit }: {
  type: string;
  param: number | null;
  meta: { accent: string; soft: string };
  onAnalyze: (param: number) => void;
  onCustomDigit: () => void;
}) {
  if (param !== 0) return null;

  const options: any = {
    ai: { title: "PILIH JUMLAH DIGIT AI", values: [2, 4, 6, 8], labels: { 8: "BBFS" } },
    mati: { title: "PILIH JUMLAH DIGIT OFF", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
    jumlah: { title: "PILIH JUMLAH OFF", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
    shio: { title: "PILIH JUMLAH SHIO MATI", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
    rekap: { title: "PILIH MODE REKAP", values: [1, 2], labels: { 1: "INVEST", 2: "TOP" } },
  };
  const cfg = options[type] || options.ai;
  const isThreeDigitMode = type === "mati" || type === "jumlah" || type === "shio";
  const isAiMode = type === "ai";

  return (
    <div className="ui-panel ui-motion-in mt-4 p-4">
      <div className="mb-3 text-center text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{cfg.title}</div>
      <div className={`grid gap-2 ${isThreeDigitMode || isAiMode ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        {cfg.values.map((n: number) => {
          const isWideBBFS = type === "ai" && n === 8;
          const hint = cfg.hints?.[n];
          return (
            <button key={n} onClick={() => onAnalyze(n)} className={`${isWideBBFS ? "col-span-3" : ""} ui-motion-soft ui-tap ui-lift rounded-3xl border ${isThreeDigitMode || isAiMode ? "min-h-[92px] p-3" : "p-5"} text-center`} style={{ borderColor: `${meta.accent}88`, backgroundColor: meta.soft, color: meta.accent }}>
              <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">{cfg.labels?.[n] || n}</span>
              {isAiMode && n !== 8 && <span className="mt-2 block text-[8px] font-black uppercase tracking-[1.4px] opacity-80">DIGIT</span>}
              {hint && <span className="mt-2 block text-[8px] font-black uppercase tracking-[1.4px] opacity-80">{hint}</span>}
            </button>
          );
        })}
        {type === "rekap" && (
          <button onClick={onCustomDigit} className="ui-motion-soft ui-tap ui-lift col-span-2 rounded-3xl border p-5 text-center sm:col-span-4" style={{ borderColor: `${meta.accent}88`, backgroundColor: meta.soft, color: meta.accent }}>
            <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">CUSTOM DIGIT</span>
          </button>
        )}
      </div>
    </div>
  );
}

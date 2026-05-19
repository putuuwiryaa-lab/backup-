export default function ParamSelector({ type, param, meta, onAnalyze, onCustomDigit }: {
  type: string;
  param: number | null;
  meta: { accent: string; soft: string };
  onAnalyze: (param: number) => void;
  onCustomDigit: () => void;
}) {
  if (param !== 0) return null;

  const options: any = {
    ai: { title: "PILIH JUMLAH DIGIT AI", values: [4, 6, 8], labels: { 8: "BBFS" } },
    mati: { title: "PILIH JUMLAH DIGIT OFF", values: [1, 2, 3] },
    jumlah: { title: "PILIH JUMLAH OFF", values: [1, 2, 3] },
    shio: { title: "PILIH JUMLAH SHIO MATI", values: [1, 2, 3] },
    rekap: { title: "PILIH MODE REKAP", values: [1, 2], labels: { 1: "INVEST", 2: "TOP" } },
  };
  const cfg = options[type] || options.ai;

  return (
    <div className="premium-panel mt-4 p-4">
      <div className="mb-3 text-center text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{cfg.title}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cfg.values.map((n: number) => {
          const isWideBBFS = type === "ai" && n === 8;
          return (
            <button key={n} onClick={() => onAnalyze(n)} className={`${isWideBBFS ? "col-span-2 sm:col-span-4" : ""} rounded-3xl border p-5 text-center transition active:scale-95`} style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
              <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">{cfg.labels?.[n] || n}</span>
            </button>
          );
        })}
        {type === "rekap" && (
          <button onClick={onCustomDigit} className="col-span-2 rounded-3xl border p-5 text-center transition active:scale-95 sm:col-span-4" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
            <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">CUSTOM DIGIT</span>
          </button>
        )}
      </div>
    </div>
  );
}

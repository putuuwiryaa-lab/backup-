export default function ParamSelector({ type, param, meta, onAnalyze, onCustomDigit }: {
  type: string;
  param: number | null;
  meta: { accent: string; soft: string };
  onAnalyze: (param: number) => void;
  onCustomDigit: () => void;
}) {
  if (type === "rekap" || param !== 0) return null;

  const options: any = {
    ai: {
      title: "PILIH JENIS ANGKA IKUT",
      values: [2, 4, 6, 7, 8],
      labels: { 7: "GANJIL GENAP", 8: "BESAR KECIL" }
    },
    bbfs: { title: "PILIH JUMLAH DIGIT BBFS", values: [7, 8, 9] },
    mati: { title: "PILIH JUMLAH DIGIT OFF", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
    jumlah: { title: "PILIH JUMLAH OFF", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
    shio: { title: "PILIH JUMLAH SHIO MATI", values: [1, 2, 3], hints: { 1: "RINGAN", 2: "SEIMBANG", 3: "KETAT" } },
  };

  const cfg = options[type] || options.ai;
  const isThreeDigitMode = type === "mati" || type === "jumlah" || type === "shio";
  const isAiMode = type === "ai";
  const isGridThree = isThreeDigitMode || type === "bbfs";

  return (
    <div className="ui-panel ui-motion-in mt-4 p-4">
      <div
        className="mb-3 text-center text-[10px] font-black uppercase tracking-[3px]"
        style={{ color: meta.accent }}
      >
        {cfg.title}
      </div>

      <div className={`grid gap-2 ${isAiMode || isGridThree ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        {cfg.values.map((value: number) => {
          const isSpecial = type === "ai" && (value === 7 || value === 8);
          const hint = cfg.hints?.[value];
          const label = isSpecial ? cfg.labels[value] : String(value);

          return (
            <button
              key={String(value)}
              onClick={() => onAnalyze(value)}
              className={`ui-motion-soft ui-tap ui-lift rounded-3xl border ${
                isSpecial
                  ? "col-span-3 min-h-[92px] p-4"
                  : isAiMode || isGridThree
                    ? "min-h-[92px] p-3"
                    : "p-5"
              } text-center`}
              style={{
                borderColor: `${meta.accent}88`,
                backgroundColor: meta.soft,
                color: meta.accent,
              }}
            >
              <span
                className={`block font-['Orbitron'] font-black tracking-[2px] ${
                  isSpecial ? "text-[15px] leading-5" : "text-xl"
                }`}
              >
                {label}
              </span>

              {(((type === "ai" && !isSpecial) || type === "bbfs") && (
                <span className="mt-2 block text-[8px] font-black uppercase tracking-[1.4px] opacity-80">
                  DIGIT
                </span>
              ))}

              {hint && (
                <span className="mt-2 block text-[8px] font-black uppercase tracking-[1.4px] opacity-80">
                  {hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

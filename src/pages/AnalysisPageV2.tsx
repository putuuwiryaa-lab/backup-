import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RefreshCw, Sparkles } from "lucide-react";

const SHIO_NAMES = ["", "Kuda", "Ular", "Naga", "Kelinci", "Harimau", "Kerbau", "Tikus", "Babi", "Anjing", "Ayam", "Monyet", "Kambing"];
const SHIO_EMOJI = ["", "🐴", "🐍", "🐉", "🐰", "🐯", "🐂", "🐭", "🐷", "🐕", "🐔", "🐒", "🐐"];

const typeMeta: any = {
  ai: { accent: "var(--gold)", soft: "var(--gold-dim)", label: "ANGKA IKUT", formula: "25 RUMUS" },
  mati: { accent: "var(--red)", soft: "var(--red-dim)", label: "ANGKA MATI", formula: "50 RUMUS" },
  jumlah: { accent: "var(--purple)", soft: "var(--purple-dim)", label: "JUMLAH MATI", formula: "50 RUMUS" },
  shio: { accent: "var(--cyan)", soft: "var(--cyan-dim)", label: "SHIO MATI", formula: "12 SHIO" },
  rekap: { accent: "var(--blue)", soft: "var(--blue-dim)", label: "MENU REKAP", formula: "LINE GENERATOR" },
};

export default function AnalysisPageV2({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const [param, setParam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const meta = typeMeta[type] || typeMeta.ai;

  const safeArray = (value: any) => Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const statsFrom = (value: any) => Array.isArray(value?.stats) ? value.stats : [];

  const handleAnalyze = async (p?: number) => {
    if (!p && param === null) {
      setParam(0);
      setError("");
      return;
    }

    const selectedParam = p || param || 1;
    setParam(selectedParam);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resMarkets = await fetch("/api/markets");
      const allMarkets = await resMarkets.json();
      const currentMarket = allMarkets.find((m: any) => m.id === marketId);
      if (!currentMarket) {
        setError(`Data histori ${marketId} belum disetup oleh Admin!`);
        setLoading(false);
        return;
      }

      const data = String(currentMarket.history_data || "").split(/[\s\n\r\t,]+/).filter((token: string) => /^\d{4}$/.test(token)).reverse();
      if (!data || data.length < 17) {
        setError("Data dari server kurang! Min 17 result.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("supreme_token");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ type, data, param: selectedParam }),
      });
      const json = await res.json();
      if (json.success || json.data) setResult(json.data || json);
      else if (json.error) setError(json.error);
      else setResult(json);
    } catch (e: any) {
      setError("Error koneksi server: " + e.message);
    }
    setLoading(false);
  };

  const renderParamSelector = () => {
    if (param !== 0) return null;
    const options: any = {
      ai: { title: "PILIH JUMLAH DIGIT AI", values: [2, 4, 6, 8], labels: { 8: "BBFS" } },
      mati: { title: "PILIH JUMLAH DIGIT OFF", values: [1, 2, 3] },
      jumlah: { title: "PILIH JUMLAH OFF", values: [1, 2] },
      shio: { title: "PILIH JUMLAH SHIO MATI", values: [1, 2] },
      rekap: { title: "PILIH MODE REKAP", values: [1, 2], labels: { 1: "INVEST", 2: "TOP" } },
    };
    const cfg = options[type] || options.ai;

    return (
      <div className="premium-panel mt-4 p-4">
        <div className="mb-3 text-center text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{cfg.title}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cfg.values.map((n: number) => (
            <button key={n} onClick={() => handleAnalyze(n)} className="rounded-2xl border p-4 text-center transition active:scale-95" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
              <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">{cfg.labels?.[n] || n}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStatsList = (stats: any[], accent: string) => {
    if (!stats.length) return <div className="rounded-2xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)]">Belum ada statistik aktif</div>;
    return (
      <div className="space-y-2">
        {stats.map((s: any, i: number) => {
          const score = s.hits ?? s.score ?? 0;
          const pct = Math.min(100, Math.max(8, (Number(score) / 14) * 100));
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--border2)] bg-[#111824]/80 p-3">
              <span className="rounded-full border px-2 py-1 text-[7px] font-black uppercase tracking-[1px]" style={{ borderColor: accent, color: accent }}>Elite</span>
              <div className="min-w-0">
                <div className="truncate text-[9px] font-semibold uppercase tracking-[1px] text-[var(--text)] opacity-90">{s.name || `Rumus ${i + 1}`}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }}></div></div>
              </div>
              <span className="font-['JetBrains_Mono'] text-[9px] font-black" style={{ color: accent }}>{score}/14</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDigitPills = (items: any[], accent: string, compact = true) => (
    <div className="flex flex-wrap justify-end gap-2">
      {items.map((item: any, i: number) => (
        <div key={i} className={`${compact ? "h-9 min-w-9 text-[15px]" : "h-10 min-w-10 text-[18px]"} flex items-center justify-center rounded-2xl border px-3 font-['Orbitron'] font-black`} style={{ borderColor: accent, backgroundColor: `${accent}14`, color: "var(--text)" }}>
          {item}
        </div>
      ))}
    </div>
  );

  const ResultRow = ({ label, values, accent, shio = false, hideLabel = false }: any) => (
    <div className={`flex items-center ${hideLabel ? "justify-center" : "justify-between"} gap-3 rounded-2xl border border-[var(--border2)] bg-[#111824]/80 p-4`}>
      {!hideLabel && <span className="shrink-0 font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span>}
      {shio ? (
        <div className="flex flex-wrap justify-end gap-2">
          {safeArray(values).map((s: number) => <ShioChip key={s} value={s} />)}
        </div>
      ) : renderDigitPills(safeArray(values), accent, true)}
    </div>
  );

  const renderRekap = () => {
    const isTop = param === 2;
    const lines = safeArray(result.lines);
    const rows = [
      [isTop ? "AI TOP" : "AI CT", safeArray(result.ai).join(" "), "🔥", "var(--gold)"],
      ["OFF KEP", safeArray(result.offKepala).join(" . "), "🎯", "var(--red)"],
      ["OFF EKR", safeArray(result.offEkor).join(" . "), "🎯", "var(--red)"],
      ["OFF JML", safeArray(result.offJumlah).join(" . "), "🔢", "var(--purple)"],
    ];

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <ResultHeader label="HASIL REKAP" value={`MODE ${isTop ? "TOP" : "INVEST"}`} accent={meta.accent} />
        <div className="premium-panel space-y-3 p-4">
          {rows.map(([label, value, emoji, color]: any) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border2)] bg-[#111824]/80 p-3">
              <div className="flex items-center gap-3"><span className="text-base">{emoji}</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span></div>
              <span className="font-['Orbitron'] text-[13px] font-black tracking-[2px]" style={{ color }}>{value || "-"}</span>
            </div>
          ))}
          <ResultRow label="🐉 OFF SHIO" values={result.offShio} accent="var(--cyan)" shio />
        </div>

        <div className="premium-panel space-y-3 p-4">
          <div className="flex items-center justify-between"><span className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Generate Lines</span><span className="rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black text-[var(--gold)]">{lines.length} LINE</span></div>
          <div className="max-h-[230px] overflow-y-auto rounded-2xl border border-[var(--border2)] bg-[#0d1320] p-4 font-['Rajdhani'] text-[14px] font-bold leading-8 tracking-[2px] text-[var(--blue)] custom-scrollbar">{lines.join(" * ")}</div>
          <button onClick={() => navigator.clipboard.writeText(lines.join("*"))} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--blue)] p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-white transition active:scale-95"><Copy size={16} /> Copy Semua</button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    if (type === "rekap") return renderRekap();

    if (type === "mati") {
      const POS = ["AS", "KOP", "KEPALA", "EKOR"];
      const totalActive = POS.reduce((acc, p) => acc + statsFrom(result[p]).length, 0);
      return (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <ResultHeader label="HASIL ANALISA" value={`RUMUS ACTIVE ${totalActive}/50`} accent={meta.accent} />
          <div className="premium-panel space-y-5 p-4">
            {POS.map((p) => <section key={p} className="space-y-3"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/10"></div><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{p}</span><div className="h-px flex-1 bg-white/10"></div></div>{renderStatsList(statsFrom(result[p]), meta.accent)}</section>)}
          </div>
          <div className="premium-panel space-y-3 p-4">
            {POS.map((p) => <ResultRow key={p} label={`OFF ${p}`} values={result[p]?.result} accent={meta.accent} />)}
          </div>
        </div>
      );
    }

    const stats = safeArray(result.stats);
    const displayResult = safeArray(result.result);
    const active = result.elitCount ?? result.eliteTotal ?? stats.length;
    const formulaTotal = type === "ai" ? 25 : type === "shio" ? 12 : 50;
    const resultLabel = meta.label;

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <ResultHeader label="HASIL ANALISA" value={`RUMUS ACTIVE ${active}/${formulaTotal}`} accent={meta.accent} />
        <div className="premium-panel p-4"><div className="mb-4 text-center"><div className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: meta.accent, backgroundColor: meta.soft }}><span className="text-base">{icon}</span><span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text)]">{meta.label} — {meta.formula}</span></div><div className="mt-3 text-[9px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Validasi Walk-Forward</div></div>{renderStatsList(stats, meta.accent)}</div>
        <div className="premium-panel space-y-3 p-4">
          <ResultRow label={resultLabel} values={displayResult} accent={meta.accent} shio={type === "shio"} hideLabel={type === "ai"} />
        </div>
      </div>
    );
  };

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] pb-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--border2)] bg-[var(--card)] px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] transition active:scale-95"><ArrowLeft size={16} /> Kembali</button>
      <div className="premium-panel relative mb-4 overflow-hidden p-5"><div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }}></div><div className="mb-4 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border text-[22px] shadow-sm" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>{icon}</div><div className="min-w-0"><div className="mb-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: meta.soft, color: meta.accent }}><Sparkles size={11} /> Prediction Mode</div><h2 className="truncate font-['Orbitron'] text-[18px] font-black uppercase tracking-[4px] text-[var(--text)]">{title}</h2></div></div><div className="rounded-2xl bg-[#101724] p-4 text-center ring-1 ring-white/8"><span className="mr-3 text-[10px] font-black uppercase tracking-[3px] text-[var(--gold)]">Pasaran:</span><span className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[4px] text-[var(--text)]">{marketId}</span></div></div>
      {!result && !loading && param !== 0 && <button onClick={() => handleAnalyze()} className="mb-4 flex w-full items-center justify-center gap-3 rounded-3xl p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] text-white shadow-xl transition active:scale-95" style={{ background: `linear-gradient(135deg, ${meta.accent}, rgba(255,255,255,0.08))` }}><RefreshCw size={18} /> Mulai Analisa</button>}
      {renderParamSelector()}
      {loading && <div className="premium-panel my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-t-[var(--gold)] border-white/10"></div><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Memproses Analisa</div></div>}
      {error && <div className="my-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}
      {renderResult()}
    </div>
  );
}

function ResultHeader({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className="premium-panel flex items-center justify-between gap-3 p-4"><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span><span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>{value}</span></div>;
}

function ShioChip({ value }: { value: number }) {
  return <span className="inline-flex items-center gap-1 rounded-2xl border border-[var(--cyan)]/35 bg-[var(--cyan-dim)] px-3 py-2 text-[11px] font-black text-[var(--cyan)]">{SHIO_EMOJI[value]} {value < 10 ? "0" + value : value} {SHIO_NAMES[value] || ""}</span>;
}

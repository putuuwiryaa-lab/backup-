import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RefreshCw, Sparkles, Trophy, BarChart3 } from "lucide-react";

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
  const copyText = (text: string) => navigator.clipboard?.writeText(text);

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
            <button key={n} onClick={() => handleAnalyze(n)} className="rounded-3xl border p-5 text-center transition active:scale-95" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
              <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">{cfg.labels?.[n] || n}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStatsList = (stats: any[], accent: string) => {
    if (!stats.length) return <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-dim)]">Belum ada statistik aktif</div>;
    return (
      <div className="space-y-2">
        {stats.map((s: any, i: number) => {
          const score = s.hits ?? s.score ?? 0;
          const pct = Math.min(100, Math.max(8, (Number(score) / 14) * 100));
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
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
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((item: any, i: number) => (
        <div key={i} className={`${compact ? "h-10 min-w-10 text-[16px]" : "h-13 min-w-13 text-[22px]"} flex items-center justify-center rounded-2xl border px-3 font-['Orbitron'] font-black`} style={{ borderColor: accent, backgroundColor: `${accent}14`, color: "var(--text)" }}>
          {item}
        </div>
      ))}
    </div>
  );

  const ResultRow = ({ label, values, accent, shio = false }: any) => (
    <div className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
      <span className="mb-3 block font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span>
      {shio ? <div className="flex flex-wrap gap-2">{safeArray(values).map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : renderDigitPills(safeArray(values), accent, true)}
    </div>
  );

  const MainResultCard = ({ label, values, accent, shio = false }: any) => {
    const arr = safeArray(values);
    return (
      <div className="premium-panel result-glow relative overflow-hidden p-5 text-center">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${accent}22` }} />
        <div className="relative mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <Trophy size={12} /> Hasil Utama
        </div>
        <h3 className="relative font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">{label}</h3>
        <div className="relative mt-4">
          {shio ? <div className="flex flex-wrap justify-center gap-2">{arr.map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : renderDigitPills(arr, accent, false)}
        </div>
      </div>
    );
  };

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
        <div className="premium-panel result-glow p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Hasil Rekap</p>
              <h3 className="font-['Orbitron'] text-[18px] font-black uppercase tracking-[3px] text-[var(--text)]">Mode {isTop ? "Top" : "Invest"}</h3>
            </div>
            <span className="rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black text-[var(--gold)]">READY</span>
          </div>
          <div className="space-y-3">
            {rows.map(([label, value, emoji, color]: any) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
                <div className="flex items-center gap-3"><span className="text-base">{emoji}</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span></div>
                <span className="font-['Orbitron'] text-[13px] font-black tracking-[2px]" style={{ color }}>{value || "-"}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
              <div className="flex items-center gap-3"><span className="text-base">🐲</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">OFF SHIO</span></div>
              <div className="flex flex-wrap justify-end gap-2">{safeArray(result.offShio).map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div>
            </div>
          </div>
        </div>

        <div className="premium-panel space-y-3 p-4">
          <div className="flex items-center justify-between"><span className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Generate Lines</span><span className="rounded-full bg-[var(--blue-dim)] px-3 py-1 text-[10px] font-black text-[var(--blue)]">{lines.length} LINE</span></div>
          <div className="max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--border2)] bg-black/30 p-4 font-['JetBrains_Mono'] text-[14px] font-bold leading-8 tracking-[2px] text-[var(--blue)] custom-scrollbar">{lines.join(" * ")}</div>
          <button onClick={() => copyText(lines.join("*"))} className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[var(--blue)] p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-black transition active:scale-95"><Copy size={16} /> Copy Semua</button>
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
          <div className="premium-panel space-y-3 p-4">
            {POS.map((p) => <ResultRow key={p} label={`OFF ${p}`} values={result[p]?.result} accent={meta.accent} />)}
          </div>
          <div className="premium-panel space-y-5 p-4">
            <SectionTitle accent={meta.accent} title="Detail Validasi" />
            {POS.map((p) => <section key={p} className="space-y-3"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{p}</span><div className="h-px flex-1 bg-white/10" /></div>{renderStatsList(statsFrom(result[p]), meta.accent)}</section>)}
          </div>
        </div>
      );
    }

    const stats = safeArray(result.stats);
    const displayResult = safeArray(result.result);
    const active = result.elitCount ?? result.eliteTotal ?? stats.length;
    const formulaTotal = type === "ai" ? 25 : type === "shio" ? 12 : 50;

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <MainResultCard label={meta.label} values={displayResult} accent={meta.accent} shio={type === "shio"} />
        <ResultHeader label="VALIDASI" value={`RUMUS ACTIVE ${active}/${formulaTotal}`} accent={meta.accent} />
        <div className="premium-panel p-4">
          <SectionTitle accent={meta.accent} title={`${meta.label} — ${meta.formula}`} />
          <div className="mt-4">{renderStatsList(stats, meta.accent)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] pb-8">
      <button onClick={() => navigate(-1)} className="ghost-button mb-4 flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)] transition active:scale-95"><ArrowLeft size={16} /> Kembali</button>
      <div className="premium-panel relative mb-4 overflow-hidden p-5">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accent}20` }} />
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
        <div className="relative mb-4 flex items-center gap-3">
          <div className="flex h-15 w-15 items-center justify-center rounded-3xl border text-[24px] shadow-sm" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>{icon}</div>
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: meta.soft, color: meta.accent }}><Sparkles size={11} /> Prediction Mode</div>
            <h2 className="truncate font-['Orbitron'] text-[18px] font-black uppercase tracking-[4px] text-[var(--text)]">{title}</h2>
          </div>
        </div>
        <div className="relative rounded-3xl bg-black/25 p-4 text-center ring-1 ring-white/10"><span className="mr-3 text-[10px] font-black uppercase tracking-[3px] text-[var(--gold)]">Pasaran:</span><span className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[4px] text-[var(--text)]">{marketId}</span></div>
      </div>
      {!result && !loading && param !== 0 && <button onClick={() => handleAnalyze()} className="primary-button mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Mulai Analisa</button>}
      {renderParamSelector()}
      {loading && <div className="premium-panel my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-t-[var(--gold)] border-white/10" /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Memproses Analisa</div></div>}
      {error && <div className="my-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}
      {renderResult()}
    </div>
  );
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return <div className="flex items-center gap-2"><BarChart3 size={16} style={{ color: accent }} /><span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">{title}</span></div>;
}

function ResultHeader({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className="premium-panel flex items-center justify-between gap-3 p-4"><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span><span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>{value}</span></div>;
}

function ShioChip({ value }: { value: any }) {
  const normalized = Number(String(value ?? '').match(/\d+/)?.[0] ?? value);
  const safeValue = Number.isFinite(normalized) && normalized >= 1 && normalized <= 12 ? normalized : 0;
  const label = safeValue ? `${safeValue < 10 ? '0' + safeValue : safeValue} ${SHIO_NAMES[safeValue]}` : String(value ?? '-');
  const emoji = safeValue ? SHIO_EMOJI[safeValue] : '🐾';
  return <span className="inline-flex items-center gap-1 rounded-2xl border border-[var(--cyan)]/35 bg-[var(--cyan-dim)] px-3 py-2 text-[11px] font-black text-[var(--cyan)]">{emoji} {label}</span>;
}

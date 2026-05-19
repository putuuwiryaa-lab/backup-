import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RefreshCw, Sparkles, Trophy, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import RekapHistory from "../components/RekapHistory";
import EvaluationHistory from "../components/EvaluationHistory";

const SHIO_NAMES = ["", "Kuda", "Ular", "Naga", "Kelinci", "Harimau", "Kerbau", "Tikus", "Babi", "Anjing", "Ayam", "Monyet", "Kambing"];
const SHIO_EMOJI = ["", "🐴", "🐍", "🐉", "🐰", "🐯", "🐂", "🐭", "🐷", "🐕", "🐔", "🐒", "🐐"];
const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));
const SHIO_2D: Record<number, number[]> = {
  1: [1, 13, 25, 37, 49, 61, 73, 85, 97],
  2: [2, 14, 26, 38, 50, 62, 74, 86, 98],
  3: [3, 15, 27, 39, 51, 63, 75, 87, 99],
  4: [4, 16, 28, 40, 52, 64, 76, 88, 0],
  5: [5, 17, 29, 41, 53, 65, 77, 89],
  6: [6, 18, 30, 42, 54, 66, 78, 90],
  7: [7, 19, 31, 43, 55, 67, 79, 91],
  8: [8, 20, 32, 44, 56, 68, 80, 92],
  9: [9, 21, 33, 45, 57, 69, 81, 93],
  10: [10, 22, 34, 46, 58, 70, 82, 94],
  11: [11, 23, 35, 47, 59, 71, 83, 95],
  12: [12, 24, 36, 48, 60, 72, 84, 96],
};

const typeMeta: any = {
  ai: { accent: "#f3c14b", soft: "rgba(243, 193, 75, 0.16)", label: "ANGKA IKUT", formula: "35 RUMUS" },
  mati: { accent: "#ff647c", soft: "rgba(255, 100, 124, 0.16)", label: "ANGKA MATI", formula: "53 RUMUS" },
  jumlah: { accent: "#b58cff", soft: "rgba(181, 140, 255, 0.16)", label: "JUMLAH MATI", formula: "51 RUMUS" },
  shio: { accent: "#28d7ff", soft: "rgba(40, 215, 255, 0.14)", label: "SHIO MATI", formula: "50 RUMUS" },
  rekap: { accent: "#6ea8ff", soft: "rgba(110, 168, 255, 0.16)", label: "MENU REKAP", formula: "LINE GENERATOR" },
};

const evaluationModes = new Set(["ai", "mati", "jumlah", "shio"]);
const angkaJadiModes = new Set(["mati", "jumlah", "shio"]);

type LineSection = { label: string; lines: string[] };

type RekapCustomResult = {
  custom: true;
  ai: number[];
  bbfs: number[];
  includeBBFS: boolean;
  offKepala: number[];
  offEkor: number[];
  offJumlah: number[];
  offShio: number[];
  lines: string[];
};

export default function AnalysisPageV2({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const [param, setParam] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [detailValidationOpen, setDetailValidationOpen] = useState(false);
  const [angkaJadiOpen, setAngkaJadiOpen] = useState(false);
  const [customAiDigit, setCustomAiDigit] = useState<4 | 6 | null>(null);
  const [customIncludeBBFS, setCustomIncludeBBFS] = useState(false);
  const [customOffDigitCount, setCustomOffDigitCount] = useState<number | null>(null);
  const [customOffJumlahCount, setCustomOffJumlahCount] = useState<number | null>(null);
  const [customOffShioCount, setCustomOffShioCount] = useState<number | null>(null);
  const meta = typeMeta[type] || typeMeta.ai;

  const safeArray = (value: any) => Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const statsFrom = (value: any) => Array.isArray(value?.stats) ? value.stats : [];
  const copyText = (text: string) => navigator.clipboard?.writeText(text);
  const format2D = (n: number | string) => String(n).padStart(2, "0");
  const normalDigitList = (value: any) => Array.from(new Set(safeArray(value).map((v: any) => String(v)).filter((v: string) => /^\d$/.test(v))));
  const toNumberList = (value: any) => Array.from(new Set(safeArray(value).map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v))));

  const j2d = (a: number, b: number) => {
    const s = a + b;
    return s >= 10 ? s - 9 : s;
  };

  const shioOf2D = (n: number) => {
    for (const [shio, list] of Object.entries(SHIO_2D)) {
      if (list.includes(n)) return Number(shio);
    }
    return 1;
  };

  const getMarketData = async () => {
    const resMarkets = await fetch("/api/markets");
    const allMarkets = await resMarkets.json();
    const currentMarket = allMarkets.find((m: any) => m.id === marketId);
    if (!currentMarket) throw new Error(`Data histori ${marketId} belum disetup oleh Admin!`);

    const data = String(currentMarket.history_data || "").split(/[\s\n\r\t,]+/).filter((token: string) => /^\d{4}$/.test(token));
    if (!data || data.length < 17) throw new Error("Data dari server kurang! Min 17 result.");
    return data;
  };

  const postAnalyze = async (analysisType: string, data: string[], analysisParam: number) => {
    const token = localStorage.getItem("supreme_token");
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ type: analysisType, data, param: analysisParam }),
    });
    const json = await res.json();
    if (json.success || json.data) return json.data || json;
    throw new Error(json.error || "Gagal memproses analisa");
  };

  const buildAngkaJadi = () => {
    if (!result || !angkaJadiModes.has(type)) return { sections: [] as LineSection[] };

    if (type === "mati") {
      const jadi = (pos: string) => {
        const off = normalDigitList(result[pos]?.result);
        const allowed = DIGITS.filter((d) => !off.includes(d));
        return allowed.length ? allowed : DIGITS;
      };
      const kop = jadi("KOP");
      const kepala = jadi("KEPALA");
      const ekor = jadi("EKOR");
      const lines3D: string[] = [];
      const lines2D: string[] = [];
      kop.forEach((k: string) => kepala.forEach((h: string) => ekor.forEach((e: string) => lines3D.push(`${k}${h}${e}`))));
      kepala.forEach((h: string) => ekor.forEach((e: string) => lines2D.push(`${h}${e}`)));
      return { sections: [{ label: "ANGKA JADI 3D", lines: lines3D }, { label: "ANGKA JADI 2D", lines: lines2D }] };
    }

    if (type === "jumlah") {
      const off = normalDigitList(result.result);
      const lines: string[] = [];
      for (let k = 0; k <= 9; k++) {
        for (let e = 0; e <= 9; e++) {
          if (!off.includes(String(j2d(k, e)))) lines.push(`${k}${e}`);
        }
      }
      return { sections: [{ label: "ANGKA JADI 2D", lines }] };
    }

    const offShio = Array.from(new Set(safeArray(result.result).map((v: any) => Number(String(v).match(/\d+/)?.[0] ?? v)).filter((v: number) => Number.isFinite(v) && v >= 1 && v <= 12)));
    const lines: string[] = [];
    for (let n = 0; n <= 99; n++) {
      if (!offShio.includes(shioOf2D(n))) lines.push(format2D(n));
    }
    return { sections: [{ label: "ANGKA JADI 2D", lines }] };
  };

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
    setDetailValidationOpen(false);
    setAngkaJadiOpen(false);

    try {
      const data = await getMarketData();
      const dataResult = await postAnalyze(type, data, selectedParam);
      setResult(dataResult);
    } catch (e: any) {
      setError(e.message || "Error koneksi server");
    }
    setLoading(false);
  };

  const handleCustomRekapGenerate = async () => {
    if (!customAiDigit) {
      setError("Pilih AI 4 Digit atau 6 Digit dulu.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await getMarketData();
      const aiData = await postAnalyze("ai", data, customAiDigit);
      const bbfsData = customIncludeBBFS ? await postAnalyze("ai", data, 8) : null;
      const matiData = customOffDigitCount ? await postAnalyze("mati", data, customOffDigitCount) : null;
      const jumlahData = customOffJumlahCount ? await postAnalyze("jumlah", data, customOffJumlahCount) : null;
      const shioData = customOffShioCount ? await postAnalyze("shio", data, customOffShioCount) : null;

      const AI = toNumberList(aiData.result);
      const BBFS = customIncludeBBFS ? toNumberList(bbfsData?.result) : [];
      const LK = customOffDigitCount ? toNumberList(matiData?.KEPALA?.result) : [];
      const LE = customOffDigitCount ? toNumberList(matiData?.EKOR?.result) : [];
      const LJ = customOffJumlahCount ? toNumberList(jumlahData?.result) : [];
      const LS = customOffShioCount ? toNumberList(shioData?.result) : [];

      const lines: string[] = [];
      for (let k = 0; k <= 9; k++) {
        for (let e = 0; e <= 9; e++) {
          if (!AI.includes(k) && !AI.includes(e)) continue;
          if (customIncludeBBFS && (!BBFS.includes(k) || !BBFS.includes(e))) continue;
          if (LK.includes(k) || LE.includes(e)) continue;
          if (LJ.includes(j2d(k, e))) continue;
          if (LS.includes(shioOf2D(k * 10 + e))) continue;
          lines.push(`${k}${e}`);
        }
      }

      const customResult: RekapCustomResult = {
        custom: true,
        ai: AI,
        bbfs: BBFS,
        includeBBFS: customIncludeBBFS,
        offKepala: LK,
        offEkor: LE,
        offJumlah: LJ,
        offShio: LS,
        lines,
      };
      setResult(customResult);
    } catch (e: any) {
      setError(e.message || "Gagal generate custom line");
    }
    setLoading(false);
  };

  const renderOptionButton = (active: boolean, label: string, onClick: () => void, extraClass = "") => (
    <button
      type="button"
      onClick={onClick}
      className={`${extraClass} rounded-3xl border p-4 text-center transition active:scale-95`}
      style={{ borderColor: active ? meta.accent : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--text-dim)" }}
    >
      <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{label}</span>
    </button>
  );

  const renderParamSelector = () => {
    if (param !== 0) return null;
    const options: any = {
      ai: { title: "PILIH JUMLAH DIGIT AI", values: [4, 6, 8], labels: { 8: "BBFS" } },
      mati: { title: "PILIH JUMLAH DIGIT OFF", values: [1, 2, 3, 4] },
      jumlah: { title: "PILIH JUMLAH OFF", values: [1, 2] },
      shio: { title: "PILIH JUMLAH SHIO MATI", values: [1, 2] },
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
              <button key={n} onClick={() => handleAnalyze(n)} className={`${isWideBBFS ? "col-span-2 sm:col-span-4" : ""} rounded-3xl border p-5 text-center transition active:scale-95`} style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
                <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">{cfg.labels?.[n] || n}</span>
              </button>
            );
          })}
          {type === "rekap" && (
            <button onClick={() => { setParam(3); setResult(null); setError(""); }} className="col-span-2 rounded-3xl border p-5 text-center transition active:scale-95 sm:col-span-4" style={{ borderColor: meta.accent, backgroundColor: meta.soft, color: meta.accent }}>
              <span className="block font-['Orbitron'] text-xl font-black tracking-[2px]">ATUR LINE</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCustomRekapBuilder = () => {
    if (type !== "rekap" || param !== 3 || result) return null;
    return (
      <div className="premium-panel mt-4 space-y-4 p-4">
        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Atur Line</div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-dim)]">Pilih filter yang mau dipakai, lalu generate.</p>
        </div>

        <section className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">AI</div>
          <div className="grid grid-cols-2 gap-2">
            {renderOptionButton(customAiDigit === 4, "4 Digit", () => setCustomAiDigit(4))}
            {renderOptionButton(customAiDigit === 6, "6 Digit", () => setCustomAiDigit(6))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">BBFS</div>
          {renderOptionButton(customIncludeBBFS, "Include BBFS", () => setCustomIncludeBBFS((v) => !v), "w-full")}
        </section>

        <section className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Angka Mati Kepala/Ekor</div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => renderOptionButton(customOffDigitCount === n, String(n), () => setCustomOffDigitCount(customOffDigitCount === n ? null : n)))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Jumlah Mati</div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((n) => renderOptionButton(customOffJumlahCount === n, String(n), () => setCustomOffJumlahCount(customOffJumlahCount === n ? null : n)))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Shio Mati</div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((n) => renderOptionButton(customOffShioCount === n, String(n), () => setCustomOffShioCount(customOffShioCount === n ? null : n)))}
          </div>
        </section>

        <button onClick={handleCustomRekapGenerate} className="primary-button flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Generate</button>
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

  const renderDigitPills = (items: any[], accent: string, compact = true, singleLine = false, center = false) => (
    <div className={`${singleLine ? `flex flex-nowrap ${center ? "justify-center" : "justify-end"} gap-1 overflow-x-auto pb-1` : `flex flex-wrap ${center ? "justify-center" : "justify-end"} gap-2`}`}>
      {items.map((item: any, i: number) => (
        <div key={i} className={`${singleLine ? "h-10 min-w-9 shrink-0 px-2 text-[16px]" : compact ? "h-10 min-w-10 px-3 text-[16px]" : "h-13 min-w-13 px-3 text-[22px]"} flex items-center justify-center rounded-2xl border font-['Orbitron'] font-black`} style={{ borderColor: accent, backgroundColor: `${accent}14`, color: "var(--text)" }}>
          {item}
        </div>
      ))}
    </div>
  );

  const ResultRow = ({ label, values, accent, shio = false }: any) => (
    <div className="flex min-h-[72px] items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
      <span className="shrink-0 font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span>
      <div className="min-w-0 flex-1">
        {shio ? <div className="flex flex-wrap justify-end gap-2">{safeArray(values).map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : renderDigitPills(safeArray(values), accent, true)}
      </div>
    </div>
  );

  const MainResultCard = ({ label, values, accent, shio = false, singleLine = false, stacked = false }: any) => {
    const arr = safeArray(values);
    return (
      <div className="premium-panel result-glow relative overflow-hidden p-5">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${accent}22` }} />
        <div className="relative mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[2px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <Trophy size={12} /> Hasil Utama
        </div>
        {stacked ? (
          <div className="relative rounded-3xl border border-[var(--border2)] bg-black/20 p-4 text-center">
            <h3 className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">{label}</h3>
            <div className="mt-4">
              {shio ? <div className="flex flex-wrap justify-center gap-2">{arr.map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : renderDigitPills(arr, accent, false, singleLine, true)}
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
            <h3 className="shrink-0 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">{label}</h3>
            <div className="min-w-0 flex-1">
              {shio ? <div className="flex flex-wrap justify-end gap-2">{arr.map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div> : renderDigitPills(arr, accent, false, singleLine)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLineBox = (label: string, lines: string[]) => {
    const copyPayload = lines.join(" * ");
    return (
      <div key={label} className="rounded-3xl border border-[var(--border2)] bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">{label}</span>
          <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: meta.soft, color: meta.accent }}>{lines.length} LINE</span>
        </div>
        <div className="max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--border2)] bg-black/30 p-4 font-['JetBrains_Mono'] text-[14px] font-bold leading-8 tracking-[2px] custom-scrollbar" style={{ color: meta.accent }}>{copyPayload || "-"}</div>
        <button onClick={() => copyText(copyPayload)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-3xl p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-black transition active:scale-95" style={{ backgroundColor: meta.accent }}><Copy size={16} /> Copy Semua</button>
      </div>
    );
  };

  const renderAngkaJadiPanel = () => {
    if (!result || !angkaJadiModes.has(type)) return null;
    const data = buildAngkaJadi();

    return (
      <div className="premium-panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle accent={meta.accent} title="Angka Jadi" />
          <DetailToggle open={angkaJadiOpen} accent={meta.accent} onClick={() => setAngkaJadiOpen((open) => !open)} />
        </div>
        {angkaJadiOpen && (
          <div className="space-y-3 pt-1">
            {data.sections.map((section) => renderLineBox(section.label, section.lines))}
          </div>
        )}
      </div>
    );
  };

  const renderEvaluationHistory = () => {
    if (!evaluationModes.has(type) || !param || param === 0) return null;
    return (
      <div className="premium-panel space-y-3 p-4">
        <EvaluationHistory marketId={marketId} mode={type as any} param={param} />
      </div>
    );
  };

  const renderRekap = () => {
    const isTop = param === 2;
    const isCustom = Boolean(result?.custom);
    const mode = isTop ? "top" : "invest";
    const lines = safeArray(result.lines);
    const rows = isCustom ? [
      ["AI", safeArray(result.ai).join(" "), "🔥", "#f3c14b"],
      ...(safeArray(result.bbfs).length ? [["BBFS", safeArray(result.bbfs).join(" "), "✨", "#f3c14b"]] : []),
      ...(safeArray(result.offKepala).length ? [["OFF KEP", safeArray(result.offKepala).join(" . "), "🎯", "#ff647c"]] : []),
      ...(safeArray(result.offEkor).length ? [["OFF EKR", safeArray(result.offEkor).join(" . "), "🎯", "#ff647c"]] : []),
      ...(safeArray(result.offJumlah).length ? [["OFF JML", safeArray(result.offJumlah).join(" . "), "🔢", "#b58cff"]] : []),
    ] : [
      [isTop ? "AI TOP" : "AI CT", safeArray(result.ai).join(" "), "🔥", "#f3c14b"],
      ["OFF KEP", safeArray(result.offKepala).join(" . "), "🎯", "#ff647c"],
      ["OFF EKR", safeArray(result.offEkor).join(" . "), "🎯", "#ff647c"],
      ["OFF JML", safeArray(result.offJumlah).join(" . "), "🔢", "#b58cff"],
    ];

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <div className="premium-panel result-glow p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Hasil Rekap</p>
              <h3 className="font-['Orbitron'] text-[18px] font-black uppercase tracking-[3px] text-[var(--text)]">Mode {isCustom ? "Atur Line" : isTop ? "Top" : "Invest"}</h3>
            </div>
            <span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>READY</span>
          </div>
          <div className="space-y-3">
            {rows.map(([label, value, emoji, color]: any) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
                <div className="flex shrink-0 items-center gap-3"><span className="text-base">{emoji}</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span></div>
                <span className="min-w-0 text-right font-['Orbitron'] text-[13px] font-black tracking-[2px]" style={{ color }}>{value || "-"}</span>
              </div>
            ))}
            {safeArray(result.offShio).length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border2)] bg-black/20 p-3">
                <div className="flex shrink-0 items-center gap-3"><span className="text-base">🐲</span><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">OFF SHIO</span></div>
                <div className="flex flex-wrap justify-end gap-2">{safeArray(result.offShio).map((s: any, i: number) => <ShioChip key={`${s}-${i}`} value={s} />)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="premium-panel space-y-3 p-4">
          <div className="flex items-center justify-between"><span className="font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">Generate Lines</span><span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ backgroundColor: meta.soft, color: meta.accent }}>{lines.length} LINE</span></div>
          <div className="max-h-[260px] overflow-y-auto rounded-3xl border border-[var(--border2)] bg-black/30 p-4 font-['JetBrains_Mono'] text-[14px] font-bold leading-8 tracking-[2px] custom-scrollbar" style={{ color: meta.accent }}>{lines.join(" * ")}</div>
          <button onClick={() => copyText(lines.join("*"))} className="flex w-full items-center justify-center gap-2 rounded-3xl p-4 font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-black transition active:scale-95" style={{ backgroundColor: meta.accent }}><Copy size={16} /> Copy Semua</button>
        </div>

        {!isCustom && (
          <div className="premium-panel space-y-3 p-4">
            <RekapHistory marketId={marketId} mode={mode} />
          </div>
        )}
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
          <ResultHeader label="HASIL ANALISA" value={`RUMUS ACTIVE ${totalActive}/53`} accent={meta.accent} />
          <div className="premium-panel space-y-3 p-4">
            {POS.map((p) => <ResultRow key={p} label={`OFF ${p}`} values={result[p]?.result} accent={meta.accent} />)}
          </div>
          <div className="premium-panel space-y-5 p-4">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle accent={meta.accent} title="Detail Validasi" />
              <DetailToggle open={detailValidationOpen} accent={meta.accent} onClick={() => setDetailValidationOpen((open) => !open)} />
            </div>
            {detailValidationOpen && POS.map((p) => <section key={p} className="space-y-3"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>{p}</span><div className="h-px flex-1 bg-white/10" /></div>{renderStatsList(statsFrom(result[p]), meta.accent)}</section>)}
          </div>
          {renderAngkaJadiPanel()}
          {renderEvaluationHistory()}
        </div>
      );
    }

    const stats = safeArray(result.stats);
    const displayResult = safeArray(result.result);
    const active = result.elitCount ?? result.eliteTotal ?? stats.length;
    const formulaTotal = type === "ai" ? 35 : type === "jumlah" ? 51 : 50;
    const isBBFSResult = type === "ai" && param === 8;
    const resultLabel = isBBFSResult ? "BBFS" : meta.label;

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <MainResultCard label={resultLabel} values={displayResult} accent={meta.accent} shio={type === "shio"} singleLine={isBBFSResult} stacked={type === "ai"} />
        <ResultHeader label="VALIDASI" value={`RUMUS ACTIVE ${active}/${formulaTotal}`} accent={meta.accent} />
        <div className="premium-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle accent={meta.accent} title="Detail Validasi" />
            <DetailToggle open={detailValidationOpen} accent={meta.accent} onClick={() => setDetailValidationOpen((open) => !open)} />
          </div>
          {detailValidationOpen && <div className="mt-4">{renderStatsList(stats, meta.accent)}</div>}
        </div>
        {renderAngkaJadiPanel()}
        {renderEvaluationHistory()}
      </div>
    );
  };

  const isRekapCustom = type === "rekap" && param === 3;

  return (
    <div className={`analysis-mode-${type} animate-[fadeIn_0.35s_ease-out] pb-8`}>
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
        <div className="relative rounded-3xl bg-black/25 p-4 text-center ring-1 ring-white/10"><span className="mr-3 text-[10px] font-black uppercase tracking-[3px]" style={{ color: meta.accent }}>Pasaran:</span><span className="font-['Orbitron'] text-[13px] font-black uppercase tracking-[4px] text-[var(--text)]">{marketId}</span></div>
      </div>
      {!result && !loading && param !== 0 && !isRekapCustom && <button onClick={() => handleAnalyze()} className="primary-button mb-4 flex w-full items-center justify-center gap-3 p-5 font-['Orbitron'] text-[12px] font-black uppercase tracking-[4px] transition active:scale-95"><RefreshCw size={18} /> Mulai Analisa</button>}
      {renderParamSelector()}
      {renderCustomRekapBuilder()}
      {loading && <div className="premium-panel my-4 flex flex-col items-center justify-center gap-4 p-8 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10" style={{ borderTopColor: meta.accent }} /><div className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[3px] text-[var(--text-dim)]">Memproses Analisa</div></div>}
      {error && <div className="my-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-center text-[12px] font-bold text-red-300">{error}</div>}
      {renderResult()}
    </div>
  );
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return <div className="flex items-center gap-2"><BarChart3 size={16} style={{ color: accent }} /><span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">{title}</span></div>;
}

function DetailToggle({ open, accent, onClick }: { open: boolean; accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[1px] active:scale-95"
      style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }}
      aria-label={open ? "Tutup" : "Buka"}
    >
      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      {open ? "Tutup" : "Buka"}
    </button>
  );
}

function ResultHeader({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className="premium-panel flex items-center justify-between gap-3 p-4"><span className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</span><span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ backgroundColor: `${accent}1f`, color: accent }}>{value}</span></div>;
}

function ShioChip({ value }: { value: any }) {
  const normalized = Number(String(value ?? '').match(/\d+/)?.[0] ?? value);
  const safeValue = Number.isFinite(normalized) && normalized >= 1 && normalized <= 12 ? normalized : 0;
  const label = safeValue ? `${safeValue < 10 ? '0' + safeValue : safeValue} ${SHIO_NAMES[safeValue]}` : String(value ?? '-');
  const emoji = safeValue ? SHIO_EMOJI[safeValue] : '🐾';
  return <span className="inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-[11px] font-black" style={{ borderColor: "rgba(40,215,255,0.35)", backgroundColor: "rgba(40,215,255,0.14)", color: "#28d7ff" }}>{emoji} {label}</span>;
}

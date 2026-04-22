import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const SHIO_NAMES=['','Kuda','Ular','Naga','Kelinci','Harimau','Kerbau','Tikus','Babi','Anjing','Ayam','Monyet','Kambing'];
const SHIO_EMOJI=['','🐴','🐍','🐉','🐰','🐯','🐂','🐭','🐷','🐕','🐔','🐒','🐐'];

export default function AnalysisPage({ type, title, icon, marketId }: { type: string; title: string; icon: string; marketId: string }) {
  const navigate = useNavigate();
  const [param, setParam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const needsParam = type === "ai" || type === "mati" || type === "shio" || type === "jumlah" || type === "rekap";

  const handleAnalyze = async (p?: number) => {
    
    if (needsParam && !p && param === null) {
        setParam(0);
        setError("");
        return;
    }

    const selectedParam = p || param || 1;
    if (needsParam) setParam(selectedParam);
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
        const snap = await getDoc(doc(db, 'markets', marketId));
        if (!snap.exists()) {
            setError(`Data histori ${marketId} belum disetup oleh Admin!`);
            setLoading(false);
            return;
        }

        const dataString = snap.data().historyData || "";
        const rawTokens = dataString.split(/[\s\n\r\t,]+/);
        // Kita balik (reverse) datanya jika Admin input Terbaru di Atas
        const data = rawTokens.filter((token: string) => /^\d{4}$/.test(token)).reverse();
        
        if (!data || data.length < 17) {
            setError(`Data dari server kurang! (Min 17 result)`);
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("supreme_token");
        
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ type, data, param: selectedParam })
        });
        const json = await res.json();
        if (json.success || json.data) {
            setResult(json.data || json);
        } else if (json.error) {
            setError(json.error);
        } else {
            setResult(json);
        }
    } catch (e: any) {
        setError("Error koneksi server: " + e.message);
    }
    setLoading(false);
  };

  const titleColors: any = {
    ai: "text-[var(--gold)]",
    mati: "text-[var(--red)]",
    jumlah: "text-[var(--purple)]",
    shio: "text-[var(--cyan)]",
    rekap: "text-[#60a5fa]",
  };

  const btnColors: any = {
    ai: "bg-gradient-to-br from-[var(--gold)] to-[#c88a20] text-[#08060a] shadow-[0_4px_20px_rgba(240,192,64,0.25)]",
    mati: "bg-gradient-to-br from-[var(--red)] to-[#a83030] text-[#fff] shadow-[0_4px_20px_rgba(255,82,82,0.2)]",
    jumlah: "bg-gradient-to-br from-[var(--purple)] to-[#7340d4] text-[#fff] shadow-[0_4px_20px_rgba(179,136,255,0.2)]",
    shio: "bg-gradient-to-br from-[var(--green)] to-[#00a855] text-[#000] shadow-[0_4px_20px_rgba(0,230,118,0.2)]",
    rekap: "bg-gradient-to-br from-[var(--blue)] to-[#2563eb] text-[#fff] shadow-[0_4px_20px_rgba(68,138,255,0.25)]",
  };

  const renderParamSelector = () => {
    if (!needsParam || param !== 0) return null;
    
    if (type === "ai") {
        return (
            <div className="mt-4 text-center">
                <div className="text-[10px] font-semibold tracking-[3px] mb-[10px] mt-[14px] font-['JetBrains_Mono'] text-[var(--green)] uppercase">PILIH JUMLAH DIGIT AI</div>
                <div className="flex gap-2">
                    {[2, 4, 6, 8].map(n => (
                        <button key={n} onClick={() => handleAnalyze(n)} className="flex-1 bg-black/40 border-[1.5px] border-[var(--gold)] text-[var(--gold)] p-[14px_0] text-[20px] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(240,192,64,0.08)] hover:scale-[0.93] transition-all outline-none">
                            {n}
                            {n === 8 && <span className="block text-[8px] tracking-[1px] opacity-60 mt-[3px] font-['JetBrains_Mono']">BBFS</span>}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (type === "mati") {
        return (
            <div className="mt-4 text-center">
                <div className="text-[10px] font-semibold tracking-[3px] mb-[10px] mt-[14px] font-['JetBrains_Mono'] text-[var(--red)] uppercase">PILIH JUMLAH DIGIT OFF</div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => handleAnalyze(n)} className="flex-1 bg-black/40 border-[1.5px] border-[var(--red)] text-[var(--red)] p-[14px_0] text-[20px] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(255,82,82,0.08)] hover:scale-[0.93] transition-all outline-none">
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (type === "jumlah") {
        return (
            <div className="mt-4 text-center">
                <div className="text-[10px] font-semibold tracking-[3px] mb-[10px] mt-[14px] font-['JetBrains_Mono'] text-[var(--purple)] uppercase">PILIH JUMLAH OFF</div>
                <div className="flex gap-2">
                    {[1, 2].map(n => (
                        <button key={n} onClick={() => handleAnalyze(n)} className="flex-1 bg-black/40 border-[1.5px] border-[var(--purple)] text-[var(--purple)] p-[14px_0] text-[20px] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(179,136,255,0.1)] hover:scale-[0.93] transition-all outline-none">
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (type === "shio") {
        return (
            <div className="mt-4 text-center">
                <div className="text-[10px] font-semibold tracking-[3px] mb-[10px] mt-[14px] font-['JetBrains_Mono'] text-[var(--cyan)] uppercase">PILIH JUMLAH SHIO MATI</div>
                <div className="flex gap-2">
                    {[1, 2].map(n => (
                        <button key={n} onClick={() => handleAnalyze(n)} className="flex-1 bg-black/40 border-[1.5px] border-[var(--cyan)] text-[var(--cyan)] p-[14px_0] text-[20px] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(0,229,255,0.1)] hover:scale-[0.93] transition-all outline-none">
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (type === "rekap") {
        return (
            <div className="mt-4 text-center">
                <div className="text-[10px] font-semibold tracking-[3px] mb-[10px] mt-[14px] font-['JetBrains_Mono'] text-[#60a5fa] uppercase">PILIH MODE REKAP</div>
                <div className="flex gap-2">
                    <button onClick={() => handleAnalyze(1)} className="flex-1 bg-black/40 border-[1.5px] border-[#60a5fa] text-[#60a5fa] p-[12px_0] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(96,165,250,0.1)] hover:scale-[0.93] transition-all outline-none">
                        <span className="block text-[15px] mb-[2px] tracking-[2px]">INVEST</span>
                        <span className="block text-[8px] tracking-[1px] opacity-70 font-['JetBrains_Mono']">Standard</span>
                    </button>
                    <button onClick={() => handleAnalyze(2)} className="flex-1 bg-black/40 border-[1.5px] border-[#60a5fa] text-[#60a5fa] p-[12px_0] font-bold font-['Orbitron'] rounded-[var(--radius-sm)] shadow-[0_0_12px_rgba(96,165,250,0.1)] hover:scale-[0.93] transition-all outline-none">
                        <span className="block text-[15px] mb-[2px] tracking-[2px]">TOP</span>
                        <span className="block text-[8px] tracking-[1px] opacity-70 font-['JetBrains_Mono']">Premium</span>
                    </button>
                </div>
            </div>
        );
    }
    return null;
  };

  const renderResult = () => {
    if (!result) return null;

    if (type === "rekap") {
        const isTop = param === 2;
        return (
            <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-[16px] mt-3 font-['JetBrains_Mono'] relative overflow-hidden text-left animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-between items-end border-b border-[var(--border2)] pb-3 mb-4">
                    <div className="text-left">
                        <div className="text-[9px] text-[var(--gray)] tracking-[2px] mb-1 uppercase font-bold">HASIL REKAP</div>
                        <div className="text-[14px] text-white font-bold tracking-[2px] font-['Orbitron'] underline underline-offset-4 decoration-[var(--blue)]">{marketId.toUpperCase()} 📌</div>
                    </div>
                    <div className="text-[9px] font-bold bg-blue-500/10 border border-blue-500/40 text-[var(--blue)] px-2 py-1 rounded tracking-[1px] uppercase">
                        {isTop ? 'TOP' : 'INVEST'}
                    </div>
                </div>

                <div className="flex flex-col gap-[6px] mb-5">
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 px-3 rounded border border-white/[0.04]">
                        <span className="text-[9px] text-slate-300 font-bold tracking-[1px] w-[80px] uppercase">{isTop ? 'AI TOP' : 'CT'}</span>
                        <span className="text-[14px] font-bold text-[var(--gold)] tracking-[3px] font-['Orbitron']">{result.ai.join(" ")}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 px-3 rounded border border-white/[0.04]">
                        <span className="text-[9px] text-slate-300 font-bold tracking-[1px] w-[80px] uppercase">OFF KEP</span>
                        <span className="text-[13px] font-bold text-[#ff6b6b] drop-shadow-[0_0_2px_rgba(255,107,107,0.4)] tracking-[2px]">{(result.offKepala || []).join(" . ")}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 px-3 rounded border border-white/[0.04]">
                        <span className="text-[9px] text-slate-300 font-bold tracking-[1px] w-[80px] uppercase">OFF EKR</span>
                        <span className="text-[13px] font-bold text-[#ff6b6b] drop-shadow-[0_0_2px_rgba(255,107,107,0.4)] tracking-[2px]">{(result.offEkor || []).join(" . ")}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 px-3 rounded border border-white/[0.04]">
                        <span className="text-[9px] text-slate-300 font-bold tracking-[1px] w-[80px] uppercase">OFF JML</span>
                        <span className="text-[13px] font-bold text-[#b388ff] drop-shadow-[0_0_2px_rgba(179,136,255,0.4)] tracking-[2px]">{(result.offJumlah || []).join(" . ")}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 px-3 rounded border border-white/[0.04] text-right">
                        <span className="text-[9px] text-slate-300 font-bold tracking-[1px] w-[80px] shrink-0 uppercase">OFF SHIO</span>
                        <span className="text-[11px] font-bold text-[#00e5ff] drop-shadow-[0_0_2px_rgba(0,229,255,0.4)] tracking-[1px] leading-tight flex flex-wrap justify-end gap-1">
                             {(result.offShio || []).map((s: number) => `${SHIO_EMOJI[s]}${s < 10 ? '0'+s : s}`).join(" ")}
                        </span>
                    </div>
                </div>

                <div className="relative pt-3 border-t border-[var(--border2)]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-white tracking-[2px] font-['Orbitron'] uppercase">GENERATE LINES</span>
                        <span className="text-[9px] font-bold text-black bg-gradient-to-r from-[var(--gold)] to-[#c88a20] px-2 py-1 rounded shadow-[0_0_10px_rgba(240,192,64,0.3)] tracking-[1px]">
                            {result.lines.length} LNS
                        </span>
                    </div>
                    
                    <div className="bg-[#05080f] border border-[var(--border)] rounded p-4 text-[13px] text-[var(--blue)] font-bold leading-[2.1] text-left break-all shadow-inner font-['Rajdhani'] tracking-[2px] max-h-[200px] overflow-y-auto">
                        {result.lines.join("*")}
                    </div>
                </div>

                <button onClick={() => { navigator.clipboard.writeText(result.lines.join("*")); alert("BERHASIL DISALIN!"); }} className="mt-4 flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[var(--blue)] to-[#2563eb] text-white p-3.5 font-['Orbitron'] font-bold text-[12px] tracking-[4px] rounded hover:scale-[0.98] transition-transform shadow-[0_5px_15px_rgba(37,99,235,0.2)]">
                    📋 COPY SEMUA
                </button>
            </div>
        );
    }

    if (type === "ai") {
        const { stats = [], elitCount = 0, fallback = false, result: aiResult = [] } = result;
        const isBBFS = param && param >= 8;
        return (
            <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-[12px] mt-3 font-['JetBrains_Mono'] text-left animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-green-500/10 border-l-[3px] border-[var(--green)] p-3 text-center mb-3 font-bold text-[11px] tracking-[3px] font-['Orbitron'] text-[var(--green)] rounded">
                    ⚡ {isBBFS ? 'BBFS' : 'ANGKA IKUT'} (25 RUMUS)
                </div>
                
                <div className="space-y-1 mt-4">
                    {stats.map((s: any, i: number) => {
                        const pct = s.valid > 0 ? Math.round((s.hits / s.valid) * 100) : 0;
                        return (
                            <div key={i} className="flex items-center gap-2 p-1.5 rounded text-[9px] bg-white/[0.01] border border-transparent">
                                <span className="text-[8px] font-bold p-1 px-2 rounded bg-green-500/10 text-[var(--green)] border border-green-500/20 tracking-[1px] font-['Orbitron']">ELITE</span>
                                <span className="flex-1 text-white opacity-80 uppercase tracking-[0.5px]">{s.name}</span>
                                <span className="text-right text-[var(--green)] font-bold">[{s.hits}/{s.valid}]</span>
                            </div>
                        );
                    })}
                </div>

                <div className="border border-[var(--green)] bg-green-500/10 rounded-lg p-5 my-5 text-center shadow-inner">
                    <div className="text-[var(--green)] text-[12px] font-bold mb-3 tracking-[3px] font-['Orbitron'] uppercase">✅ {isBBFS ? 'BBFS 8 DIGIT' : `AI ${param} DIGIT`}</div>
                    <div className="flex justify-center gap-2 flex-wrap">
                        {aiResult.map((d: number, i: number) => (
                            <div key={i} className="w-9 h-9 flex items-center justify-center border border-[var(--green)] bg-green-500/10 rounded text-[18px] font-extrabold text-white font-['Orbitron'] shadow-md">
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/30 rounded p-3 mt-4 text-[9px] text-[var(--gray)] leading-relaxed tracking-[0.5px] border border-[var(--border)] italic">
                    📌 Validasi: 14 Langkah WF • Active: {elitCount}/25 {fallback ? '(Low Conf)' : ''}<br/>
                    📌 Mode: {isBBFS ? 'Full BBFS' : `${param} Digit Selection`}
                </div>
            </div>
        );
    }
    
    if (type === "mati") {
        const POS = ['AS', 'KOP', 'KEPALA', 'EKOR'];
        return (
            <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-[12px] mt-3 font-['JetBrains_Mono'] text-left animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-red-500/10 border-l-[3px] border-[var(--red)] p-3 text-center mb-3 font-bold text-[11px] tracking-[3px] font-['Orbitron'] text-[var(--red)] rounded">
                    💀 ANGKA MATI (50 RUMUS)
                </div>
                
                <div className="border border-[var(--red)] bg-red-500/10 rounded-lg p-5 my-5 space-y-3 shadow-inner">
                    {POS.map(p => {
                        const posData = result[p];
                        if (!posData) return null;
                        return (
                            <div key={p} className="flex items-center justify-between p-2 px-3 rounded bg-white/[0.02] border border-white/[0.04]">
                                <span className="text-[10px] font-bold text-[var(--red)] tracking-[2px] font-['Orbitron'] shrink-0">OFF {p}</span>
                                <div className="flex gap-1.5 justify-end">
                                    {posData.result.map((d: string, i: number) => (
                                        <div key={i} className="w-8 h-8 flex items-center justify-center border border-[var(--red)] bg-red-500/20 rounded text-[16px] font-extrabold text-white font-['Orbitron'] shadow-sm">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="bg-black/30 rounded p-3 mt-4 text-[9px] text-[var(--gray)] leading-relaxed tracking-[0.5px] border border-[var(--border)] italic">
                    📌 Validasi: 14 Langkah Teruji • State: PERFECT<br/>
                    📌 Mode: {param} Digit Off per Posisi
                </div>
            </div>
        );
    }
    
    if (type === "jumlah") {
        const resArray = Array.isArray(result.result) ? result.result : [result.result];
        return (
            <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-[12px] mt-3 font-['JetBrains_Mono'] text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-purple-500/10 border-l-[3px] border-[var(--purple)] p-3 text-center mb-3 font-bold text-[11px] tracking-[3px] font-['Orbitron'] text-[var(--purple)] rounded">
                    🔢 JUMLAH MATI 2D
                </div>
                
                <div className="border border-[var(--purple)] bg-purple-500/10 rounded-lg p-6 my-6 shadow-inner mx-auto max-w-[280px]">
                    <div className="text-[var(--purple)] text-[12px] font-bold mb-4 tracking-[3px] font-['Orbitron'] uppercase">❌ OFF JUMLAH</div>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {resArray.map((d: string, i: number) => (
                            <div key={i} className="w-10 h-10 flex items-center justify-center border border-[var(--purple)] bg-purple-500/20 rounded text-[20px] font-extrabold text-white font-['Orbitron'] shadow-md">
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/30 rounded p-3 mt-4 text-[9px] text-[var(--gray)] leading-relaxed tracking-[0.5px] border border-[var(--border)] italic text-left">
                    📌 Validasi: 14 Langkah WF • Sigma 50 Rumus<br/>
                    📌 Elite Support: {result.supportCount}/{result.eliteTotal} Patterns
                </div>
            </div>
        );
    }
    
    if (type === "shio") {
        const resArray = Array.isArray(result.result) ? result.result : [result.result];
        return (
            <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-[12px] mt-3 font-['JetBrains_Mono'] text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-cyan-500/10 border-l-[3px] border-[var(--cyan)] p-3 text-center mb-3 font-bold text-[11px] tracking-[3px] font-['Orbitron'] text-[var(--cyan)] rounded">
                    🐉 SHIO MATI
                </div>
                
                <div className="border border-[var(--cyan)] bg-cyan-500/10 rounded-lg p-6 my-6 shadow-inner mx-auto max-w-[280px]">
                    <div className="text-[var(--cyan)] text-[12px] font-bold mb-4 tracking-[4px] font-['Orbitron'] uppercase">❌ OFF SHIO</div>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {resArray.map((s: number, i: number) => (
                            <div key={i} className="h-11 px-4 flex items-center justify-center gap-2.5 border border-[var(--cyan)] bg-cyan-500/20 rounded text-[16px] font-extrabold text-white font-['Orbitron'] shadow-md">
                                <span className="text-xl drop-shadow-md">{SHIO_EMOJI[s]}</span>
                                <span className="tracking-[1px]">{s < 10 ? '0'+s : s}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/30 rounded p-3 mt-4 text-[9px] text-[var(--gray)] leading-relaxed tracking-[0.5px] border border-[var(--border)] italic text-left">
                    📌 Validasi: 14 Langkah WF • 50 Modulo Rumus<br/>
                    📌 Elite Support: {result.supportCount}/{result.eliteTotal} Patterns
                </div>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="animate-[slideIn_0.22s_ease-out]">
      <div className="flex items-center gap-2.5 mb-5 pb-2.5 border-b border-[var(--border2)]">
        <span className="text-2xl drop-shadow-md">{icon}</span>
        <h3 className={`font-['Orbitron'] text-[14px] font-bold tracking-[3px] m-0 ${titleColors[type]}`}>{title}</h3>
      </div>

      <div className="bg-black/40 border border-[var(--border2)] rounded-[var(--radius-sm)] p-3.5 mb-5 text-center font-['Orbitron'] shadow-inner">
        <span className="text-[11px] text-[var(--gold)] font-bold tracking-[3px] uppercase">PASARAN: {marketId}</span>
      </div>

      {error && (
        <div className="text-center text-[10px] p-3 mb-4 font-bold font-['JetBrains_Mono'] text-red-500 bg-red-500/5 border border-red-500/20 rounded uppercase tracking-[1px] animate-pulse">
            {error}
        </div>
      )}

      {(param === null || !needsParam) && !loading && !result && (
          <button onClick={() => handleAnalyze()} className={`w-full p-4 font-['Orbitron'] font-bold text-[12px] tracking-[4px] rounded hover:scale-[0.98] transition-all uppercase outline-none ${btnColors[type]}`}>
             MULAI ANALISIS
          </button>
      )}

      {renderParamSelector()}

      {loading && (
        <div className="text-center p-8 text-[var(--cyan)] font-['Orbitron'] text-[10px] font-bold tracking-[6px] animate-pulse">
            <span className="inline-block animate-bounce mr-1">⚡</span> MENGANALISIS...
        </div>
      )}

      {renderResult()}

      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full bg-black/40 text-[var(--text-dim)] border border-[var(--border)] p-3 mt-6 text-[10px] font-bold font-['JetBrains_Mono'] tracking-[3px] rounded hover:border-[var(--cyan)] hover:text-[var(--cyan)] hover:bg-[var(--card2)] transition-all cursor-pointer uppercase outline-none">
        ← KEMBALI
      </button>
    </div>
  );
}

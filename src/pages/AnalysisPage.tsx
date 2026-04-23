import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
        const resMarkets = await fetch("/api/markets");
        const allMarkets = await resMarkets.json();
        const currentMarket = allMarkets.find((m: any) => m.id === marketId);
        
        if (!currentMarket) {
            setError(`Data histori ${marketId} belum disetup oleh Admin!`);
            setLoading(false);
            return;
        }

        const dataString = currentMarket.historyData || "";
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
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Section Header */}
                <div className="bg-[var(--card)] border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-bold text-white/40 tracking-[2px] uppercase">HASIL ANALISA</span>
                        <div className="text-[9px] font-bold bg-blue-500/10 border border-blue-500/40 text-[var(--blue)] px-2 py-1 rounded tracking-[1px] uppercase">
                            MODE: {isTop ? 'TOP' : 'INVEST'}
                        </div>
                    </div>
                    <div className="text-[16px] text-white font-black tracking-[2px] font-['Orbitron'] flex items-center gap-2">
                        {marketId.toUpperCase()} 📌
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-[var(--surface)] border border-white/10 rounded-xl p-5 space-y-3.5 shadow-2xl">
                    <div className="flex justify-between items-center bg-white/[0.02] p-3 px-4 rounded-lg border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">🔥</span>
                            <span className="text-[10px] text-white/60 font-bold tracking-[2px] uppercase">{isTop ? 'AI TOP' : 'AI CT'}</span>
                        </div>
                        <span className="text-[15px] font-black text-[var(--gold)] tracking-[4px] font-['Orbitron']">{result.ai.join(" ")}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/[0.02] p-3 px-4 rounded-lg border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">❌</span>
                            <span className="text-[10px] text-white/60 font-bold tracking-[2px] uppercase">OFF KEP</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#ff5252] tracking-[3px] opacity-90">{(result.offKepala || []).join(" . ")}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/[0.02] p-3 px-4 rounded-lg border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">❌</span>
                            <span className="text-[10px] text-white/60 font-bold tracking-[2px] uppercase">OFF EKR</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#ff5252] tracking-[3px] opacity-90">{(result.offEkor || []).join(" . ")}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/[0.02] p-3 px-4 rounded-lg border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">🔢</span>
                            <span className="text-[10px] text-white/60 font-bold tracking-[2px] uppercase">OFF JML</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#b388ff] tracking-[3px] opacity-90">{(result.offJumlah || []).join(" . ")}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/[0.02] p-3 px-4 rounded-lg border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">🐉</span>
                            <span className="text-[10px] text-white/60 font-bold tracking-[2px] uppercase">OFF SHIO</span>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                             {(result.offShio || []).map((s: number) => (
                                 <span key={s} className="text-[11px] font-bold text-[#00e5ff] flex items-center gap-1 bg-cyan-500/5 p-1 px-2 rounded">
                                     {SHIO_EMOJI[s]} {s < 10 ? '0'+s : s}
                                 </span>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Lines Generator Card */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[11px] font-black text-white/80 tracking-[2px] font-['Orbitron'] uppercase">GENERATE LINES</span>
                        <span className="text-[9px] font-bold text-black bg-gradient-to-r from-[var(--gold)] to-[#c88a20] px-2 py-1 rounded shadow-[0_0_10px_rgba(240,192,64,0.3)] tracking-[1px] uppercase">
                            {result.lines.length} LINE 💰
                        </span>
                    </div>
                    
                    <div className="bg-[#05080f] border border-white/10 rounded-xl p-5 text-[14px] text-[var(--blue)] font-bold leading-[2.2] shadow-inner font-['Rajdhani'] tracking-[3px] max-h-[220px] overflow-y-auto">
                        {result.lines.join(" * ")}
                    </div>

                    <button 
                        onClick={() => { 
                            navigator.clipboard.writeText(result.lines.join("*")); 
                        }} 
                        className="flex items-center justify-center gap-3 w-full bg-[#1a2b5e] border border-[#2563eb]/30 text-white p-4 font-['Orbitron'] font-black text-[12px] tracking-[4px] rounded-xl hover:bg-[#2563eb] transition-all shadow-lg uppercase"
                    >
                        📋 COPY SEMUA
                    </button>
                </div>
            </div>
        );
    }

    if (type === "ai") {
        const { stats = [], elitCount = 0, result: aiResult = [] } = result;
        const isBBFS = param && param >= 8;
        return (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Stats Container */}
                <div className="bg-[var(--card)] border border-white/5 rounded-xl p-4 pt-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-transparent via-[var(--cyan)]/20 to-transparent h-[1px] w-full mb-4"></div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-[#0a1120] border border-[var(--cyan)]/30 p-2.5 px-8 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                           <span className="text-[var(--gold)] text-sm">{isBBFS ? '⚡' : '⚡'}</span>
                           <span className="font-['Orbitron'] text-[11px] font-black tracking-[3px] text-white uppercase">
                               {isBBFS ? 'BBFS' : 'ANGKA IKUT'} — 25 RUMUS
                           </span>
                        </div>
                        <div className="text-[9px] font-bold text-white/30 tracking-[3px] mt-4 uppercase">-- VALIDASI WALK-FORWARD --</div>
                    </div>

                    <div className="space-y-1.5 px-2">
                        {stats.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.01]">
                                <span className="text-[8px] font-black p-1 px-2 rounded-md bg-green-500/10 text-[#00e676] border border-[#00e676]/20 tracking-[1px] font-['Orbitron']">ELITE</span>
                                <span className="flex-1 text-[11px] text-white/70 font-medium tracking-[0.5px] font-['Rajdhani'] uppercase">{s.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-[3px] bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00e676] shadow-[0_0_8px_#00e676]" style={{ width: `${(s.hits / 14) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-['JetBrains_Mono'] text-[#00e676] font-black">
                                        {s.hits || s.score}/14
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black/40 border border-white/5 p-2.5 mt-6 rounded-lg text-center">
                        <span className="text-[10px] font-black tracking-[4px] text-[var(--green)] font-['Orbitron'] uppercase">RUMUS ACTIVE: {elitCount}/25</span>
                    </div>
                </div>

                {/* Result Container */}
                <div className="bg-[var(--surface)] border-2 border-[var(--green)]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,230,118,0.05)] text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="text-[#00e676] text-sm">✅</span>
                        <span className="text-[11px] font-black text-white tracking-[3px] font-['Orbitron'] uppercase">{isBBFS ? 'BBFS' : 'ANGKA IKUT'}</span>
                    </div>
                    
                    <div className={`flex justify-center flex-wrap ${isBBFS ? 'gap-1.5' : 'gap-2.5'}`}>
                        {aiResult.map((d: number, i: number) => (
                            <div key={i} className={`${isBBFS ? 'w-8 h-8 text-[15px]' : 'w-10 h-10 text-[18px]'} flex items-center justify-center border-2 border-[var(--green)]/60 bg-[var(--green)]/5 rounded-xl font-black text-white font-['Orbitron'] shadow-lg`}>
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white/40 space-y-2 font-medium tracking-[1px] font-['Rajdhani'] text-left">
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Validasi: 14 langkah WF • Elit: {elitCount}/25</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Mode: {param} {isBBFS ? 'BBFS' : 'Digit AI Selection'}</span>
                    </div>
                </div>
            </div>
        );
    }
    
    if (type === "mati") {
        const POS = ['AS', 'KOP', 'KEPALA', 'EKOR'];
        const totalActive = POS.reduce((acc, p) => acc + (result[p]?.stats?.length || 0), 0);

        return (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Stats Container */}
                <div className="bg-[var(--card)] border border-white/5 rounded-xl p-4 pt-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-transparent via-[var(--red)]/20 to-transparent h-[1px] w-full mb-4"></div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-[#1a0b0b] border border-[var(--red)]/30 p-2.5 px-8 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(255,82,82,0.1)]">
                           <span className="text-sm">💀</span>
                           <span className="font-['Orbitron'] text-[11px] font-black tracking-[3px] text-white uppercase">
                               ANGKA MATI — 50 RUMUS
                           </span>
                        </div>
                        <div className="text-[9px] font-bold text-white/30 tracking-[3px] mt-4 uppercase">-- VALIDASI WALK-FORWARD --</div>
                    </div>

                    <div className="space-y-6">
                        {POS.map(p => (
                            <div key={p} className="space-y-2">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="h-[1px] bg-white/5 flex-1"></div>
                                    <span className="text-[10px] font-black text-[var(--red)] tracking-[4px] font-['Orbitron'] uppercase">{p}</span>
                                    <div className="h-[1px] bg-white/5 flex-1"></div>
                                </div>
                                <div className="space-y-1.5 px-2">
                                    {(result[p]?.stats || []).map((s: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01]">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[8px] font-black p-1 px-1.5 rounded-md bg-green-500/10 text-[#00e676] border border-[#00e676]/20 tracking-[1px] font-['Orbitron']">ELITE</span>
                                                <span className="text-[11px] text-white/70 font-medium tracking-[0.5px] font-['Rajdhani'] uppercase">{s.name}</span>
                                            </div>
                                            <span className="text-[10px] font-['JetBrains_Mono'] text-[var(--red)] font-black">
                                                [{s.score}/14] 100%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black/40 border border-white/5 p-2.5 mt-8 rounded-lg text-center">
                        <span className="text-[10px] font-black tracking-[4px] text-[var(--red)] font-['Orbitron'] uppercase opacity-80">
                            RUMUS ACTIVE: {totalActive}/50
                        </span>
                    </div>
                </div>

                {/* Result Container */}
                <div className="bg-[var(--surface)] border-2 border-[var(--red)]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(255,82,82,0.05)] text-left space-y-3.5">
                    {POS.map(p => (
                        <div key={p} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-3.5 py-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-[#ff5252] text-sm">❌</span>
                                <span className="text-[10px] font-black text-white/80 tracking-[2px] font-['Orbitron'] uppercase">OFF {p}</span>
                            </div>
                            <div className="flex gap-2">
                                {(result[p]?.result || []).map((val: any, idx: number) => (
                                    <div key={idx} className="w-9 h-9 flex items-center justify-center border-2 border-[var(--red)]/50 bg-[var(--red)]/5 rounded-lg text-[18px] font-black text-white font-['Orbitron'] shadow-lg">
                                        {val}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white/40 space-y-2 font-medium tracking-[1px] font-['Rajdhani'] text-left">
                    <div className="flex items-center gap-3">
                        <span>📌</span>
                        <span>Validasi: 14 langkah WF • Threshold: 14/14</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>📌</span>
                        <span>Mode: {param} Digit OFF per posisi</span>
                    </div>
                </div>
            </div>
        );
    }
    
    if (type === "jumlah") {
        const { stats = [], result: resArray = [], supportCount = 0, eliteTotal = 0 } = result;
        const resList = Array.isArray(resArray) ? resArray : [resArray];
        return (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Stats Container */}
                <div className="bg-[var(--card)] border border-white/5 rounded-xl p-4 pt-0 overflow-hidden text-left">
                    <div className="bg-gradient-to-r from-transparent via-[var(--purple)]/20 to-transparent h-[1px] w-full mb-4"></div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-[#120a20] border border-[var(--purple)]/30 p-2.5 px-8 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(179,136,255,0.1)]">
                           <span className="text-sm">🔢</span>
                           <span className="font-['Orbitron'] text-[11px] font-black tracking-[3px] text-white uppercase">
                               JUMLAH MATI — 50 RUMUS
                           </span>
                        </div>
                        <div className="text-[9px] font-bold text-white/30 tracking-[3px] mt-4 uppercase">-- VALIDASI WALK-FORWARD --</div>
                    </div>

                    <div className="space-y-1.5 px-2">
                        {stats.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.01]">
                                <span className="text-[8px] font-black p-1 px-1.5 rounded-md bg-green-500/10 text-[#00e676] border border-[#00e676]/20 tracking-[1px] font-['Orbitron']">ELITE</span>
                                <span className="flex-1 text-[11px] text-white/70 font-medium tracking-[0.5px] font-['Rajdhani'] uppercase">{s.name}</span>
                                <span className="text-[10px] font-['JetBrains_Mono'] text-[var(--purple)] font-black">
                                    [{s.score}/14] 100%
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black/40 border border-white/5 p-2.5 mt-6 rounded-lg text-center">
                        <span className="text-[10px] font-black tracking-[4px] text-[var(--purple)] font-['Orbitron'] uppercase opacity-80">
                            RUMUS ACTIVE: {stats.length}/50
                        </span>
                    </div>
                </div>

                {/* Result Container */}
                <div className="bg-[var(--surface)] border-2 border-[var(--purple)]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(179,136,255,0.05)] text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="text-[#b388ff] text-sm">❌</span>
                        <span className="text-[11px] font-black text-white tracking-[3px] font-['Orbitron'] uppercase">OFF JUMLAH</span>
                    </div>
                    
                    <div className="flex justify-center gap-2.5 flex-wrap">
                        {resList.map((d: any, i: number) => (
                            <div key={i} className="w-10 h-10 flex items-center justify-center border-2 border-[var(--purple)]/60 bg-[var(--purple)]/5 rounded-xl text-[20px] font-black text-white font-['Orbitron'] shadow-lg">
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white/40 space-y-2 font-medium tracking-[1px] font-['Rajdhani'] text-left">
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Validasi: 14 langkah WF • Sigma 50 Rumus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Elite Support: {supportCount}/{eliteTotal} Patterns</span>
                    </div>
                </div>
            </div>
        );
    }
    
    if (type === "shio") {
        const { stats = [], result: resArray = [], supportCount = 0, eliteTotal = 0 } = result;
        const resList = Array.isArray(resArray) ? resArray : [resArray];
        return (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Stats Container */}
                <div className="bg-[var(--card)] border border-white/5 rounded-xl p-4 pt-0 overflow-hidden text-left">
                    <div className="bg-gradient-to-r from-transparent via-[var(--cyan)]/20 to-transparent h-[1px] w-full mb-4"></div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-[#0a1820] border border-[var(--cyan)]/30 p-2.5 px-8 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                           <span className="text-sm">🐉</span>
                           <span className="font-['Orbitron'] text-[11px] font-black tracking-[3px] text-white uppercase">
                               SHIO MATI — 50 RUMUS
                           </span>
                        </div>
                        <div className="text-[9px] font-bold text-white/30 tracking-[3px] mt-4 uppercase">-- VALIDASI WALK-FORWARD --</div>
                    </div>

                    <div className="space-y-1.5 px-2">
                        {stats.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.01]">
                                <span className="text-[8px] font-black p-1 px-1.5 rounded-md bg-green-500/10 text-[#00e676] border border-[#00e676]/20 tracking-[1px] font-['Orbitron']">ELITE</span>
                                <span className="flex-1 text-[11px] text-white/70 font-medium tracking-[0.5px] font-['Rajdhani'] uppercase">{s.name}</span>
                                <span className="text-[10px] font-['JetBrains_Mono'] text-[var(--cyan)] font-black">
                                    [{s.score}/14] 100%
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black/40 border border-white/5 p-2.5 mt-6 rounded-lg text-center">
                        <span className="text-[10px] font-black tracking-[4px] text-[var(--cyan)] font-['Orbitron'] uppercase opacity-80">
                            RUMUS ACTIVE: {stats.length}/50
                        </span>
                    </div>
                </div>

                {/* Result Container */}
                <div className="bg-[var(--surface)] border-2 border-[var(--cyan)]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,229,255,0.05)] text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="text-[#00e5ff] text-sm">🐉</span>
                        <span className="text-[11px] font-black text-white tracking-[3px] font-['Orbitron'] uppercase">OFF SHIO</span>
                    </div>
                    
                    <div className="flex justify-center gap-2.5 flex-wrap">
                        {resList.map((s: number, i: number) => (
                            <div key={i} className="min-w-[65px] h-11 px-3.5 flex items-center justify-center gap-3 border-2 border-[var(--cyan)]/60 bg-[var(--cyan)]/5 rounded-xl text-[18px] font-black text-white font-['Orbitron'] shadow-lg">
                                <span className="text-xl drop-shadow-md">{SHIO_EMOJI[s]}</span>
                                <span className="">{s < 10 ? '0'+s : s}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white/40 space-y-2 font-medium tracking-[1px] font-['Rajdhani'] text-left">
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Validasi: 14 langkah WF • 50 Modulo Rumus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>📌</span>
                        <span>Elite Support: {supportCount}/{eliteTotal} Patterns</span>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="animate-[slideIn_0.22s_ease-out] w-full max-w-[450px] mx-auto px-4 pb-12">
      {/* Small top breadcrumb style */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <span className="text-xl drop-shadow-lg">{icon}</span>
        <h3 className={`font-['Orbitron'] text-[13px] font-black tracking-[4px] m-0 uppercase flex-1 ${titleColors[type] || 'text-white'}`}>
             {title}
        </h3>
      </div>

      {/* Market Label Box */}
      <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 mb-6 text-center font-['Orbitron'] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <span className="text-[11px] text-[var(--gold)] font-black tracking-[4px] uppercase flex items-center justify-center gap-2">
            PASARAN: <span className="text-white opacity-90">{marketId.toUpperCase()}</span>
        </span>
      </div>

      {error && (
        <div className="text-center text-[10px] p-4 mb-6 font-black font-['JetBrains_Mono'] text-red-400 bg-red-400/5 border border-red-400/20 rounded-xl uppercase tracking-[2px] animate-pulse">
            {error}
        </div>
      )}

      {(param === null || !needsParam) && !loading && !result && (
          <button 
            onClick={() => handleAnalyze()} 
            className={`w-full p-5 font-['Orbitron'] font-black text-[14px] tracking-[5px] rounded-xl hover:scale-[0.98] active:scale-95 transition-all uppercase outline-none flex items-center justify-center gap-3 shadow-2xl ${btnColors[type] || 'bg-white text-black'}`}
          >
             🚀 MULAI ANALISA
          </button>
      )}

      {renderParamSelector()}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--cyan)]/20 border-t-[var(--cyan)] rounded-full animate-spin"></div>
            <div className="text-[var(--cyan)] font-['Orbitron'] text-[10px] font-black tracking-[6px] animate-pulse uppercase">
                MENGANALISIS DATA...
            </div>
        </div>
      )}

      {renderResult()}

      {!loading && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/analyze/${marketId}`);
            }} 
            className="flex items-center justify-center gap-3 w-full bg-[#0a1120]/40 text-white/40 border border-white/10 p-5 mt-8 text-[11px] font-black font-['Orbitron'] tracking-[5px] rounded-xl hover:border-[var(--gold)]/40 hover:text-white transition-all cursor-pointer uppercase outline-none active:scale-95 shadow-xl"
          >
             ← DATA MENU 
          </button>
      )}
    </div>
  );
}

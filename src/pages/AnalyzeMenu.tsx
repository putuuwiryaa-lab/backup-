import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { RefreshCw, Cpu } from "lucide-react";
import AnalysisPage from "./AnalysisPage";

export default function AnalyzeMenu() {
  return (
    <Routes>
      <Route path="/" element={<AnalyzeList />} />
      <Route path="/ai" element={<AnalysisWrapper type="ai" title="ANGKA IKUT 2D" icon="⚡" />} />
      <Route path="/mati" element={<AnalysisWrapper type="mati" title="ANGKA MATI 4D" icon="💀" />} />
      <Route path="/jumlah" element={<AnalysisWrapper type="jumlah" title="JUMLAH MATI 2D" icon="🔢" />} />
      <Route path="/shio" element={<AnalysisWrapper type="shio" title="SHIO MATI" icon="🐉" />} />
      <Route path="/rekap" element={<AnalysisWrapper type="rekap" title="MENU REKAP" icon="💰" />} />
    </Routes>
  );
}

function AnalysisWrapper({ type, title, icon }: any) {
    const { marketId } = useParams();
    return <AnalysisPage type={type} title={title} icon={icon} marketId={marketId || 'SGP'} />;
}

function AnalyzeList() {
  const navigate = useNavigate();
  const { marketId } = useParams();
  const [marketName, setMarketName] = useState(marketId);
  const [lastResult, setLastResult] = useState<string>('...');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/markets");
      const allMarkets = await res.json();
      const mData = allMarkets.find((m: any) => m.id === marketId);
      
      if (mData) {
          if (mData.name) setMarketName(mData.name);
          
          const dataString = mData.history_data || "";
          const rawTokens = dataString.split(/[\s\n\r\t,]+/);
          const data = rawTokens.filter((token: string) => /^\d{4}$/.test(token));
          
          if (data.length > 0) {
             setLastResult(data[data.length - 1]); // Ambil yang paling atas (terbaru)
          } else {
             setLastResult('KOSONG');
          }
      } else {
          setLastResult('KOSONG');
      }
    } catch(e) {
        setLastResult('ERROR');
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (marketId) fetchData();
  }, [marketId]);

  return (
    <div className="animate-[slideIn_0.22s_ease-out] px-1">
      {/* Premium Market Header Card */}
      <div className="bg-[#0a1120] border border-white/10 rounded-2xl p-7 mb-8 text-center relative overflow-hidden group shadow-2xl">
          {/* Decorative glow lines */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent"></div>
          
          <h3 className="font-['Orbitron'] text-[24px] font-black tracking-[5px] text-[var(--gold)] uppercase mb-6 drop-shadow-[0_0_15px_rgba(240,192,64,0.2)]">
               {marketName}
          </h3>
          
          <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-3 px-8 rounded-xl shadow-inner group-hover:border-[var(--cyan)]/30 transition-all">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-white/40 tracking-[2px] uppercase">LAST RESULT</span>
                  <div className="flex items-center gap-4">
                      <span className="text-[22px] font-black text-[var(--cyan)] font-['Orbitron'] tracking-[2px] drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]">
                          {lastResult}
                      </span>
                      <button 
                        onClick={fetchData} 
                        disabled={refreshing} 
                        className="text-white/20 hover:text-[var(--gold)] transition-all active:rotate-180 disabled:opacity-50 flex items-center justify-center p-1 outline-none"
                      >
                         <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex items-center gap-4 mb-6 px-1">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
          <div className="flex items-center gap-2">
              <Cpu size={12} className="text-[var(--cyan)] opacity-60" />
              <span className="font-['Orbitron'] text-[10px] font-black text-[var(--cyan)] tracking-[3px] uppercase opacity-60">SELECT MODE</span>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <SubMenuCard
          label="⚡ ANGKA IKUT 2D"
          color="bg-gradient-to-br from-[var(--card)] to-[#081a10] text-[var(--green)] border-[rgba(0,230,118,0.18)]"
          onClick={() => navigate("ai")}
        />
        <SubMenuCard
          label="💀 ANGKA MATI 4D"
          color="bg-gradient-to-br from-[var(--card)] to-[#1a0808] text-[var(--red)] border-[rgba(255,82,82,0.18)]"
          onClick={() => navigate("mati")}
        />
        <SubMenuCard
          label="🔢 JUMLAH MATI 2D"
          color="bg-gradient-to-br from-[var(--card)] to-[#0e0a1f] text-[var(--purple)] border-[rgba(179,136,255,0.18)]"
          onClick={() => navigate("jumlah")}
        />
        <SubMenuCard
          label="🐉 SHIO MATI"
          color="bg-gradient-to-br from-[var(--card)] to-[#081a10] text-[var(--cyan)] border-[rgba(0,229,255,0.18)]"
          onClick={() => navigate("shio")}
        />
        <SubMenuCard
          label="💰 MENU REKAP"
          color="bg-gradient-to-br from-[var(--card)] to-[#081018] text-[#60a5fa] border-[rgba(68,138,255,0.2)]"
          onClick={() => navigate("rekap")}
        />
      </div>

      <button 
        onClick={() => navigate("/")} 
        className="flex items-center justify-center gap-[6px] w-full bg-black/40 text-[var(--text-dim)] border border-[var(--border)] p-[14px] mt-[14px] text-[11px] font-bold font-['Orbitron'] tracking-[4px] rounded-xl hover:border-[var(--cyan)] hover:text-[var(--cyan)] hover:bg-[var(--card2)] transition-all uppercase cursor-pointer outline-none shadow-xl"
      >
        ← KEMBALI KE BERANDA
      </button>
    </div>
  );
}

function SubMenuCard({ label, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`block w-full p-4 md:p-5 mb-1 font-['Rajdhani'] text-left cursor-pointer rounded-xl border border-solid transition-all relative overflow-hidden group hover:scale-[0.99] outline-none shadow-lg ${color}`}>
        <span className="block text-[15px] md:text-[18px] tracking-[2px] font-black uppercase font-['Orbitron']">{label}</span>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[18px] opacity-40 text-white group-hover:translate-x-1 transition-transform">〉</div>
    </button>
  );
}

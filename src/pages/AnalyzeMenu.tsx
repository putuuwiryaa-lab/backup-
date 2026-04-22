import { useState, useEffect } from "react";
import { Link, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
      const snap = await getDoc(doc(db, 'markets', marketId as string));
      if (snap.exists()) {
          const mData = snap.data();
          if (mData.name) setMarketName(mData.name);
          
          const dataString = mData.historyData || "";
          const rawTokens = dataString.split(/[\s\n\r\t,]+/);
          const data = rawTokens.filter((token: string) => /^\d{4}$/.test(token));
          
          if (data.length > 0) {
             setLastResult(data[data.length - 1]);
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
    <div className="animate-[slideIn_0.22s_ease-out]">
      <div className="flex flex-col items-center gap-1 mb-4 pb-[10px] border-b border-[var(--border2)] text-center">
        <h3 className="font-['Orbitron'] text-[15px] font-bold tracking-[3px] text-[var(--gold)] m-0">ANALISA {marketName}</h3>
        
        <div className="flex items-center gap-3 mt-1 mb-2 bg-[var(--card2)] border border-[var(--border2)] px-4 py-1.5 rounded-full shadow-inner">
           <span className="font-['JetBrains_Mono'] text-[10px] text-[var(--gray)]">
             RESULT TERAKHIR: <b className="text-[var(--cyan)] font-extrabold text-[12px]">{lastResult}</b>
           </span>
           <button onClick={fetchData} disabled={refreshing} className="bg-transparent border-none text-[var(--gold)] cursor-pointer hover:text-white transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center p-1 outline-none">
             {refreshing ? '⏳' : '🔄'}
           </button>
        </div>

        <span className="font-['JetBrains_Mono'] text-[10px] text-[var(--cyan)]">PILIH MODE ANALISA:</span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <SubMenuCard
          label="⚡ AI 2D"
          desc="25 rumus walk-forward"
          color="bg-gradient-to-br from-[var(--card)] to-[#081a10] text-[var(--green)] border-[rgba(0,230,118,0.18)]"
          onClick={() => navigate("ai")}
        />
        <SubMenuCard
          label="💀 OFF 4D"
          desc="50 rumus per posisi"
          color="bg-gradient-to-br from-[var(--card)] to-[#1a0808] text-[var(--red)] border-[rgba(255,82,82,0.18)]"
          onClick={() => navigate("mati")}
        />
        <SubMenuCard
          label="🔢 JML OFF"
          desc="50 rumus Sigma"
          color="bg-gradient-to-br from-[var(--card)] to-[#0e0a1f] text-[var(--purple)] border-[rgba(179,136,255,0.18)]"
          onClick={() => navigate("jumlah")}
        />
        <SubMenuCard
          label="🐉 SHIO OFF"
          desc="50 rumus Modulo"
          color="bg-gradient-to-br from-[var(--card)] to-[#081a10] text-[var(--cyan)] border-[rgba(0,229,255,0.18)]"
          onClick={() => navigate("shio")}
        />
        <div className="col-span-2">
          <SubMenuCard
            label="💰 MENU REKAP"
            desc="auto-generate invest & top lines"
            color="bg-gradient-to-br from-[var(--card)] to-[#081018] text-[#60a5fa] border-[rgba(68,138,255,0.2)]"
            onClick={() => navigate("rekap")}
          />
        </div>
      </div>

      <Link to="/" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="flex items-center justify-center gap-[6px] w-full bg-black/40 text-[var(--text-dim)] border border-[var(--border)] p-[12px] mt-[14px] text-[10px] font-bold font-['JetBrains_Mono'] tracking-[3px] rounded-[var(--radius-sm)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] hover:bg-[var(--card2)] transition-all uppercase no-underline">
        ← KEMBALI
      </Link>
    </div>
  );
}

function SubMenuCard({ label, desc, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`block w-full p-3 md:p-[15px_14px] mb-[2px] font-['Rajdhani'] text-[14px] font-bold tracking-[0.5px] text-left cursor-pointer rounded-xl border border-solid transition-all relative overflow-hidden group hover:scale-[0.98] outline-none ${color}`}>
        <span className="block text-[11px] md:text-[13px] tracking-[1px] uppercase font-['Orbitron']">{label}</span>
        <span className="block text-[8px] md:text-[9px] font-normal mt-[2px] md:mt-[4px] opacity-70 font-['JetBrains_Mono'] tracking-normal text-white italic line-clamp-1">{desc}</span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] opacity-30 text-white group-hover:translate-x-1 transition-transform">〉</div>
    </button>
  );
}

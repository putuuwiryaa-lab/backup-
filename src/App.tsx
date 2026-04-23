import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase SDK directly across the app
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);

import { 
  BarChart3, 
  History, 
  Settings2, 
  UserPlus, 
  Lock, 
  Zap, 
  Menu, 
  X,
  Target,
  LayoutGrid,
  ShieldCheck,
  Smartphone,
  Trophy,
  PieChart,
  LogOut,
  ChevronRight,
  Database,
  Cpu,
  Search,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import AnalyzeMenu from "./pages/AnalyzeMenu";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Router>
      <div className="app-container min-h-screen bg-[var(--bg)] text-[var(--text)] font-['Rajdhani'] selection:bg-[var(--cyan)] selection:text-black overflow-x-hidden">
        <AppLayout />
      </div>
    </Router>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const [deviceCode, setDeviceCode] = useState("");
  const [authStatus, setAuthStatus] = useState<"LOADING" | "LOCKED" | "READY" | "EXPIRED">("LOADING");
  const [authStage, setAuthStage] = useState("Inisialisasi...");
  const [role, setRole] = useState("FREE");
  const [user, setUser] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemSetting, setSystemSetting] = useState<any>({ runningText: "..." });

  const getDeviceCode = () => {
    let code = localStorage.getItem("supreme_devcode");
    if (!code || code.length !== 4) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      localStorage.setItem("supreme_devcode", code);
    }
    return code;
  };

  const fetchMarkets = async () => {
    try {
      const snap = await getDocs(collection(db, "markets"));
      const mData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarkets(mData);
      setSystemSetting(prev => ({ ...prev, dbError: null }));
    } catch (e: any) {
      console.error("Gagal fetch markets:", e);
      if (e.message?.includes("Missing or insufficient permissions")) {
         setSystemSetting(prev => ({ ...prev, dbError: "Sistem Keamanan Firebase Menolak Akses. Periksa Rules." }));
      } else {
         setSystemSetting(prev => ({ ...prev, dbError: e.message }));
      }
    }
  };

  const fetchSettings = async () => {
    try {
      setSystemSetting({ runningText: "SUPREME ENGINE v2.0 - SISTEM PREDIKSI PASARAN TERAKURAT" });
    } catch (e) {}
  };

  useEffect(() => {
    const code = getDeviceCode();
    setDeviceCode(code);
    
    const savedToken = localStorage.getItem("supreme_token");
    if (savedToken && savedToken.startsWith("supreme_")) {
       setAuthStatus("LOADING");
       setTimeout(() => { // Simulate small load
          const parts = savedToken.split("_");
          if (parts.length >= 3) {
             setRole(parts[1]);
             setAuthStatus("READY");
          } else {
             localStorage.removeItem("supreme_token");
             setAuthStatus("LOCKED");
          }
       }, 500);
    } else {
      setAuthStatus("LOCKED");
    }

    fetchMarkets();
    fetchSettings();
  }, []);

  if (authStatus === "LOADING") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-black">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-t-[var(--cyan)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--gold)] w-6 h-6" />
        </div>
        <div className="flex flex-col items-center gap-4">
            <div className="font-['Orbitron'] text-[10px] tracking-[4px] text-[var(--gold)] animate-pulse uppercase">
              {authStage}
            </div>
            
            {/* MANUAL BYPASS: Tombol ini muncul segera jika ada masalah koneksi */}
            <button 
                onClick={() => setAuthStatus("LOCKED")}
                className="px-6 py-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded text-[11px] font-bold text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-all uppercase tracking-[2px] shadow-[0_0_20px_rgba(212,175,55,0.1)]"
            >
              KLIK DISINI JIKA MACET
            </button>
        </div>
      </div>
    );
  }

  if (authStatus === "LOCKED") return <LayarKunci deviceCode={deviceCode} onAuthSuccess={(r, t) => { setRole(r); localStorage.setItem("supreme_token", t); setAuthStatus("READY"); }} />;
  if (authStatus === "EXPIRED") return <div className="flex items-center justify-center min-h-screen p-8 text-center bg-red-950/20"><div className="border border-red-500 p-8 rounded-xl bg-black/80 shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-sm"><h2 className="font-['Orbitron'] text-red-500 mb-4 tracking-[4px]">ACCOUNT EXPIRED</h2><p className="text-[12px] opacity-70 mb-6 font-['JetBrains_Mono']">Masa trial akun anda telah berakhir. Hubungi Admin untuk aktivasi VIP.</p><button onClick={() => window.location.reload()} className="w-full bg-red-600 p-3 rounded font-bold text-white text-[12px] tracking-[2px]">REFRESH</button></div></div>;

   return (
    <div className="relative flex flex-col min-h-screen bg-[#030408]">
      {/* Target UI Header */}
      <div className="pt-8 pb-4 text-center">
         <h1 className="font-['Orbitron'] text-[24px] font-bold tracking-[3px] text-[#f0c040]">ANALISA ANGKA</h1>
         <p className="font-['JetBrains_Mono'] text-[10px] tracking-[4px] text-[var(--cyan)] opacity-70 mt-1 uppercase">PREDICTION ENGINE</p>
      </div>

      <div className="px-4 space-y-2 mb-6">
         {/* Dynamic Status Bar Based on Role */}
         {role === "MASTER" ? (
           <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--cyan)]/20 p-2.5 rounded-lg border-l-4 border-l-[var(--gold)] shadow-[0_0_15px_rgba(240,192,64,0.05)]">
              <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse shadow-[0_0_8px_var(--gold)]"></div>
              <span className="font-['Orbitron'] text-[11px] font-bold tracking-[2px] text-[var(--gold)] uppercase">ADMIN ACCESS</span>
           </div>
         ) : role === "PRO" ? (
           <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--blue)]/20 p-2.5 rounded-lg border-l-4 border-l-[var(--cyan)] shadow-[0_0_15px_rgba(0,229,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse shadow-[0_0_8px_var(--cyan)]"></div>
              <span className="font-['Orbitron'] text-[11px] font-bold tracking-[2px] text-[var(--cyan)] uppercase">VIP ACCESS</span>
           </div>
         ) : (
           <div className="flex items-center gap-3 bg-[var(--card)] border border-white/10 p-2.5 rounded-lg border-l-4 border-l-[var(--gray)] shadow-[0_0_15px_rgba(255,255,255,0.02)]">
              <div className="w-2 h-2 rounded-full bg-[var(--gray)] animate-pulse shadow-[0_0_8px_var(--gray)]"></div>
              <span className="font-['Orbitron'] text-[11px] font-bold tracking-[2px] text-white font-normal opacity-70 uppercase">NON VIP ACCESS</span>
           </div>
         )}

         {/* Access ID Bar */}
         <div className="flex items-center justify-between bg-[var(--card)] border border-white/5 p-2.5 rounded-lg">
            <span className="font-['Orbitron'] text-[11px] font-bold tracking-[2px] text-white/40 uppercase">Device Identifier</span>
            <span className="font-['JetBrains_Mono'] text-[12px] font-black text-[var(--gold)]">ID: {deviceCode}</span>
         </div>
         
         {systemSetting?.dbError && (
            <div className="flex items-center gap-3 bg-red-950/30 border border-red-500/30 p-3 rounded-lg border-l-4 border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] mt-4">
              <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex flex-col">
                <span className="font-['Orbitron'] text-[11px] font-bold tracking-[1px] text-red-500 uppercase">AKSES DITOLAK FIREBASE</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-red-300 mt-1">{systemSetting.dbError}</span>
              </div>
            </div>
         )}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <section className="flex-1 p-4 overflow-y-auto">
           <div className="max-w-6xl mx-auto">
             <Routes>
                <Route path="/" element={<Dashboard markets={markets} />} />
                <Route path="/analyze/:marketId/*" element={<AnalyzeMenu />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" />} />
             </Routes>
           </div>
        </section>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, onClick, active, badge, color }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${active ? 'bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-[var(--cyan)]' : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-white border border-transparent'}`}>
       <div className={`flex items-center gap-3 font-bold text-[11px] tracking-[1px] uppercase ${color || ''}`}>
          <span className={`${active ? 'text-[var(--cyan)]' : 'group-hover:text-[var(--gold)] transition-colors'}`}>{icon}</span>
          {label}
       </div>
       {badge ? <span className="text-[8px] font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/5 opacity-50">{badge}</span> : <ChevronRight size={14} className={`opacity-0 group-hover:opacity-30 transition-opacity ${active ? 'opacity-30' : ''}`} />}
    </button>
  );
}

function Dashboard({ markets }: { markets: any[] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  const filteredMarkets = markets.filter(m => 
    m.id.toLowerCase().includes(search.toLowerCase()) || 
    (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
       <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-['Orbitron'] text-[13px] font-bold tracking-[3px] text-white">PILIH PASARAN</h2>
          <button 
            onClick={() => window.location.reload()}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--card2)] border border-[var(--border2)] text-white hover:text-[var(--gold)] transition-all active:scale-95 shadow-lg"
          >
            <RefreshCw size={18} className="opacity-70" />
          </button>
       </div>

       <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
             <Search size={18} className="text-[var(--gray)]" />
          </div>
          <input 
            type="text" 
            placeholder="CARI PASARAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 bg-[var(--card)]/80 border border-[var(--border2)] rounded-xl pl-12 pr-4 text-[13px] font-bold font-['JetBrains_Mono'] tracking-[2px] text-white placeholder:text-[var(--gray)]/40 focus:outline-none focus:border-[var(--cyan)]/40 transition-all shadow-inner"
          />
       </div>

       <div className="grid grid-cols-2 gap-3 pb-8">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((m, idx) => {
               // Use a simple selection of colors for the dots based on index
               const dotColors = ["#b388ff", "#f0c040", "var(--cyan)", "#00e676", "var(--red)", "#448aff"];
               const dotColor = dotColors[idx % dotColors.length];
               
               return (
                <button 
                  key={m.id} 
                  onClick={() => navigate(`/analyze/${m.id}`)} 
                  className="group flex items-center justify-between p-3.5 bg-[var(--card)]/90 border border-[var(--border2)] rounded-xl hover:border-white/20 transition-all hover:bg-[var(--card2)] active:scale-95 text-left relative overflow-hidden h-[54px]"
                >
                   <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
                        style={{ backgroundColor: dotColor, color: dotColor }}
                      ></div>
                      <span className="font-['Orbitron'] text-[11px] font-bold tracking-[1px] text-white/90 group-hover:text-white transition-colors">{m.id}</span>
                   </div>
                   <ChevronRight size={14} className="text-[var(--gray)] opacity-40 group-hover:translate-x-1 group-hover:opacity-80 transition-all" />
                </button>
               );
            })
          ) : (
            <div className="col-span-2 py-10 text-center border border-dashed border-[var(--border2)] rounded-2xl opacity-40">
               <p className="font-['JetBrains_Mono'] text-[11px] tracking-[2px]">PASARAN TIDAK DITEMUKAN</p>
            </div>
          )}
       </div>

       <div className="mt-8 mb-12 flex justify-center">
          <button 
            onClick={() => { 
                localStorage.removeItem("supreme_token"); 
                sessionStorage.setItem("supreme_skip_auto", "true");
                window.location.reload(); 
            }}
            className="flex items-center gap-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 p-3 px-6 rounded-xl text-red-500/80 hover:text-red-500 transition-all font-['Orbitron'] text-[11px] font-black tracking-[4px] uppercase group shadow-lg"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            KELUAR SISTEM
          </button>
       </div>
    </div>
  );
}

function StatCard({ icon, label, value, desc }: any) {
  return (
    <div className="p-6 bg-[var(--card)] border border-[var(--border2)] rounded-2xl relative overflow-hidden backdrop-blur-md group hover:border-[var(--cyan)] transition-colors">
       <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
          <div className="text-right">
             <p className="text-[20px] font-black text-white font-['Orbitron'] tracking-[1px]">{value}</p>
             <p className="text-[9px] font-bold text-[var(--gray)] tracking-[1px] uppercase group-hover:text-white transition-colors">{label}</p>
          </div>
       </div>
       <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent mb-3"></div>
       <p className="text-[10px] text-[var(--gray)] font-bold italic tracking-[0.5px] relative z-10 group-hover:text-[var(--cyan)] transition-colors opacity-70">{desc}</p>
    </div>
  );
}

function ActivityItem({ time, text, type }: any) {
  const icons: any = {
    system: <Database size={12} />,
    network: <Zap size={12} />,
    user: <Smartphone size={12} />,
    logic: <Cpu size={12} />
  };
  return (
    <div className="flex gap-4 group">
       <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-black transition-all">{icons[type]}</div>
          <div className="flex-1 w-[1px] bg-white/10 group-last:hidden"></div>
       </div>
       <div className="flex-1 pb-4">
          <p className="text-[11px] text-white font-bold tracking-[0.5px] leading-tight mb-1 group-hover:text-[var(--cyan)] transition-colors">{text}</p>
          <p className="text-[9px] font-bold text-[var(--gray)] uppercase tracking-[1px]">{time}</p>
       </div>
    </div>
  );
}

function LayarKunci({ deviceCode, onAuthSuccess }: { deviceCode: string, onAuthSuccess: (role: string, token: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError("");
    
    // Simulate slight network delay for effect
    setTimeout(() => {
       const devId = parseInt(deviceCode) || 0;
       const masterPin = "120800";
       const proPin = ((devId * 5) + 2026).toString();
       const trialPin = ((devId * 3) + 1234).toString();

       let role = null;
       if (pin === masterPin) role = "MASTER";
       else if (pin === proPin) role = "PRO";
       else if (pin === trialPin) role = "TRIAL";

       if (role) {
          onAuthSuccess(role, `supreme_${role}_${Date.now()}`);
       } else {
          setError("PIN SALAH!");
       }
       setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed">
      <div className="w-full max-w-sm p-8 bg-[var(--card)] border border-[var(--border2)] rounded-[var(--radius)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent animate-pulse"></div>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--gold)] to-[#c88a20] rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 ring-4 ring-white/5">
            <Lock className="text-black w-8 h-8" />
          </div>
          <h2 className="font-['Orbitron'] text-[18px] font-bold text-white tracking-[6px] mb-2">SYSTEM LOCKED</h2>
          <p className="text-[10px] text-[var(--gray)] font-bold tracking-[2px] uppercase">Unauthorized Access Restricted</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-['Orbitron'] font-bold text-[var(--gold)] mb-3 tracking-[3px] uppercase ml-1">Device Key Identifier</label>
            <input type="text" value={deviceCode} readOnly className="w-full h-12 bg-black/40 border border-[var(--border2)] rounded-xl px-4 text-white text-[16px] font-black tracking-[4px] font-['Roboto_Mono'] text-center focus:outline-none" />
          </div>

          <div>
            <label className="block text-[10px] font-['Orbitron'] font-bold text-[var(--cyan)] mb-3 tracking-[3px] uppercase ml-1">Secure Entrance PIN</label>
            <input 
              type="password" 
              value={pin}
              autoFocus
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              className="w-full h-14 bg-black/50 border-2 border-[var(--border2)] focus:border-[var(--cyan)] rounded-xl px-4 text-white text-[24px] font-black tracking-[12px] font-['Roboto_Mono'] text-center transition-all placeholder:opacity-20 outline-none"
            />
          </div>

          {error && <p className="text-[10px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center tracking-[1px] uppercase animate-shake">{error}</p>}

          <button 
            type="submit" 
            disabled={loading || !pin}
            className="w-full h-14 bg-gradient-to-br from-white to-gray-300 hover:from-[var(--gold)] hover:to-[#c88a20] text-black font-['Orbitron'] font-black text-[13px] tracking-[6px] rounded-xl transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_25px_rgba(240,192,64,0.3)] disabled:opacity-50 disabled:grayscale uppercase"
          >
            {loading ? "DECRYPTING..." : "ACCESS GRANTED"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-[9px] font-bold text-[var(--gray)] tracking-[1.5px] uppercase">Contact Administrator for activation keys</p>
          <div className="pt-4 border-t border-white/5">
             <p className="text-[8px] font-medium text-red-500/40 tracking-[1px] leading-relaxed uppercase">
                ⚠️ DISCLAIMER: SEMUA HASIL ADALAH PREDIKSI MATEMATIS.<br/>TIDAK ADA JAMINAN KEMENANGAN 100%. GUNAKAN DENGAN BIJAK.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { motion, AnimatePresence } from "motion/react";
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
  Cpu
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
  const [role, setRole] = useState("FREE");
  const [user, setUser] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemSetting, setSystemSetting] = useState<any>({ runningText: "..." });

  const getDeviceCode = () => {
    let code = localStorage.getItem("supreme_devcode");
    if (!code) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("supreme_devcode", code);
    }
    return code;
  };

  const checkAuth = async (code: string) => {
    try {
      const res = await fetch("/api/auth/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode: code })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("supreme_token", data.token);
        setRole(data.role);
        setAuthStatus("READY");
      } else {
        if (data.status === "EXPIRED") setAuthStatus("EXPIRED");
        else setAuthStatus("LOCKED");
      }
    } catch (e) {
      setAuthStatus("LOCKED");
    }
  };

  const fetchMarkets = async () => {
    try {
      const q = query(collection(db, "markets"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      const mData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarkets(mData);
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) setSystemSetting(snap.data());
    } catch (e) {}
  };

  useEffect(() => {
    const code = getDeviceCode();
    setDeviceCode(code);
    checkAuth(code);
    fetchMarkets();
    fetchSettings();

    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (authStatus === "LOADING") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-pulse">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-t-[var(--cyan)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--gold)] w-6 h-6" />
        </div>
        <div className="font-['Orbitron'] text-[10px] tracking-[8px] text-[var(--gold)] ml-2">AUTHENTICATING...</div>
      </div>
    );
  }

  if (authStatus === "LOCKED") return <LayarKunci deviceCode={deviceCode} onAuthSuccess={(r, t) => { setRole(r); localStorage.setItem("supreme_token", t); setAuthStatus("READY"); }} />;
  if (authStatus === "EXPIRED") return <div className="flex items-center justify-center min-h-screen p-8 text-center bg-red-950/20"><div className="border border-red-500 p-8 rounded-xl bg-black/80 shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-sm"><h2 className="font-['Orbitron'] text-red-500 mb-4 tracking-[4px]">ACCOUNT EXPIRED</h2><p className="text-[12px] opacity-70 mb-6 font-['JetBrains_Mono']">Masa trial akun anda telah berakhir. Hubungi Admin untuk aktivasi VIP.</p><button onClick={() => window.location.reload()} className="w-full bg-red-600 p-3 rounded font-bold text-white text-[12px] tracking-[2px]">REFRESH</button></div></div>;

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar Desktop */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[var(--sidebar-bg)] border-r border-[var(--border2)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full bg-[var(--card)]/40 backdrop-blur-xl">
           <div className="p-6 border-b border-[var(--border2)]">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-[var(--gold)] to-[#c88a20] rounded-xl flex items-center justify-center shadow-[0_5px_15px_rgba(240,192,64,0.3)]">
                    <Database className="text-black w-5 h-5" />
                 </div>
                 <div>
                    <h1 className="font-['Orbitron'] text-[14px] font-bold tracking-[1px] text-white">ANGKA IKUT</h1>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[9px] font-bold text-[var(--cyan)] tracking-[1px]">SYSTEM v5.0 ONLINE</span>
                    </div>
                 </div>
              </div>
           </div>

           <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
              <div className="mb-4">
                 <p className="px-4 mb-2 text-[10px] font-bold text-[var(--gray)] tracking-[3px] uppercase">Main Menu</p>
                 <SidebarItem icon={<LayoutGrid size={18} />} label="DASHBOARD" onClick={() => { navigate("/"); setSidebarOpen(false); }} active={window.location.pathname === "/"} />
                 <SidebarItem icon={<ShieldCheck size={18} />} label="ADMIN PANEL" onClick={() => { navigate("/admin"); setSidebarOpen(false); }} active={window.location.pathname === "/admin"} color="text-emerald-400" />
              </div>

              <div>
                 <p className="px-4 mb-2 text-[10px] font-bold text-[var(--gray)] tracking-[3px] uppercase">Markets Database</p>
                 <div className="grid grid-cols-1 gap-1">
                    {markets.map(m => (
                       <SidebarItem key={m.id} icon={<Zap size={16} className="text-[var(--gold)]" />} label={m.id} onClick={() => { navigate(`/analyze/${m.id}`); setSidebarOpen(false); }} active={window.location.pathname.includes(`/analyze/${m.id}`)} badge="ONLINE" />
                    ))}
                 </div>
              </div>
           </nav>

           <div className="p-4 border-t border-[var(--border2)] bg-black/40">
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                 <div className="w-8 h-8 rounded bg-[var(--gold)]/20 flex items-center justify-center border border-[var(--gold)]/40 text-[var(--gold)] font-bold text-[10px] font-['Orbitron']">VIP</div>
                 <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] font-bold text-white truncate uppercase tracking-[0.5px]">Device: {deviceCode}</p>
                    <p className="text-[9px] text-[var(--gray)] font-bold tracking-[1px]">{role} ACCOUNT</p>
                 </div>
                 <button onClick={() => { localStorage.removeItem("supreme_token"); window.location.reload(); }} className="text-red-500 hover:scale-110 transition-transform"><LogOut size={16} /></button>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--navbar-bg)]/80 backdrop-blur-md border-b border-[var(--border2)] sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><Menu size={24} /></button>
          <div className="flex-1 px-6 overflow-hidden">
             <div className="whitespace-nowrap overflow-hidden">
                <p className="animate-[scroll_25s_linear_infinite] inline-block text-[11px] font-semibold tracking-[2px] text-[var(--gold)]/80 font-['JetBrains_Mono']">{systemSetting.runningText || "MENGHUBUNGKAN KE SERVER SUPREME..."}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-bold text-[var(--gray)] tracking-[1px]">LATENCY</span>
                <span className="text-[10px] font-bold text-emerald-400">12ms</span>
             </div>
             <div className="w-1 h-8 bg-[var(--border2)] opacity-30"></div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--blue)] flex items-center justify-center ring-2 ring-white/10 ring-offset-2 ring-offset-black">
                <UserPlus size={20} className="text-black" />
             </div>
          </div>
        </header>

        <section className="flex-1 p-4 lg:p-8 overflow-y-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-100">
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

      {/* Overlay Mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
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
  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Smartphone className="text-emerald-400" />} label="ACTIVE SESSION" value="1,204" desc="Connected Devices" />
          <StatCard icon={<Trophy className="text-[var(--gold)]" />} label="PREDICTION ACC" value="89.4%" desc="Model Performance" />
          <StatCard icon={<Zap className="text-[var(--cyan)]" />} label="ENGINE SPEED" value="0.4ms" desc="Response Time" />
          <StatCard icon={<PieChart className="text-purple-400" />} label="DATA VOLUME" value="1.5TB" desc="Processed Datasets" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="font-['Orbitron'] text-[16px] font-bold tracking-[3px] text-white underline underline-offset-8 decoration-[var(--gold)]">ACTIVE MARKETS</h2>
                <div className="flex gap-2">
                   <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {markets.map(m => {
                   const rawTokens = (m.historyData || "").split(/[\s\n\r\t,]+/);
                   const history = rawTokens.filter((token: string) => /^\d{4}$/.test(token));
                   const last = history.length > 0 ? history[history.length - 1] : "...";
                   return (
                    <button key={m.id} onClick={() => navigate(`/analyze/${m.id}`)} className="group p-3 md:p-5 bg-[var(--card)] border border-[var(--border2)] rounded-xl md:rounded-2xl hover:border-[var(--gold)] transition-all hover:translate-y-[-2px] text-left relative overflow-hidden backdrop-blur-md">
                       <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-[var(--gold)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl md:blur-2xl group-hover:bg-[var(--gold)]/10 transition-all"></div>
                       <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
                          <div>
                             <h3 className="font-['Orbitron'] text-[15px] md:text-[18px] font-extrabold text-[var(--gold)] group-hover:scale-105 transition-transform tracking-[1px] md:tracking-[2px]">{m.id}</h3>
                             <p className="text-[8px] md:text-[9px] font-bold text-[var(--gray)] tracking-[1px] uppercase">Verified</p>
                          </div>
                          <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg group-hover:rotate-12 transition-transform border border-emerald-500/20"><Target size={14} className="text-emerald-500 md:w-[18px] md:h-[18px]" /></div>
                       </div>
                       <div className="flex justify-between items-end relative z-10">
                          <div>
                             <p className="text-[8px] md:text-[10px] font-bold text-[var(--gray)] tracking-[1px] mb-0.5 md:mb-1 uppercase">Result</p>
                             <p className="text-[18px] md:text-[24px] font-black text-white font-['Orbitron'] tracking-[1px] md:tracking-[2px] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{last}</p>
                          </div>
                          <ChevronRight className="text-[var(--gold)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={18} />
                       </div>
                    </button>
                   );
                })}
             </div>
          </div>

          <div className="space-y-6">
             <h2 className="font-['Orbitron'] text-[16px] font-bold tracking-[3px] text-white underline underline-offset-8 decoration-[var(--cyan)]">ACTIVITY FEED</h2>
             <div className="bg-[var(--card)] border border-[var(--border2)] rounded-2xl p-6 h-[410px] flex flex-col backdrop-blur-md">
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <ActivityItem time="NOW" text="New prediction generated for SGP" type="system" />
                   <ActivityItem time="2m ago" text="Market database synchronization success" type="network" />
                   <ActivityItem time="15m ago" text="Device 482910 upgraded to PRO" type="user" />
                   <ActivityItem time="32m ago" text="AI Kernel update v5.0.2 applied" type="logic" />
                   <ActivityItem time="1h ago" text="Scheduled backup complete" type="system" />
                   <ActivityItem time="2h ago" text="New market HOUEI initialized" type="system" />
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border2)]">
                   <div className="p-3 bg-white/[0.03] rounded-xl text-[11px] font-bold text-[var(--cyan)] text-center tracking-[1px] border border-white/[0.05]">SYSTEM SECURE • ENCRYPTION ACTIVE</div>
                </div>
             </div>
          </div>
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
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode, pin })
      });
      const data = await res.json();
      if (data.success) {
        onAuthSuccess(data.role, data.token);
      } else {
        setError(data.message || "PIN Salah/Error");
      }
    } catch (err) {
      setError("Error Koneksi");
    }
    setLoading(false);
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

        <div className="mt-8 text-center">
          <p className="text-[9px] font-bold text-[var(--gray)] tracking-[1.5px] uppercase">Contact Administrator for activation keys</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import {
  Lock, Zap, ShieldCheck, LogOut, ChevronRight, Search, RefreshCw, Crown, Sparkles, Smartphone
} from "lucide-react";
import AnalyzeMenu from "./pages/AnalyzeMenu";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Router>
      <div className="app-container min-h-screen text-[var(--text)] selection:bg-[var(--gold)] selection:text-white overflow-x-hidden">
        <AppLayout />
      </div>
    </Router>
  );
}

function AppLayout() {
  const [deviceCode, setDeviceCode] = useState("");
  const [authStatus, setAuthStatus] = useState<"LOADING" | "LOCKED" | "READY" | "EXPIRED">("LOADING");
  const [authStage, setAuthStage] = useState("Menyiapkan aplikasi...");
  const [role, setRole] = useState("FREE");
  const [markets, setMarkets] = useState<any[]>([]);
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
      const { data, error } = await supabase.from("markets").select("*");
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setMarkets(sorted);
      setSystemSetting((prev: any) => ({ ...prev, dbError: null }));
    } catch (e: any) {
      console.error("Gagal fetch markets:", e);
      setSystemSetting((prev: any) => ({ ...prev, dbError: e.message || "Koneksi ke Database Supabase gagal." }));
    }
  };

  const fetchSettings = async () => {
    setSystemSetting({ runningText: "SUPREME ENGINE v2.0 - SISTEM PREDIKSI PASARAN TERAKURAT" });
  };

  useEffect(() => {
    const init = async () => {
      const code = getDeviceCode();
      setDeviceCode(code);

      const savedToken = localStorage.getItem("supreme_token");
      if (savedToken) {
        setAuthStatus("LOADING");
        setAuthStage("Memverifikasi akses...");
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: savedToken })
          });
          const json = await res.json();
          if (json.valid) {
            setRole(json.role);
            setAuthStatus("READY");
          } else {
            localStorage.removeItem("supreme_token");
            localStorage.removeItem("supreme_devcode");
            setAuthStatus("LOCKED");
            window.location.reload();
          }
        } catch {
          setAuthStatus("LOCKED");
        }
      } else {
        setAuthStatus("LOCKED");
      }

      fetchMarkets();
      fetchSettings();
    };
    init();
  }, []);

  if (authStatus === "LOADING") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/80 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-xl">
          <div className="absolute inset-3 rounded-[1.5rem] border-4 border-t-[var(--gold)] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <Zap className="relative text-[var(--gold)] w-8 h-8" />
        </div>
        <div>
          <p className="font-['Orbitron'] text-[11px] tracking-[4px] text-[var(--gold)] uppercase animate-pulse">{authStage}</p>
          <p className="mt-3 text-sm text-[var(--text-dim)]">Membuka pengalaman premium mobile.</p>
        </div>
        <button
          onClick={() => setAuthStatus("LOCKED")}
          className="rounded-2xl border border-[var(--border2)] bg-white/80 px-6 py-3 text-[11px] font-bold tracking-[2px] text-[var(--text)] shadow-lg transition active:scale-95 uppercase"
        >
          KLIK DISINI JIKA MACET
        </button>
      </div>
    );
  }

  if (authStatus === "LOCKED") return (
    <LayarKunci
      deviceCode={deviceCode}
      onAuthSuccess={(r, t) => {
        setRole(r);
        localStorage.setItem("supreme_token", t);
        setAuthStatus("READY");
      }}
    />
  );

  if (authStatus === "EXPIRED") return (
    <div className="flex items-center justify-center min-h-screen p-8 text-center">
      <div className="premium-panel max-w-sm p-8 border-l-4 border-l-[var(--red)]">
        <h2 className="font-['Orbitron'] text-[var(--red)] mb-4 tracking-[4px]">ACCOUNT EXPIRED</h2>
        <p className="text-sm text-[var(--text-dim)] mb-6">Masa trial akun anda telah berakhir. Hubungi Admin untuk aktivasi VIP.</p>
        <button onClick={() => { localStorage.removeItem("supreme_token"); localStorage.removeItem("supreme_devcode"); window.location.reload(); }} className="w-full bg-[var(--red)] p-4 rounded-2xl font-bold text-white text-[12px] tracking-[2px]">REFRESH</button>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-8 sm:px-6">
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="premium-panel overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">
                <Sparkles size={13} /> Premium Engine
              </div>
              <h1 className="font-['Orbitron'] text-[25px] font-black tracking-[5px] text-[var(--text)] sm:text-[32px]">ANALISA ANGKA</h1>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[3px] text-[var(--text-dim)]">Prediction tools yang clean, cepat, dan mobile friendly</p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[#f6d780] shadow-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-3 mb-5">
        <AccessCard role={role} />
        <div className="premium-card flex items-center justify-between gap-3 p-4 rounded-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]"><Smartphone size={18} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Identifier</p>
              <p className="font-['JetBrains_Mono'] text-sm font-black text-[var(--text)]">ID: {deviceCode}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600 ring-1 ring-emerald-200">ACTIVE</span>
        </div>

        {systemSetting?.dbError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-3xl shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[var(--red)] shrink-0" />
            <div className="flex flex-col">
              <span className="font-['Orbitron'] text-[11px] font-bold tracking-[1px] text-[var(--red)] uppercase">DATABASE ERROR</span>
              <span className="text-[11px] text-red-500 mt-1">{systemSetting.dbError}</span>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard markets={markets} />} />
          <Route path="/analyze/:marketId/*" element={<AnalyzeMenu />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function AccessCard({ role }: { role: string }) {
  const isMaster = role === "MASTER";
  const isPro = role === "PRO";
  return (
    <div className={`premium-card flex items-center justify-between gap-4 p-4 rounded-3xl border-l-4 ${isMaster ? 'border-l-[var(--gold)]' : isPro ? 'border-l-[var(--cyan)]' : 'border-l-slate-300'}`}>
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${isMaster ? 'bg-[var(--gold)]' : isPro ? 'bg-[var(--cyan)]' : 'bg-slate-300'}`}></div>
        <div>
          <p className="font-['Orbitron'] text-[11px] font-black tracking-[3px] text-[var(--text)] uppercase">{isMaster ? 'Admin Access' : isPro ? 'VIP Access' : 'Non VIP Access'}</p>
          <p className="mt-1 text-[11px] text-[var(--text-dim)]">Status akun dan fitur aktif.</p>
        </div>
      </div>
      <Crown className={`h-5 w-5 ${isMaster || isPro ? 'text-[var(--gold)]' : 'text-slate-300'}`} />
    </div>
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
    <div className="animate-[riseIn_0.55s_ease-out]">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-['Orbitron'] text-[15px] font-black tracking-[4px] text-[var(--text)]">PILIH PASARAN</h2>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Pilih market untuk mulai analisa.</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 border border-[var(--border2)] text-[var(--text-dim)] shadow-lg transition active:scale-95">
          <RefreshCw size={19} />
        </button>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="text-[var(--text-dim)]" />
        </div>
        <input
          type="text"
          placeholder="Cari pasaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-16 bg-white/86 border border-[var(--border2)] rounded-3xl pl-13 pr-4 text-[15px] font-bold text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:border-[var(--cyan)] focus:ring-4 focus:ring-sky-100 transition-all shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((m, idx) => {
            const dotColors = ["#8b5cf6", "#d7a63a", "#0ea5e9", "#10b981", "#ef4444", "#2563eb"];
            const dotColor = dotColors[idx % dotColors.length];
            return (
              <button key={m.id} onClick={() => navigate(`/analyze/${m.id}`)} className="group flex min-h-[82px] flex-col justify-between rounded-3xl border border-[var(--border2)] bg-white/84 p-4 text-left shadow-lg transition active:scale-[0.975]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: dotColor }}></div>
                  <ChevronRight size={18} className="text-[var(--text-dim)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="block truncate font-['Orbitron'] text-[13px] font-black tracking-[2px] text-[var(--text)]">{m.id}</span>
                  {m.name && <span className="mt-1 block truncate text-[11px] text-[var(--text-dim)]">{m.name}</span>}
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 sm:col-span-3 py-10 text-center border border-dashed border-[var(--border2)] rounded-3xl bg-white/50">
            <p className="text-[12px] tracking-[2px] text-[var(--text-dim)]">PASARAN TIDAK DITEMUKAN</p>
          </div>
        )}
      </div>

      <div className="mt-4 mb-10 flex justify-center">
        <button onClick={() => { localStorage.removeItem("supreme_token"); localStorage.removeItem("supreme_devcode"); sessionStorage.setItem("supreme_skip_auto", "true"); window.location.reload(); }} className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-[11px] font-black uppercase tracking-[3px] text-red-500 shadow-sm transition active:scale-95">
          <LogOut size={16} /> KELUAR SISTEM
        </button>
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
        body: JSON.stringify({ pin, deviceCode })
      });
      const json = await res.json();
      if (json.success) {
        onAuthSuccess(json.role, json.token);
      } else {
        setError(json.error || "PIN SALAH!");
      }
    } catch {
      setError("Error koneksi server!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5">
      <div className="premium-panel relative w-full max-w-sm overflow-hidden p-7 sm:p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]"></div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-[var(--gold)] to-[#f4d27a] shadow-xl ring-4 ring-white/70">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h2 className="font-['Orbitron'] text-[21px] font-black text-[var(--text)] tracking-[4px] mb-2">SYSTEM ACCESS</h2>
          <p className="text-sm text-[var(--text-dim)]">Masukkan PIN untuk membuka dashboard premium.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-[var(--text-dim)] mb-2 tracking-[2px] uppercase ml-1">Device Key Identifier</label>
            <input type="text" value={deviceCode} readOnly className="w-full h-13 bg-slate-50 border border-[var(--border2)] rounded-2xl px-4 text-[var(--text)] text-[16px] font-black tracking-[4px] font-['Roboto_Mono'] text-center focus:outline-none" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-[var(--cyan)] mb-2 tracking-[2px] uppercase ml-1">Secure Entrance PIN</label>
            <input type="password" value={pin} autoFocus onChange={e => setPin(e.target.value)} placeholder="••••" className="w-full h-15 bg-white border-2 border-[var(--border2)] focus:border-[var(--cyan)] focus:ring-4 focus:ring-sky-100 rounded-2xl px-4 text-[var(--text)] text-[24px] font-black tracking-[12px] font-['Roboto_Mono'] text-center transition-all placeholder:opacity-20 outline-none" />
          </div>

          {error && <p className="text-[11px] text-red-500 font-bold bg-red-50 border border-red-200 p-3 rounded-2xl text-center tracking-[1px] uppercase">{error}</p>}

          <button type="submit" disabled={loading || !pin} className="w-full bg-gradient-to-r from-[var(--gold)] to-[#f2cc70] text-white py-4 rounded-2xl text-[12px] font-black tracking-[4px] disabled:opacity-50 shadow-xl active:scale-95 transition-all uppercase">
            {loading ? "MEMVERIFIKASI..." : "ACCESS GRANTED"}
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--text-dim)] mt-6">
          <a href="https://wa.me/6285792030642?text=Halo%2C%20saya%20minta%20PIN%20aktivasi%20Analisa%20Angka" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--gold)] hover:text-[var(--text)] transition-colors underline underline-offset-4">
            Hubungi Pembuat untuk Aktivasi PIN
          </a>
        </p>
      </div>
    </div>
  );
}

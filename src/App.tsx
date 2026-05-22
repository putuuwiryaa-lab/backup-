import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Zap, ShieldCheck, Search, RefreshCw, Crown, Sparkles, Smartphone, Database, MessageCircle, LogOut
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import AnalyzeMenu from "./pages/AnalyzeMenu";
import AdminPage from "./pages/AdminPage";
import LoginGate from "./components/LoginGate";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  return (
    <Router>
      <div className="app-container min-h-screen text-[var(--text)] selection:bg-[var(--gold)] selection:text-black overflow-x-hidden">
        <AppLayout />
        <Analytics />
      </div>
    </Router>
  );
}

function AppLayout() {
  const location = useLocation();
  const [deviceId, setDeviceId] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [authStatus, setAuthStatus] = useState<"LOADING" | "LOCKED" | "READY" | "EXPIRED">("LOADING");
  const [authStage, setAuthStage] = useState("Menyiapkan aplikasi...");
  const [role, setRole] = useState("FREE");
  const [markets, setMarkets] = useState<any[]>([]);
  const [systemSetting, setSystemSetting] = useState<any>({ runningText: "..." });
  const isAnalyzePage = location.pathname.startsWith("/analyze/");

  const getDeviceIdentity = () => {
    let storedDeviceId = localStorage.getItem("supreme_device_id");
    if (!storedDeviceId) {
      storedDeviceId = crypto.randomUUID();
      localStorage.setItem("supreme_device_id", storedDeviceId);
    }

    let storedDisplayCode = localStorage.getItem("supreme_display_code");
    if (!storedDisplayCode || storedDisplayCode.length !== 6) {
      storedDisplayCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("supreme_display_code", storedDisplayCode);
    }

    return { deviceId: storedDeviceId, displayCode: storedDisplayCode };
  };

  const handleLogout = () => {
    localStorage.removeItem("supreme_token");
    setRole("FREE");
    setAuthStatus("LOCKED");
  };

  const getLastResult = (historyData: string) => {
    const tokens = String(historyData || "").trim().split(/[\s\n\r\t,]+/);
    for (let i = tokens.length - 1; i >= 0; i--) if (/^\d{4}$/.test(tokens[i])) return tokens[i];
    return "----";
  };

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase.from("markets").select("*");
      if (error) throw error;
      const sorted = (data || [])
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map((m: any) => ({ ...m, lastResult: getLastResult(m.history_data) }));
      setMarkets(sorted);
      setSystemSetting((prev: any) => ({ ...prev, dbError: null }));
    } catch (e: any) {
      setSystemSetting((prev: any) => ({ ...prev, dbError: e.message || "Koneksi ke Database Supabase gagal." }));
    }
  };

  const fetchSettings = async () => {
    setSystemSetting({ runningText: "SUPREME ENGINE v2.0 - SISTEM PREDIKSI PASARAN TERAKURAT" });
  };

  useEffect(() => {
    const init = async () => {
      const identity = getDeviceIdentity();
      setDeviceId(identity.deviceId);
      setDisplayCode(identity.displayCode);

      const savedToken = localStorage.getItem("supreme_token");
      if (savedToken) {
        setAuthStatus("LOADING");
        setAuthStage("Memverifikasi akses...");
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: savedToken, deviceId: identity.deviceId })
          });
          const json = await res.json();
          if (json.valid) {
            setRole(json.role);
            setAuthStatus("READY");
          } else {
            localStorage.removeItem("supreme_token");
            setAuthStatus("LOCKED");
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
    return <LoadingScreen authStage={authStage} onSkip={() => setAuthStatus("LOCKED")} />;
  }

  if (authStatus === "LOCKED") return (
    <LoginGate
      deviceId={deviceId}
      displayCode={displayCode}
      onAuthSuccess={(r, t) => {
        setRole(r);
        localStorage.setItem("supreme_token", t);
        setAuthStatus("READY");
      }}
    />
  );

  if (authStatus === "EXPIRED") return <ExpiredScreen />;

  return (
    <div className={`relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 sm:px-6 ${isAnalyzePage ? "pb-6 pt-4" : "pb-20 pt-5"}`}>
      {!isAnalyzePage && location.pathname !== "/admin" && (
        <>
          <HeroHeader />
          <StatusStrip role={role} displayCode={displayCode} />
        </>
      )}

      {systemSetting?.dbError && !isAnalyzePage && (
        <div className="mb-4 flex items-start gap-3 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--red)]" />
          <div>
            <span className="font-['Orbitron'] text-[10px] font-bold uppercase tracking-[2px] text-[var(--red)]">Database Error</span>
            <p className="mt-1 text-[11px] leading-5 text-red-200">{systemSetting.dbError}</p>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<Dashboard markets={markets} onRefresh={fetchMarkets} />} />
          <Route path="/analyze/:marketId/*" element={<AnalyzeMenu />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAnalyzePage && <FloatingActions onLogout={handleLogout} />}
    </div>
  );
}

function LoadingScreen({ authStage, onSkip }: { authStage: string; onSkip: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[var(--card2)] shadow-2xl ring-1 ring-white/10">
        <div className="absolute inset-2 rounded-[1.7rem] border-4 border-t-[var(--gold)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <Zap className="relative h-9 w-9 text-[var(--gold)]" />
      </div>
      <div>
        <p className="font-['Orbitron'] text-[11px] uppercase tracking-[4px] text-[var(--gold)] animate-pulse">{authStage}</p>
        <p className="mt-3 text-sm text-[var(--text-dim)]">Membuka dashboard analisa premium.</p>
      </div>
      <button onClick={onSkip} className="ghost-button px-6 py-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--text)] active:scale-95">Klik jika macet</button>
    </div>
  );
}

function ExpiredScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center">
      <div className="premium-panel max-w-sm p-8">
        <h2 className="mb-4 font-['Orbitron'] text-[var(--red)] tracking-[4px]">ACCOUNT EXPIRED</h2>
        <p className="mb-6 text-sm text-[var(--text-dim)]">Masa trial akun anda telah berakhir. Hubungi Admin untuk aktivasi VIP.</p>
        <button onClick={() => { localStorage.removeItem("supreme_token");  window.location.reload(); }} className="w-full rounded-2xl bg-[var(--red)] p-4 text-[12px] font-black tracking-[2px] text-white">REFRESH</button>
      </div>
    </div>
  );
}

function HeroHeader() {
  return (
    <header className="hero-header mb-4">
      <div className="hero-card premium-panel relative overflow-hidden p-5 sm:p-6">
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="hero-badge mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">
              <Sparkles size={13} /> Supreme Dark Pro
            </div>
            <h1 className="font-['Orbitron'] text-[28px] font-black uppercase leading-none tracking-[5px] text-[var(--text)] sm:text-[36px]">Analisa Angka</h1>
            <p className="mt-3 max-w-sm text-[12px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]">Aplikasi berbasis matematis.</p>
          </div>
          <div className="hero-crown flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-white/12 bg-[rgba(124,77,255,0.22)] text-[var(--cyan-bright)]">
            <Crown className="h-7 w-7 text-[var(--cyan-bright)]" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
}

function formatTokenExpiry() {
  try {
    const token = localStorage.getItem("supreme_token");
    if (!token) return "Masa aktif";
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "Masa aktif";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    if (!payload.exp) return "Masa aktif";
    const expiredAt = new Date(payload.exp * 1000);
    return expiredAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "Masa aktif";
  }
}

function StatusStrip({ role, displayCode }: { role: string; displayCode: string }) {
  const isMaster = role === "MASTER";
  const isPro = role === "PRO";
  const isTrial = role === "TRIAL";
  const roleLabel = isMaster ? "MASTER" : isPro ? "VIP" : isTrial ? "TRIAL" : role;
  const roleSub = isTrial ? `Habis ${formatTokenExpiry()}` : "";
  return (
    <div className="status-strip mb-5 grid grid-cols-2 gap-3">
      <div className="premium-card flex min-h-[78px] items-center gap-3 p-4">
        <div className={`h-11 w-11 shrink-0 rounded-2xl ${isMaster ? "bg-[var(--gold-dim)] text-[var(--gold)]" : isPro ? "bg-[var(--cyan-dim)] text-[var(--cyan)]" : "bg-white/8 text-white/55"} flex items-center justify-center`}>
          <Crown size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">{roleLabel}</p>
          {roleSub && <p className="mt-1 truncate text-[10px] text-[var(--text-dim)]">{roleSub}</p>}
        </div>
      </div>
      <div className="premium-card flex min-h-[78px] items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]"><Smartphone size={19} /></div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</p>
          <p className="font-['JetBrains_Mono'] text-[14px] font-black text-[var(--text)]">{displayCode}</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ markets, onRefresh }: { markets: any[]; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredMarkets = useMemo(() => {
    const q = search.toLowerCase();
    return markets
      .filter(m => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [markets, search]);

  return (
    <div className="dashboard-page animate-[riseIn_0.35s_ease-out]">
      <div className="market-section-title mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-['Orbitron'] text-[15px] font-black uppercase tracking-[4px] text-[var(--text)]">Pilih Pasaran</h2>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Pilih market untuk mulai analisa.</p>
        </div>
        <button onClick={onRefresh} className="ghost-button flex h-12 w-12 items-center justify-center text-[var(--text-dim)] active:scale-95">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="market-search relative mb-5">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center"><Search size={20} className="text-[var(--text-dim)]" /></div>
        <input type="text" placeholder="Cari pasaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="soft-input h-15 w-full pl-13 pr-4 text-[15px] font-bold placeholder:text-[var(--text-dim)]" />
      </div>

      <div className="market-grid market-grid-compact grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3">
        {filteredMarkets.length > 0 ? filteredMarkets.map((m) => {
          const title = m.name || m.id;
          const lastResult = m.lastResult || "----";
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/analyze/${m.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/analyze/${m.id}`);
              }}
              className="market-card market-card-compact premium-card relative cursor-pointer overflow-hidden text-center transition active:scale-[0.985]"
            >
              <div className="market-name-strip">
                <span className="market-name block truncate font-['Orbitron'] text-[12px] font-black uppercase tracking-[2px] text-[var(--text)]">{title}</span>
              </div>
              <div className="market-result-row flex flex-1 items-center justify-center">
                <span className="market-last-value font-['JetBrains_Mono'] text-[18px] font-black tracking-[1px] text-[var(--cyan)]">{lastResult}</span>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 rounded-3xl border border-dashed border-white/14 bg-white/5 py-12 text-center sm:col-span-3">
            <Database className="mx-auto mb-3 text-[var(--text-dim)]" />
            <p className="text-[12px] uppercase tracking-[2px] text-[var(--text-dim)]">Pasaran tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingActions({ onLogout }: { onLogout: () => void }) {
  const openReport = () => {
    window.open("https://wa.me/6285792030642?text=Halo%2C%20saya%20ingin%20melaporkan%20masalah%20pada%20aplikasi%20Analisa%20Angka", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={onLogout}
        className="report-floating-button flex h-11 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-[1.4px] active:scale-95"
        aria-label="Logout"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
      <button
        type="button"
        onClick={openReport}
        className="report-floating-button flex h-11 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-[1.4px] active:scale-95"
        aria-label="Laporkan Masalah"
      >
        <MessageCircle size={16} />
        <span>Laporkan Masalah</span>
      </button>
    </div>
  );
}

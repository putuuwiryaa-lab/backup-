import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Zap, ShieldCheck, Search, RefreshCw, Sparkles, Database, MessageCircle, LogOut, Copy
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
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

  const requestLogout = () => {
    setShowAccountPanel(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("supreme_token");
    setRole("FREE");
    setShowLogoutConfirm(false);
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
    <div className={`relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 sm:px-6 ${isAnalyzePage ? "pb-6 pt-4" : "pb-32 pt-4"}`}>
      {!isAnalyzePage && location.pathname !== "/admin" && <HeroHeader />}

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

      {!isAnalyzePage && location.pathname !== "/admin" && <BottomAccountNav onOpenAccount={() => setShowAccountPanel(true)} />}

      <AccountPanel
        open={showAccountPanel}
        role={role}
        displayCode={displayCode}
        onClose={() => setShowAccountPanel(false)}
        onLogout={requestLogout}
      />
      <LogoutConfirmModal open={showLogoutConfirm} onCancel={() => setShowLogoutConfirm(false)} onConfirm={confirmLogout} />
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

function getAccountInfo(role: string) {
  const isMaster = role === "MASTER";
  const isPro = role === "PRO";
  const isTrial = role === "TRIAL";
  const roleLabel = isMaster ? "MASTER" : isPro ? "VIP" : isTrial ? "TRIAL" : role;
  const roleSub = isMaster ? "Admin access" : isPro || isTrial ? `Aktif sampai ${formatTokenExpiry()}` : "Akses aktif";
  return { roleLabel, roleSub };
}

function AppLogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={`app-logo-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="appLogoGold" x1="12" y1="52" x2="52" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8c76a" />
          <stop offset="0.48" stopColor="#8df7df" />
          <stop offset="1" stopColor="#8f7cff" />
        </linearGradient>
        <linearGradient id="appLogoSoft" x1="16" y1="48" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe29a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#b79cff" stopOpacity="0.85" />
        </linearGradient>
        <filter id="appLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.95 0 0 0 0 0.86 0 0 0 0.55 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M32 5.5 54.5 18.5v27L32 58.5 9.5 45.5v-27L32 5.5Z" stroke="url(#appLogoGold)" strokeWidth="3.2" strokeLinejoin="round" filter="url(#appLogoGlow)" />
      <path d="M32 13.5 47.2 22.2v18.1L32 49 16.8 40.3V22.2L32 13.5Z" stroke="url(#appLogoGold)" strokeWidth="2" strokeLinejoin="round" opacity="0.72" />
      <path d="M19 44 31.6 17.5 45 44" stroke="url(#appLogoSoft)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.2 35.2h13.6" stroke="#0b1119" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <path d="M26 35.2h12" stroke="url(#appLogoGold)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 18.5 32 44" stroke="#9fffe6" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function HeroHeader() {
  return (
    <header className="hero-header mb-4">
      <div className="hero-card premium-panel relative overflow-hidden p-5 sm:p-6">
        <div className="hero-crown absolute right-5 top-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-[rgba(124,77,255,0.22)] text-[var(--cyan-bright)]">
          <AppLogoMark className="h-8 w-8" />
        </div>

        <div className="hero-copy relative flex min-h-[118px] max-w-[82%] flex-col justify-center">
          <div className="hero-badge mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--gold)]">
            <Sparkles size={12} /> Supreme Dark Pro
          </div>
          <h1 className="font-['Orbitron'] text-[26px] font-black uppercase leading-none tracking-[4px] text-[var(--text)] sm:text-[34px]">Analisa Angka</h1>
          <p className="mt-3 max-w-sm text-[11px] font-semibold uppercase tracking-[1.6px] text-[var(--text-dim)]">Aplikasi berbasis matematis.</p>
        </div>
      </div>
    </header>
  );
}

function formatMarketUpdatedAt(value: any) {
  if (!value) return "Belum ada info update";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Info update tidak valid";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Dashboard({ markets, onRefresh }: { markets: any[]; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const latestMarketUpdate = useMemo(() => {
    const timestamps = markets
      .map((m) => new Date(m.updated_at || 0).getTime())
      .filter((time) => Number.isFinite(time) && time > 0);
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps)).toISOString();
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    const q = search.toLowerCase();
    return markets
      .filter(m => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [markets, search]);

  return (
    <div className="dashboard-page animate-[riseIn_0.35s_ease-out]">
      <div className="market-section-title mb-4 px-1">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex min-w-0 max-w-[calc(100%-4rem)] rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="truncate text-[9px] font-black uppercase tracking-[1.5px] text-[var(--cyan)]">Data pasar diperbarui: {formatMarketUpdatedAt(latestMarketUpdate)}</span>
          </div>
          <button onClick={onRefresh} className="ghost-button flex h-12 w-12 shrink-0 items-center justify-center text-[var(--text-dim)] active:scale-95" aria-label="Refresh data pasaran">
            <RefreshCw size={18} />
          </button>
        </div>
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

function BottomAccountNav({ onOpenAccount }: { onOpenAccount: () => void }) {
  return (
    <div className="bottom-account-nav fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto max-w-3xl">
      <div className="bottom-account-shell rounded-[1.75rem] border border-white/12 bg-black/32 p-2 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onOpenAccount}
          className="bottom-account-button flex h-13 w-full items-center justify-center gap-3 rounded-[1.35rem] text-[11px] font-black uppercase tracking-[2px] active:scale-[0.99]"
          aria-label="Akun Saya"
        >
          <AppLogoMark className="h-5 w-5" />
          <span>Akun Saya</span>
        </button>
      </div>
    </div>
  );
}

function AccountPanel({ open, role, displayCode, onClose, onLogout }: { open: boolean; role: string; displayCode: string; onClose: () => void; onLogout: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const { roleLabel, roleSub } = getAccountInfo(role);
  const activationMessage = encodeURIComponent(`Halo, saya ingin bantuan Analisa Angka. Device Key saya ${displayCode}`);
  const activationUrl = `https://wa.me/6285119341538?text=${activationMessage}`;

  const handleCopyDeviceKey = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="premium-panel w-full max-w-sm p-5 shadow-2xl animate-[riseIn_0.2s_ease-out]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">Akun Saya</p>
            <h3 className="mt-2 font-['Orbitron'] text-[20px] font-black uppercase tracking-[3px] text-[var(--text)]">{roleLabel}</h3>
          </div>
          <button type="button" onClick={onClose} className="ghost-button h-10 rounded-2xl px-4 text-[10px] font-black uppercase tracking-[1.6px] active:scale-95">Tutup</button>
        </div>

        <div className="mb-4 grid gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Masa Aktif</p>
            <p className="mt-2 text-[13px] font-bold text-[var(--text)]">{roleSub}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</p>
              <button
                type="button"
                onClick={handleCopyDeviceKey}
                className="ghost-button flex h-9 items-center gap-2 rounded-2xl px-3 text-[9px] font-black uppercase tracking-[1.4px] active:scale-95"
              >
                <Copy size={14} /> {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
            <p className="font-['JetBrains_Mono'] text-[26px] font-black tracking-[5px] text-[var(--gold-bright)]">{displayCode}</p>
            <p className="mt-2 text-[10px] leading-4 text-[var(--text-soft)]">Kirim Device Key ini saat aktivasi VIP atau lapor masalah.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a href={activationUrl} target="_blank" rel="noopener noreferrer" className="report-floating-button flex h-12 items-center justify-center gap-2 rounded-2xl border text-[11px] font-black uppercase tracking-[1.6px] active:scale-95">
            <MessageCircle size={17} />
            <span>Lapor</span>
          </a>
          <button type="button" onClick={onLogout} className="rounded-2xl border border-red-400/25 bg-red-500/12 text-[11px] font-black uppercase tracking-[1.6px] text-red-200 active:scale-95">
            <span className="inline-flex items-center justify-center gap-2"><LogOut size={17} /> Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoutConfirmModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="premium-panel w-full max-w-sm p-5 shadow-2xl animate-[riseIn_0.2s_ease-out]">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-400/25">
            <LogOut size={22} />
          </div>
          <h3 className="font-['Orbitron'] text-[16px] font-black uppercase tracking-[2px] text-[var(--text)]">Yakin ingin log out?</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="ghost-button py-3 text-[11px] font-black uppercase tracking-[2px] active:scale-95">Batal</button>
          <button type="button" onClick={onConfirm} className="rounded-3xl border border-red-400/25 bg-red-500/12 py-3 text-[11px] font-black uppercase tracking-[2px] text-red-200 transition active:scale-95">Log out</button>
        </div>
      </div>
    </div>
  );
}

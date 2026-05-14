import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Lock, Zap, ShieldCheck, LogOut, Search, RefreshCw, Crown, Sparkles, Smartphone, Home, KeyRound, ArrowRight, Database, MessageCircle, Star
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import AnalyzeMenu from "./pages/AnalyzeMenu";
import AdminPage from "./pages/AdminPage";

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
  const navigate = useNavigate();
  const [deviceCode, setDeviceCode] = useState("");
  const [authStatus, setAuthStatus] = useState<"LOADING" | "LOCKED" | "READY" | "EXPIRED">("LOADING");
  const [authStage, setAuthStage] = useState("Menyiapkan aplikasi...");
  const [role, setRole] = useState("FREE");
  const [markets, setMarkets] = useState<any[]>([]);
  const [systemSetting, setSystemSetting] = useState<any>({ runningText: "..." });
  const isAnalyzePage = location.pathname.startsWith("/analyze/");

  const getDeviceCode = () => {
    let code = localStorage.getItem("supreme_devcode");
    if (!code || code.length !== 4) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      localStorage.setItem("supreme_devcode", code);
    }
    return code;
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
            body: JSON.stringify({ token: savedToken, deviceCode: code })
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
    <LayarKunci
      deviceCode={deviceCode}
      onAuthSuccess={(r, t) => {
        setRole(r);
        localStorage.setItem("supreme_token", t);
        setAuthStatus("READY");
      }}
    />
  );

  if (authStatus === "EXPIRED") return <ExpiredScreen />;

  return (
    <div className={`relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 sm:px-6 ${isAnalyzePage ? "pb-6 pt-4" : "pb-28 pt-5"}`}>
      {!isAnalyzePage && location.pathname !== "/admin" && (
        <>
          <HeroHeader />
          <StatusStrip role={role} deviceCode={deviceCode} />
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

      {!isAnalyzePage && <BottomNav currentPath={location.pathname} onNavigate={navigate} />}
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
    <header className="mb-4">
      <div className="premium-panel relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--gold-dim)] blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">
              <Sparkles size={13} /> Supreme Dark Pro
            </div>
            <h1 className="font-['Orbitron'] text-[28px] font-black uppercase leading-none tracking-[5px] text-[var(--text)] sm:text-[36px]">Analisa Angka</h1>
            <p className="mt-3 max-w-sm text-[12px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]">Aplikasi berbasis matematis.</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[var(--gold)] shadow-lg shadow-yellow-900/20">
            <Crown className="h-7 w-7 text-black" />
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

function StatusStrip({ role, deviceCode }: { role: string; deviceCode: string }) {
  const isMaster = role === "MASTER";
  const isPro = role === "PRO";
  const isTrial = role === "TRIAL";
  const roleLabel = isMaster ? "MASTER" : isPro ? "VIP" : isTrial ? "TRIAL" : role;
  const roleSub = isTrial ? `Habis ${formatTokenExpiry()}` : "";
  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
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
          <p className="truncate text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device ID</p>
          <p className="font-['JetBrains_Mono'] text-[14px] font-black text-[var(--text)]">{deviceCode}</p>
        </div>
      </div>
    </div>
  );
}

const FAVORITES_STORAGE_KEY = "supreme_favorite_markets";

function Dashboard({ markets, onRefresh }: { markets: any[]; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = (marketId: string) => {
    setFavoriteIds((current) => {
      if (current.includes(marketId)) return current.filter((id) => id !== marketId);
      return [marketId, ...current];
    });
  };

  const filteredMarkets = useMemo(() => {
    const q = search.toLowerCase();
    return markets
      .filter(m => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        const aFav = favoriteSet.has(a.id);
        const bFav = favoriteSet.has(b.id);
        if (aFav !== bFav) return aFav ? -1 : 1;
        return (a.order ?? 99) - (b.order ?? 99);
      });
  }, [markets, search, favoriteSet]);

  return (
    <div className="animate-[riseIn_0.35s_ease-out]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-['Orbitron'] text-[15px] font-black uppercase tracking-[4px] text-[var(--text)]">Pilih Pasaran</h2>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Market aktif siap dianalisa. Tap bintang untuk favorit.</p>
        </div>
        <button onClick={onRefresh} className="ghost-button flex h-12 w-12 items-center justify-center text-[var(--text-dim)] active:scale-95">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="relative mb-5">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center"><Search size={20} className="text-[var(--text-dim)]" /></div>
        <input type="text" placeholder="Cari pasaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="soft-input h-15 w-full pl-13 pr-4 text-[15px] font-bold placeholder:text-[var(--text-dim)]" />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3">
        {filteredMarkets.length > 0 ? filteredMarkets.map((m) => {
          const title = m.name || m.id;
          const lastResult = m.lastResult || "----";
          const isReady = lastResult !== "----";
          const isFavorite = favoriteSet.has(m.id);
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/analyze/${m.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/analyze/${m.id}`);
              }}
              className="premium-card group relative min-h-[122px] cursor-pointer overflow-hidden p-4 text-left transition active:scale-[0.985]"
            >
              <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-[var(--cyan-dim)] blur-xl transition group-active:bg-[var(--gold-dim)]" />
              <button
                type="button"
                aria-label={isFavorite ? `Hapus ${title} dari favorit` : `Tambahkan ${title} ke favorit`}
                aria-pressed={isFavorite}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(m.id);
                }}
                className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-2xl border transition active:scale-95 ${isFavorite ? "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-white/10 bg-black/20 text-[var(--text-dim)]"}`}
              >
                <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <div className="relative flex h-full flex-col justify-between gap-4 pr-8">
                <div>
                  <span className="block truncate font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px] text-[var(--text)]">{title}</span>
                  <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[1.5px] text-[var(--text-dim)]">{isFavorite ? "Favorit" : isReady ? "Ready" : "No Data"}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Last</p>
                    <p className="font-['JetBrains_Mono'] text-[17px] font-black tracking-[1px] text-[var(--cyan)]">{lastResult}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)]"><ArrowRight size={17} /></div>
                </div>
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

function BottomNav({ currentPath, onNavigate }: { currentPath: string; onNavigate: any }) {
  const logout = () => {
    localStorage.removeItem("supreme_token");
    // supreme_devcode TIDAK dihapus → device ID tetap sama
    sessionStorage.setItem("supreme_skip_auto", "true");
    window.location.reload();
  };
  const openReport = () => {
    window.open("https://wa.me/6285792030642?text=Halo%2C%20saya%20ingin%20report%20bug%20atau%20kendala%20aplikasi%20Analisa%20Angka", "_blank", "noopener,noreferrer");
  };
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-md">
      <div className="bottom-nav grid grid-cols-3 gap-1 rounded-[2rem] p-2">
        <button onClick={() => onNavigate("/")} className={`flex flex-col items-center gap-1 rounded-3xl px-3 py-3 text-[9px] font-black uppercase tracking-[1px] ${currentPath === "/" ? "bg-[var(--gold)] text-black" : "text-[var(--text-dim)]"}`}><Home size={17} /> Home</button>
        <button onClick={openReport} className="flex flex-col items-center gap-1 rounded-3xl px-3 py-3 text-[9px] font-black uppercase tracking-[1px] text-[var(--cyan)]"><MessageCircle size={17} /> Report</button>
        <button onClick={logout} className="flex flex-col items-center gap-1 rounded-3xl px-3 py-3 text-[9px] font-black uppercase tracking-[1px] text-red-300"><LogOut size={17} /> Keluar</button>
      </div>
    </div>
  );
}

function LayarKunci({ deviceCode, onAuthSuccess }: { deviceCode: string; onAuthSuccess: (role: string, token: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activationMessage = encodeURIComponent(`Halo, saya minta PIN aktivasi Analisa Angka dengan ID ${deviceCode}`);
  const activationUrl = `https://wa.me/6285792030642?text=${activationMessage}`;

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
      if (json.success) onAuthSuccess(json.role, json.token);
      else setError(json.error || "PIN SALAH!");
    } catch {
      setError("Error koneksi server!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5">
      <div className="premium-panel relative w-full max-w-sm overflow-hidden p-7 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-[var(--cyan)] to-[var(--gold)]" />
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[var(--gold)] shadow-lg shadow-yellow-900/20 ring-4 ring-white/10">
            <Lock className="h-9 w-9 text-black" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]"><KeyRound size={12} /> Secure Login</div>
          <h2 className="mb-2 font-['Orbitron'] text-[23px] font-black uppercase tracking-[4px] text-[var(--text)]">System Access</h2>
          <p className="text-sm text-[var(--text-dim)]">Masukkan PIN untuk membuka dashboard premium.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="ml-1 mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</label>
            <input type="text" value={deviceCode} readOnly className="soft-input h-14 w-full px-4 text-center font-['JetBrains_Mono'] text-[18px] font-black tracking-[5px]" />
          </div>
          <div>
            <label className="ml-1 mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">PIN Aktivasi</label>
            <input type="password" value={pin} autoFocus onChange={e => setPin(e.target.value)} placeholder="••••••" className="soft-input h-16 w-full px-4 text-center font-['JetBrains_Mono'] text-[24px] font-black tracking-[10px] placeholder:opacity-20" />
          </div>
          {error && <p className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-center text-[11px] font-bold uppercase tracking-[1px] text-red-300">{error}</p>}
          <button type="submit" disabled={loading || !pin} className="primary-button w-full py-4 text-[12px] font-black uppercase tracking-[4px] disabled:opacity-50 active:scale-95">
            {loading ? "Memverifikasi..." : "Buka Akses"}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-[var(--text-dim)]">
          <a href={activationUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--gold)] underline underline-offset-4">Hubungi Pembuat untuk Aktivasi PIN</a>
        </p>
      </div>
    </div>
  );
}

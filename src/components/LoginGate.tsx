import React, { useState } from "react";
import { KeyRound, Lock, MessageCircle, Sparkles } from "lucide-react";

type LoginGateProps = {
  deviceId: string;
  displayCode: string;
  onAuthSuccess: (role: string, token: string) => void;
};

function AppLogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={`app-logo-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="loginLogoGold" x1="12" y1="52" x2="52" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8c76a" />
          <stop offset="0.48" stopColor="#8df7df" />
          <stop offset="1" stopColor="#8f7cff" />
        </linearGradient>
        <linearGradient id="loginLogoSoft" x1="16" y1="48" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe29a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#b79cff" stopOpacity="0.85" />
        </linearGradient>
        <filter id="loginLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.95 0 0 0 0 0.86 0 0 0 0.55 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M32 5.5 54.5 18.5v27L32 58.5 9.5 45.5v-27L32 5.5Z" stroke="url(#loginLogoGold)" strokeWidth="3.2" strokeLinejoin="round" filter="url(#loginLogoGlow)" />
      <path d="M32 13.5 47.2 22.2v18.1L32 49 16.8 40.3V22.2L32 13.5Z" stroke="url(#loginLogoGold)" strokeWidth="2" strokeLinejoin="round" opacity="0.72" />
      <path d="M19 44 31.6 17.5 45 44" stroke="url(#loginLogoSoft)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.2 35.2h13.6" stroke="#0b1119" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <path d="M26 35.2h12" stroke="url(#loginLogoGold)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 18.5 32 44" stroke="#9fffe6" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export default function LoginGate({ deviceId, displayCode, onAuthSuccess }: LoginGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPinLogin, setShowPinLogin] = useState(false);

  const activationMessage = encodeURIComponent(`Halo, saya ingin aktivasi VIP Analisa Angka. Device Key saya ${displayCode}`);
  const activationUrl = `https://wa.me/6285119341538?text=${activationMessage}`;

  const handleStartTrial = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, displayCode })
      });

      const json = await res.json();
      if (json.success) onAuthSuccess(json.role, json.token);
      else setError(json.error || "Trial tidak bisa diaktifkan");
    } catch {
      setError("Koneksi server gagal");
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, deviceId, displayCode })
      });

      const json = await res.json();
      if (json.success) onAuthSuccess(json.role, json.token);
      else setError(json.error || "PIN salah");
    } catch {
      setError("Koneksi server gagal");
    }

    setLoading(false);
  };

  return (
    <div className="login-page flex min-h-screen flex-col items-center justify-start px-5 pb-6 pt-[calc(2.1rem+env(safe-area-inset-top))] sm:pt-10">
      <div className="login-shell w-full max-w-sm">
        <div className="login-header-card mb-5 rounded-[2rem] border border-white/12 bg-white/[0.055] p-5 text-center shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-[4.65rem] w-[4.65rem] items-center justify-center rounded-[1.7rem] border border-white/14 bg-[rgba(124,77,255,0.20)] shadow-xl shadow-black/30">
            <AppLogoMark className="h-[3.55rem] w-[3.55rem]" />
          </div>
          <h1 className="font-['Orbitron'] text-[34px] font-black uppercase leading-none tracking-[5px] text-[var(--text)] sm:text-[38px]">Analisa Angka</h1>
          <p className="mt-4 text-[13px] font-semibold leading-5 text-[var(--text-dim)]">
            Mulai trial gratis atau masuk dengan PIN VIP.
          </p>
        </div>

        <div className="premium-panel relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--purple)] via-[var(--gold)] to-[var(--purple)]" />

          <div className="mb-5 rounded-3xl border border-white/12 bg-black/24 p-4 shadow-inner shadow-black/30">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan-bright)]">
                <KeyRound size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--text)]">Kode perangkat untuk aktivasi VIP</p>
              </div>
            </div>
            <p className="font-['JetBrains_Mono'] text-[28px] font-black tracking-[6px] text-[var(--text)]">{displayCode}</p>
          </div>

          {error && (
            <p className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-center text-[11px] font-bold uppercase tracking-[1px] text-red-300">
              {error}
            </p>
          )}

          {!showPinLogin ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleStartTrial}
                disabled={loading || !deviceId || !displayCode}
                className="primary-button w-full py-4 text-[12px] font-black uppercase tracking-[3px] disabled:opacity-50 active:scale-95"
              >
                {loading ? "Mengaktifkan..." : "Mulai Trial Gratis"}
              </button>

              <button
                type="button"
                onClick={() => { setError(""); setShowPinLogin(true); }}
                className="ghost-button w-full py-4 text-[11px] font-black uppercase tracking-[2px] active:scale-95"
              >
                Saya Punya PIN VIP
              </button>

              <a
                href={activationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-[1.6px] text-[var(--text-dim)] active:scale-95"
              >
                <MessageCircle size={16} /> Hubungi Admin
              </a>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="ml-1 mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">PIN VIP / MASTER</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-soft)]" />
                    <input
                      type="password"
                      value={pin}
                      autoFocus
                      inputMode="numeric"
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••••"
                      className="soft-input h-16 w-full px-4 pl-12 text-center font-['JetBrains_Mono'] text-[24px] font-black tracking-[10px] placeholder:opacity-20"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !pin} className="primary-button w-full py-4 text-[12px] font-black uppercase tracking-[4px] disabled:opacity-50 active:scale-95">
                  {loading ? "Memverifikasi..." : "Buka Akses VIP"}
                </button>
              </form>

              <div className="mt-5 grid gap-3 text-center text-[11px] text-[var(--text-dim)]">
                <button type="button" onClick={() => { setError(""); setShowPinLogin(false); }} className="ghost-button py-3 text-[10px] font-black uppercase tracking-[1.8px] active:scale-95">Kembali ke Trial Gratis</button>
                <a href={activationUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--gold)] underline underline-offset-4">Hubungi Admin untuk Aktivasi VIP</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

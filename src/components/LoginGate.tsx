import React, { useState } from "react";
import { Crown, KeyRound, Lock, MessageCircle, Sparkles } from "lucide-react";

type LoginGateProps = {
  deviceId: string;
  displayCode: string;
  onAuthSuccess: (role: string, token: string) => void;
};

export default function LoginGate({ deviceId, displayCode, onAuthSuccess }: LoginGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPinLogin, setShowPinLogin] = useState(false);

  const activationMessage = encodeURIComponent(`Halo, saya ingin aktivasi VIP Analisa Angka. Device Key saya ${displayCode}`);
  const activationUrl = `https://wa.me/6285792030642?text=${activationMessage}`;

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
    <div className="login-page flex min-h-screen flex-col items-center justify-center p-5">
      <div className="login-shell w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.65rem] border border-white/12 bg-[var(--gold-dim)] text-[var(--gold-bright)] shadow-xl shadow-black/30">
            <Crown className="h-8 w-8" strokeWidth={2.4} />
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[1.8px] text-[var(--gold)]">
            <Sparkles size={12} /> Analisa Angka
          </div>
          <h1 className="font-['Orbitron'] text-[25px] font-black uppercase leading-none tracking-[4px] text-[var(--text)]">Masuk Aplikasi</h1>
          <p className="mt-3 text-[13px] leading-5 text-[var(--text-dim)]">
            Mulai trial gratis atau masuk dengan PIN VIP.
          </p>
        </div>

        <div className="premium-panel relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--purple)] via-[var(--gold)] to-[var(--purple)]" />

          <div className="mb-5 rounded-3xl border border-white/10 bg-black/18 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan-bright)]">
                <KeyRound size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</p>
                <p className="mt-1 text-[11px] text-[var(--text-soft)]">Kode perangkat untuk aktivasi VIP</p>
              </div>
            </div>
            <p className="font-['JetBrains_Mono'] text-[28px] font-black tracking-[6px] text-[var(--gold-bright)]">{displayCode}</p>
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

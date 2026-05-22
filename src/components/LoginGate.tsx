import React, { useState } from "react";
import { KeyRound, Lock } from "lucide-react";

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
      setError("Error koneksi server!");
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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">
            <KeyRound size={12} /> Login Aman
          </div>
          <h2 className="mb-2 font-['Orbitron'] text-[23px] font-black uppercase tracking-[4px] text-[var(--text)]">Masuk Aplikasi</h2>
          <p className="text-sm text-[var(--text-dim)]">Mulai trial gratis 14 hari tanpa PIN. PIN hanya untuk akses VIP.</p>
        </div>

        {!showPinLogin ? (
          <div className="space-y-4">
            {error && <p className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-center text-[11px] font-bold uppercase tracking-[1px] text-red-300">{error}</p>}

            <button type="button" onClick={handleStartTrial} disabled={loading || !deviceId || !displayCode} className="primary-button w-full py-4 text-[12px] font-black uppercase tracking-[3px] disabled:opacity-50 active:scale-95">
              {loading ? "Mengaktifkan Trial..." : "Mulai Trial Gratis 14 Hari"}
            </button>

            <button type="button" onClick={() => { setError(""); setShowPinLogin(true); }} className="ghost-button w-full py-4 text-[11px] font-black uppercase tracking-[2px] active:scale-95">
              Saya Punya PIN VIP
            </button>

            <div className="space-y-2 text-center text-[10px] leading-5 text-[var(--text-dim)]">
              <p>Device Key: <span className="font-['JetBrains_Mono'] font-black text-[var(--gold)]">{displayCode}</span></p>
              <a href={activationUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--gold)] underline underline-offset-4">Belum punya PIN VIP? Hubungi Admin</a>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="ml-1 mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">Device Key</label>
                <input type="text" value={displayCode} readOnly className="soft-input h-14 w-full px-4 text-center font-['JetBrains_Mono'] text-[18px] font-black tracking-[5px]" />
              </div>

              <div>
                <label className="ml-1 mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">PIN VIP / MASTER</label>
                <input type="password" value={pin} autoFocus onChange={(e) => setPin(e.target.value)} placeholder="••••••" className="soft-input h-16 w-full px-4 text-center font-['JetBrains_Mono'] text-[24px] font-black tracking-[10px] placeholder:opacity-20" />
              </div>

              {error && <p className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-center text-[11px] font-bold uppercase tracking-[1px] text-red-300">{error}</p>}

              <button type="submit" disabled={loading || !pin} className="primary-button w-full py-4 text-[12px] font-black uppercase tracking-[4px] disabled:opacity-50 active:scale-95">
                {loading ? "Memverifikasi..." : "Buka Akses VIP"}
              </button>
            </form>

            <div className="mt-5 grid gap-3 text-center text-[11px] text-[var(--text-dim)]">
              <button type="button" onClick={() => { setError(""); setShowPinLogin(false); }} className="font-bold text-[var(--cyan)] underline underline-offset-4">Kembali ke Trial Gratis</button>
              <a href={activationUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--gold)] underline underline-offset-4">Hubungi Admin untuk Aktivasi VIP</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

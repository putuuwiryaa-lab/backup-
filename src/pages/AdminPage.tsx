import React, { useState, useEffect } from 'react';
import { Trash2, Lock, ChevronUp, ChevronDown, Settings, List, ShieldCheck, Plus, Save, Database } from "lucide-react";
import { supabase } from "../App";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'markets' | 'settings'>('markets');
  const [marketsList, setMarketsList] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [newMarketId, setNewMarketId] = useState('');
  const [historyData, setHistoryData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [runningText, setRunningText] = useState('SUPREME ENGINE v2.0 - SISTEM PREDIKSI PASARAN TERAKURAT');
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [appVersion, setAppVersion] = useState('v5.0');
  const [token, setToken] = useState('');

  const validResults = historyData.split(/[\s\n\r\t,]+/).filter((token) => /^\d{4}$/.test(token));
  const isDataEnough = validResults.length >= 17;

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase.from('markets').select('*').order('order', { ascending: true });
      if (error) throw error;
      const sorted = (data || []) as any[];
      setMarketsList(sorted);
      if (sorted.length > 0) {
        setSelectedMarket(sorted[0].id);
        setHistoryData(sorted[0].history_data || '');
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  const callAdmin = async (body: any) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    return await res.json();
  };

  useEffect(() => {
    const verifyToken = async () => {
      const t = localStorage.getItem("supreme_token");
      if (!t) { setIsAuthorized(false); setChecking(false); return; }
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t })
        });
        const json = await res.json();
        if (json.valid && json.role === "MASTER") {
          setIsAuthorized(true);
          setToken(t);
          fetchMarkets();
        } else setIsAuthorized(false);
      } catch {
        setIsAuthorized(false);
      }
      setChecking(false);
    };
    verifyToken();
  }, []);

  const loadData = (marketId: string) => {
    setSelectedMarket(marketId);
    const market = marketsList.find(m => m.id === marketId);
    setHistoryData(market?.history_data || '');
  };

  const handleSave = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    setMessage('Menyimpan ke Database...');
    try {
      const json = await callAdmin({ action: "save", marketId: selectedMarket, historyData });
      if (json.success) {
        setMarketsList(prev => prev.map(m => m.id === selectedMarket ? { ...m, history_data: historyData } : m));
        setMessage('Data ' + selectedMarket + ' berhasil disimpan');
        setTimeout(() => setMessage(''), 3000);
      } else setMessage("Error: " + json.error);
    } catch (e: any) {
      setMessage("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMarket) return;
    if (!window.confirm(`Yakin ingin MENGHAPUS pasaran ${selectedMarket}?`)) return;
    setLoading(true);
    try {
      const json = await callAdmin({ action: "delete", marketId: selectedMarket });
      if (json.success) {
        const updatedList = marketsList.filter(m => m.id !== selectedMarket);
        setMarketsList(updatedList);
        setSelectedMarket(updatedList[0]?.id || '');
        setHistoryData(updatedList[0]?.history_data || '');
        setMessage('Pasaran dihapus');
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleAddNewMarket = async () => {
    const upperId = newMarketId.trim().toUpperCase();
    if (!upperId) return;
    if (marketsList.find(m => m.id === upperId)) return;
    const newOrder = marketsList.length;
    try {
      const json = await callAdmin({ action: "add", marketId: upperId, order: newOrder });
      if (json.success) {
        const newList = [...marketsList, { id: upperId, history_data: "", order: newOrder }];
        setMarketsList(newList);
        setSelectedMarket(upperId);
        setHistoryData("");
        setNewMarketId('');
      }
    } catch (e) {}
  };

  const moveMarket = async (idx: number, dir: 'up' | 'down') => {
    const newList = [...marketsList];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setMarketsList(newList);
    try {
      await callAdmin({ action: "reorder", markets: [{ id: newList[idx].id, order: idx }, { id: newList[swapIdx].id, order: swapIdx }] });
    } catch (e) {}
  };

  if (checking) return <div className="flex min-h-[300px] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-4 border-t-[var(--gold)] border-white/10" /></div>;

  if (!isAuthorized) {
    return (
      <div className="premium-panel mx-auto mt-10 flex max-w-md flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-[var(--red)] ring-1 ring-red-400/25"><Lock className="h-8 w-8" /></div>
        <h2 className="mb-2 font-['Orbitron'] text-xl tracking-[2px] text-[var(--red)]">AKSES DITOLAK</h2>
        <p className="mb-6 text-sm text-[var(--text-dim)]">Silakan login dengan PIN Master untuk mengakses halaman ini.</p>
        <button onClick={() => window.location.href = "/"} className="ghost-button px-6 py-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--text)] active:scale-95">Kembali ke Login</button>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] pb-28">
      <div className="premium-panel relative mb-5 overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--gold-dim)] blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]"><ShieldCheck size={13} /> Master Panel</div>
            <h2 className="font-['Orbitron'] text-[24px] font-black uppercase tracking-[4px] text-[var(--text)]">Super Admin</h2>
            <p className="mt-2 text-xs text-[var(--text-dim)]">Kelola pasaran, history data, dan pengaturan aplikasi.</p>
          </div>
          <div className="rounded-full bg-emerald-400/12 px-3 py-2 ring-1 ring-emerald-300/25"><span className="text-[9px] font-black tracking-[1px] text-emerald-300">ONLINE</span></div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-[2rem] border border-white/10 bg-black/20 p-1">
        <button onClick={() => setActiveTab('markets')} className={`flex items-center justify-center gap-2 rounded-3xl py-3 text-[10px] font-black uppercase tracking-[1px] transition-all ${activeTab === 'markets' ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-dim)]'}`}><List size={14} /> Pasaran</button>
        <button onClick={() => setActiveTab('settings')} className={`flex items-center justify-center gap-2 rounded-3xl py-3 text-[10px] font-black uppercase tracking-[1px] transition-all ${activeTab === 'settings' ? 'bg-[var(--cyan)] text-black' : 'text-[var(--text-dim)]'}`}><Settings size={14} /> Settings</button>
      </div>

      {activeTab === 'markets' ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatBox label="Market" value={String(marketsList.length)} color="var(--gold)" />
            <StatBox label="Selected" value={selectedMarket || "-"} color="var(--cyan)" />
            <StatBox label="Result" value={String(validResults.length)} color={isDataEnough ? "var(--green)" : "var(--red)"} />
          </div>

          <div className="premium-panel mb-5 p-4">
            <div className="mb-3 flex items-center gap-2"><Database size={15} className="text-[var(--cyan)]" /><span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[2px] text-[var(--text)]">Daftar Pasaran</span></div>
            <div className="grid max-h-[310px] gap-2 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2">
              {marketsList.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-2 rounded-3xl border border-white/10 bg-black/20 p-2">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveMarket(idx, 'up')} disabled={idx === 0} className="rounded-xl p-1 text-[var(--text-dim)] transition hover:bg-white/10 disabled:opacity-20"><ChevronUp size={14} /></button>
                    <button onClick={() => moveMarket(idx, 'down')} disabled={idx === marketsList.length - 1} className="rounded-xl p-1 text-[var(--text-dim)] transition hover:bg-white/10 disabled:opacity-20"><ChevronDown size={14} /></button>
                  </div>
                  <button onClick={() => loadData(m.id)} className={`min-h-12 flex-1 rounded-2xl px-4 py-3 text-left text-[12px] font-black uppercase tracking-[1px] transition-all ${selectedMarket === m.id ? 'bg-[var(--cyan)] text-black shadow-md' : 'bg-white/5 text-[var(--text)] hover:bg-white/10'}`}>{m.id}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5 flex gap-2">
            <input type="text" value={newMarketId} onChange={e => setNewMarketId(e.target.value)} placeholder="KODE PASARAN BARU..." className="soft-input min-w-0 flex-1 p-4 text-[12px] font-black uppercase tracking-[2px] placeholder:text-[var(--text-dim)]" />
            <button onClick={handleAddNewMarket} className="flex items-center gap-2 rounded-3xl bg-[var(--cyan)] px-5 py-3 text-[10px] font-black uppercase tracking-[2px] text-black active:scale-95"><Plus size={15} /> Add</button>
          </div>

          <div className="premium-panel mb-5 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">Data History {selectedMarket}</label>
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px] ${isDataEnough ? 'bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/25' : 'bg-red-500/10 text-red-300 ring-1 ring-red-400/25'}`}>{isDataEnough ? 'Cukup' : 'Min 17'}</span>
            </div>
            <textarea value={historyData} onChange={(e) => setHistoryData(e.target.value)} className="soft-input h-[320px] w-full p-4 font-['JetBrains_Mono'] text-[12px] leading-6" placeholder={`Contoh:\n5832\n6553\n3585`} />
          </div>

          <div className="mb-4 flex gap-3">
            <button onClick={handleSave} disabled={loading || !selectedMarket} className="flex flex-1 items-center justify-center gap-2 rounded-3xl bg-[var(--green)] py-4 text-[11px] font-black uppercase tracking-[3px] text-black shadow-lg transition active:scale-95 disabled:opacity-50"><Save size={16} /> {loading ? 'Menyimpan...' : 'Save'}</button>
            <button onClick={handleDelete} disabled={loading || !selectedMarket} className="rounded-3xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-[var(--red)] transition active:scale-95 disabled:opacity-50"><Trash2 size={18} /></button>
          </div>
        </>
      ) : (
        <div className="premium-panel space-y-5 p-4">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">Running Text</label>
            <textarea value={runningText} onChange={e => setRunningText(e.target.value)} className="soft-input h-28 w-full p-4 text-[12px]" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">System Status</label>
              <select value={systemStatus} onChange={e => setSystemStatus(e.target.value)} className="soft-input w-full p-4 text-[12px]"><option value="ONLINE">ONLINE</option><option value="MAINTENANCE">MAINTENANCE</option></select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">Version</label>
              <input type="text" value={appVersion} onChange={e => setAppVersion(e.target.value)} className="soft-input w-full p-4 text-[12px]" />
            </div>
          </div>
          <button className="w-full cursor-not-allowed rounded-3xl bg-[var(--blue)] py-4 text-[11px] font-black uppercase tracking-[3px] text-black opacity-50">Update Global Settings</button>
        </div>
      )}

      {message && <div className="mt-5 rounded-3xl border border-[var(--gold)]/20 bg-[var(--gold-dim)] p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)] animate-pulse">{message}</div>}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="premium-card p-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-dim)]">{label}</p>
      <p className="mt-1 truncate font-['JetBrains_Mono'] text-[14px] font-black" style={{ color }}>{value}</p>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Trash2, Lock, ChevronUp, ChevronDown, Settings, List, ShieldCheck } from "lucide-react";
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
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
        } else {
          setIsAuthorized(false);
        }
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
        setMessage('Data ' + selectedMarket + ' BERHASIL DISIMPAN!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage("Error: " + json.error);
      }
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
        setMessage('PASARAN DIHAPUS');
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
      await callAdmin({
        action: "reorder",
        markets: [
          { id: newList[idx].id, order: idx },
          { id: newList[swapIdx].id, order: swapIdx }
        ]
      });
    } catch (e) {}
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-t-[var(--gold)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="premium-panel mx-auto mt-10 flex max-w-md flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-[var(--red)] ring-1 ring-red-100">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-['Orbitron'] text-xl text-[var(--red)] mb-2 tracking-[2px]">AKSES DITOLAK</h2>
        <p className="mb-6 text-sm text-[var(--text-dim)]">Silakan login dengan PIN Master untuk mengakses halaman ini.</p>
        <button onClick={() => window.location.href = "/"} className="rounded-2xl bg-[var(--text)] px-6 py-3 text-[11px] font-black uppercase tracking-[2px] text-white shadow-lg transition active:scale-95">KEMBALI KE LOGIN</button>
      </div>
    );
  }

  return (
    <div className="premium-panel min-h-[500px] p-4 animate-[fadeIn_0.5s_ease-out] sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--gold-dim)] px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">
            <ShieldCheck size={13} /> Master Panel
          </div>
          <h2 className="font-['Orbitron'] text-[18px] font-black uppercase tracking-[3px] text-[var(--text)]">SUPER ADMIN</h2>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Kelola pasaran dan pengaturan aplikasi.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-emerald-600 tracking-[1px]">ONLINE</span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-3xl bg-slate-100/70 p-1 ring-1 ring-slate-900/5">
        <button onClick={() => setActiveTab('markets')} className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-[1px] transition-all ${activeTab === 'markets' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
          <List size={14} /> Pasaran
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-[1px] transition-all ${activeTab === 'settings' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-dim)]'}`}>
          <Settings size={14} /> Settings
        </button>
      </div>

      {activeTab === 'markets' ? (
        <>
          <div className="mb-5 grid max-h-[310px] gap-2 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2">
            {marketsList.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-2 rounded-2xl border border-[var(--border2)] bg-white/76 p-2 shadow-sm">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveMarket(idx, 'up')} disabled={idx === 0} className="rounded-lg p-1 text-[var(--text-dim)] transition hover:bg-slate-100 disabled:opacity-20">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveMarket(idx, 'down')} disabled={idx === marketsList.length - 1} className="rounded-lg p-1 text-[var(--text-dim)] transition hover:bg-slate-100 disabled:opacity-20">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button onClick={() => loadData(m.id)} className={`min-h-12 flex-1 rounded-2xl px-4 py-3 text-left text-[12px] font-black tracking-[1px] transition-all ${selectedMarket === m.id ? 'bg-[var(--cyan)] text-white shadow-md' : 'bg-slate-50 text-[var(--text)] hover:bg-white'}`}>
                  {m.id}
                </button>
              </div>
            ))}
          </div>

          <div className="mb-5 flex gap-2">
            <input type="text" value={newMarketId} onChange={e => setNewMarketId(e.target.value)} placeholder="KODE PASARAN BARU..." className="min-w-0 flex-1 rounded-2xl border border-[var(--border2)] bg-white/85 p-4 text-[12px] font-black uppercase tracking-[2px] text-[var(--text)] placeholder:text-slate-400 focus:border-[var(--cyan)] focus:outline-none focus:ring-4 focus:ring-sky-100" />
            <button onClick={handleAddNewMarket} className="rounded-2xl bg-[var(--text)] px-5 py-3 text-[10px] font-black uppercase tracking-[2px] text-white shadow-lg transition active:scale-95">ADD</button>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">DATA HISTORY {selectedMarket}:</label>
            <textarea value={historyData} onChange={(e) => setHistoryData(e.target.value)} className="h-[300px] w-full rounded-3xl border border-[var(--border2)] bg-white/88 p-4 font-['JetBrains_Mono'] text-[12px] leading-6 text-[var(--text)] shadow-inner focus:border-[var(--cyan)] focus:outline-none focus:ring-4 focus:ring-sky-100" placeholder={`Contoh:\n5832\n6553\n3585`} />
          </div>

          <div className="mb-4 flex gap-3">
            <button onClick={handleSave} disabled={loading || !selectedMarket} className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-[11px] font-black tracking-[3px] text-white shadow-lg transition active:scale-95 disabled:opacity-50">
              {loading ? 'MENYIMPAN...' : 'SAVE TO SERVER'}
            </button>
            <button onClick={handleDelete} disabled={loading || !selectedMarket} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[var(--red)] transition active:scale-95 disabled:opacity-50">
              <Trash2 size={18} />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">RUNNING TEXT:</label>
            <textarea value={runningText} onChange={e => setRunningText(e.target.value)} className="h-28 w-full rounded-3xl border border-[var(--border2)] bg-white/88 p-4 text-[12px] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none focus:ring-4 focus:ring-sky-100" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">SYSTEM STATUS:</label>
              <select value={systemStatus} onChange={e => setSystemStatus(e.target.value)} className="w-full rounded-2xl border border-[var(--border2)] bg-white/88 p-4 text-[12px] text-[var(--text)] focus:outline-none">
                <option value="ONLINE">ONLINE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[2px] text-[var(--cyan)]">VERSION:</label>
              <input type="text" value={appVersion} onChange={e => setAppVersion(e.target.value)} className="w-full rounded-2xl border border-[var(--border2)] bg-white/88 p-4 text-[12px] text-[var(--text)] focus:outline-none" />
            </div>
          </div>
          <button className="w-full cursor-not-allowed rounded-2xl bg-gradient-to-r from-[var(--blue)] to-sky-500 py-4 text-[11px] font-black tracking-[3px] text-white opacity-60 shadow-lg">
            UPDATE GLOBAL SETTINGS
          </button>
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold-dim)] p-4 text-center text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)] animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
}

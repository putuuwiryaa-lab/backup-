import React, { useState, useEffect } from 'react';
import { Trash2, Lock, ChevronUp, ChevronDown, Settings, List } from "lucide-react";
import { db } from "../App";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

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

  const fetchMarkets = async () => {
    try {
      const snap = await getDocs(collection(db, "markets"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const sorted = data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setMarketsList(sorted);
      if (sorted.length > 0) {
        setSelectedMarket(sorted[0].id);
        setHistoryData(sorted[0].historyData || '');
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("supreme_token");
      if (!token) { setIsAuthorized(false); setChecking(false); return; }

      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const json = await res.json();
        if (json.valid && json.role === "MASTER") {
          setIsAuthorized(true);
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
    setHistoryData(market?.historyData || '');
  };

  const handleSave = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    setMessage('Menyimpan ke Database...');
    try {
      await setDoc(doc(db, "markets", selectedMarket), { historyData }, { merge: true });
      setMarketsList(prev => prev.map(m => m.id === selectedMarket ? { ...m, historyData } : m));
      setMessage('Data ' + selectedMarket + ' BERHASIL DISIMPAN!');
      setTimeout(() => setMessage(''), 3000);
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
      await deleteDoc(doc(db, "markets", selectedMarket));
      const updatedList = marketsList.filter(m => m.id !== selectedMarket);
      setMarketsList(updatedList);
      setSelectedMarket(updatedList[0]?.id || '');
      setHistoryData(updatedList[0]?.historyData || '');
      setMessage('PASARAN DIHAPUS');
    } catch (e) {}
    setLoading(false);
  };

  const handleAddNewMarket = async () => {
    const upperId = newMarketId.trim().toUpperCase();
    if (!upperId) return;
    if (marketsList.find(m => m.id === upperId)) return;
    const newOrder = marketsList.length;
    await setDoc(doc(db, "markets", upperId), { name: upperId, historyData: "", order: newOrder }, { merge: true });
    const newList = [...marketsList, { id: upperId, historyData: "", order: newOrder }];
    setMarketsList(newList);
    setSelectedMarket(upperId);
    setHistoryData("");
    setNewMarketId('');
  };

  const moveMarket = async (idx: number, dir: 'up' | 'down') => {
    const newList = [...marketsList];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setMarketsList(newList);
    await setDoc(doc(db, "markets", newList[idx].id), { order: idx }, { merge: true });
    await setDoc(doc(db, "markets", newList[swapIdx].id), { order: swapIdx }, { merge: true });
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-t-[var(--cyan)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-red-500/20 rounded-xl mt-12 mx-auto max-w-md text-center">
        <Lock className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl text-red-500 mb-2 font-['Orbitron'] tracking-[2px]">AKSES DITOLAK</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-[1px] mb-6">Silakan Login dengan PIN Master untuk mengakses halaman ini.</p>
        <button onClick={() => window.location.href = "/"} className="bg-white text-black px-6 py-2 rounded text-[10px] font-bold hover:bg-gray-200 transition-colors tracking-[1px]">KEMBALI KE LOGIN</button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-black/20 border border-white/5 rounded-2xl min-h-[500px] animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[14px] text-[var(--gold)] font-['Orbitron'] font-bold uppercase tracking-[4px]">SUPER ADMIN</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] font-bold text-green-500 tracking-[1px]">SERVER CONNECTED</span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-black/40 p-1 rounded-lg border border-white/5">
        <button
          onClick={() => setActiveTab('markets')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded transition-all tracking-[2px] ${activeTab === 'markets' ? 'bg-[var(--gold)] text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <List size={14} /> KELOLA PASARAN
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded transition-all tracking-[2px] ${activeTab === 'settings' ? 'bg-[var(--gold)] text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <Settings size={14} /> SYSTEM SETTINGS
        </button>
      </div>

      {activeTab === 'markets' ? (
        <>
          {/* Market List with Reorder */}
          <div className="flex flex-col gap-2 mb-6">
            {marketsList.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveMarket(idx, 'up')}
                    disabled={idx === 0}
                    className="text-white/30 hover:text-white disabled:opacity-10 p-0.5 transition-all"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveMarket(idx, 'down')}
                    disabled={idx === marketsList.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-10 p-0.5 transition-all"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button
                  onClick={() => loadData(m.id)}
                  className={`flex-1 px-4 py-2 text-[11px] font-bold border rounded transition-all tracking-[1px] text-left ${selectedMarket === m.id ? 'bg-[var(--cyan)] border-[var(--cyan)] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                >
                  {m.id}
                </button>
              </div>
            ))}
          </div>

          {/* Add New Market */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newMarketId}
              onChange={e => setNewMarketId(e.target.value)}
              placeholder="KODE PASARAN BARU..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] font-['JetBrains_Mono'] text-white focus:outline-none focus:border-[var(--cyan)]/40 uppercase tracking-[2px]"
            />
            <button onClick={handleAddNewMarket} className="bg-white text-black px-6 py-2 text-[10px] font-black rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-[2px]">
              ADD
            </button>
          </div>

          {/* History Data */}
          <div className="mb-6">
            <label className="text-[10px] text-[var(--cyan)] font-bold block mb-3 uppercase tracking-[2px] opacity-70">DATA HISTORY {selectedMarket}:</label>
            <textarea
              value={historyData}
              onChange={(e) => setHistoryData(e.target.value)}
              className="w-full h-[300px] bg-black/50 border border-white/10 rounded-2xl p-4 text-[12px] font-['JetBrains_Mono'] text-white focus:outline-none focus:border-[var(--cyan)]/40 leading-6 shadow-inner"
              placeholder={`Contoh:\n5832\n6553\n3585`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSave}
              disabled={loading || !selectedMarket}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-4 rounded-xl text-[11px] font-black disabled:opacity-50 tracking-[3px] shadow-lg active:scale-95 transition-all"
            >
              {loading ? 'MENYIMPAN...' : 'SAVE TO SERVER'}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || !selectedMarket}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-500 px-6 py-4 rounded-xl text-[10px] font-black disabled:opacity-50 border border-red-500/20 tracking-[1px] transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase opacity-70">RUNNING TEXT:</label>
            <textarea
              value={runningText}
              onChange={e => setRunningText(e.target.value)}
              className="w-full h-24 bg-black/50 border border-white/10 rounded-2xl p-4 text-[11px] text-white focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase opacity-70">SYSTEM STATUS:</label>
              <select value={systemStatus} onChange={e => setSystemStatus(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] text-white">
                <option value="ONLINE">ONLINE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase opacity-70">VERSION:</label>
              <input type="text" value={appVersion} onChange={e => setAppVersion(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] text-white" />
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl text-[11px] font-black tracking-[3px] shadow-lg opacity-50 cursor-not-allowed">
            UPDATE GLOBAL SETTINGS
          </button>
        </div>
      )}

      {message && (
        <div className="mt-6 p-4 bg-black/60 text-[10px] font-black text-center border border-white/10 text-[var(--gold)] rounded-xl uppercase tracking-[2px] animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
                         }

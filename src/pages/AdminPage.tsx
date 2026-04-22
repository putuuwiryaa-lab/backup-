import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { Database, Cpu, Trash2, Unlock, Lock, ArrowLeft, ChevronUp, ChevronDown, Settings, List } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'settings'>('markets');
  const [marketsList, setMarketsList] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [newMarketId, setNewMarketId] = useState('');
  const [historyData, setHistoryData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Settings State
  const [runningText, setRunningText] = useState('');
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [appVersion, setAppVersion] = useState('v5.0');

  // Load available markets from server on mount
  const fetchMarkets = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'markets'));
      const dynamicMarkets: any[] = [];
      querySnapshot.forEach((docSnap) => {
        dynamicMarkets.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      const sorted = dynamicMarkets.sort((a, b) => {
          const orderA = a.order ?? 999;
          const orderB = b.order ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
      });

      if (sorted.length > 0) {
         setMarketsList(sorted);
         return sorted;
      }
    } catch(e) {
        console.error("Fetch error:", e);
    }
    return [];
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        const data = snap.data();
        setRunningText(data.runningText || '');
        setSystemStatus(data.systemStatus || 'ONLINE');
        setAppVersion(data.appVersion || 'v5.0');
      }
    } catch(e) {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      
      if (u) {
          if (u.email !== 'putuuwiryaa@gmail.com') {
              signOut(auth);
              alert("AKSES DITOLAK: Email Anda Tidak Memiliki Hak Akses Admin.");
              setUser(null);
              return;
          }
          setUser(u);
          const dynamicMarkets = await fetchMarkets();
          if (dynamicMarkets.length > 0) {
             loadData(dynamicMarkets[0].id, dynamicMarkets);
          }
          fetchSettings();
      } else {
          setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      alert("Login Error: " + e.message);
    }
  };

  const loadData = async (marketId: string, currentMarkets = marketsList) => {
    setSelectedMarket(marketId);

    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'markets', marketId));
      if (snap.exists()) {
        setHistoryData(snap.data().historyData || '');
      } else {
        setHistoryData('');
      }
    } catch (e: any) {
      setMessage("Gagal muat: " + e.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    setMessage('Menyimpan...');
    try {
      const currentMarket = marketsList.find(m => m.id === selectedMarket);
      
      // Hitung urutan berikutnya jika belum ada (untuk pasaran baru)
      let finalOrder = currentMarket?.order;
      if (finalOrder === undefined || finalOrder === null) {
          const orders = marketsList.map(m => m.order).filter(o => typeof o === 'number');
          finalOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      }

      await setDoc(doc(db, 'markets', selectedMarket), {
        name: selectedMarket,
        historyData,
        updatedAt: serverTimestamp(),
        order: finalOrder
      }, { merge: true });
      
      setMarketsList(prev => {
          const exists = prev.find(p => p.id === selectedMarket);
          let newList;
          if (exists) {
              newList = prev.map(p => p.id === selectedMarket ? { ...p, order: finalOrder, id: selectedMarket } : p);
          } else {
              newList = [...prev, { id: selectedMarket, name: selectedMarket, order: finalOrder }];
          }
          return newList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      });

      setMessage('Data ' + selectedMarket + ' berhasil disimpan!');
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage('Menyimpan pengaturan...');
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        runningText,
        systemStatus,
        appVersion,
        updatedAt: serverTimestamp()
      });
      setMessage('Pengaturan sistem berhasil diperbarui!');
    } catch (e: any) {
      setMessage("Error Simpan: " + e.message);
    }
    setLoading(false);
  };

  const moveMarket = async (direction: 'up' | 'down') => {
      const index = marketsList.findIndex(m => m.id === selectedMarket);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === marketsList.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const newList = [...marketsList];
      const current = newList[index];
      const target = newList[targetIndex];

      const tempOrder = current.order || 0;
      current.order = target.order || 0;
      target.order = tempOrder;

      if (current.order === target.order) {
          if (direction === 'up') {
              current.order = target.order - 1;
          } else {
              current.order = target.order + 1;
          }
      }

      setLoading(true);
      setMessage('Mengubah urutan...');
      try {
          const batch = writeBatch(db);
          batch.update(doc(db, 'markets', current.id), { order: current.order });
          batch.update(doc(db, 'markets', target.id), { order: target.order });
          await batch.commit();
          
          setMarketsList(newList.sort((a,b) => (a.order || 0) - (b.order || 0)));
          setMessage('Urutan berhasil diperbarui!');
      } catch (e: any) {
          setMessage("Gagal ubah urutan: " + e.message);
      }
      setLoading(false);
  };

  const handleDelete = async () => {
      if (!selectedMarket) return;
      if (!window.confirm(`Yakin ingin MENGHAPUS pasaran ${selectedMarket}? Data 100% hilang!`)) return;

      setLoading(true);
      setMessage(`Menghapus ${selectedMarket}...`);
      try {
        await deleteDoc(doc(db, 'markets', selectedMarket));
        const updatedMarkets = marketsList.filter(m => m.id !== selectedMarket);
        setMarketsList(updatedMarkets);
        if (updatedMarkets.length > 0) {
            loadData(updatedMarkets[0].id, updatedMarkets);
        } else {
            setSelectedMarket('');
            setHistoryData('');
        }
        setMessage(`Pasaran berhasil dihapus!`);
      } catch (e: any) {
        setMessage("Error hapus: " + e.message);
      }
      setLoading(false);
  };
  
  const handleAddNewMarket = () => {
    const upperId = newMarketId.trim().toUpperCase();
    if (!upperId) return;
    if (!marketsList.find(m => m.id === upperId)) {
      const orders = marketsList.map(m => m.order).filter(o => typeof o === 'number');
      const nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      
      setMarketsList(prev => [...prev, { id: upperId, name: upperId, order: nextOrder }].sort((a,b) => (a.order ?? 999) - (b.order ?? 999)));
    }
    loadData(upperId);
    setNewMarketId('');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl mt-12 mx-auto max-w-md">
        <h2 className="text-xl text-[var(--gold)] mb-4 font-['Space_Grotesk']">SECURITY GATEWAY</h2>
        <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors">
          LOGIN ADMIN
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-[var(--gold)] font-['Space_Grotesk'] uppercase tracking-[3px]">SUPER ADMIN</h2>
        <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-red-400 p-[6px_10px] border border-red-500 rounded uppercase tracking-[1px] hover:bg-red-500/10 transition-all">LOGOUT</button>
      </div>

      <div className="flex gap-1 mb-6 bg-black/40 p-1 rounded-lg border border-[var(--border2)]">
         <button 
           onClick={() => setActiveTab('markets')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded transition-all tracking-[2px] ${activeTab === 'markets' ? 'bg-[var(--gold)] text-black' : 'text-gray-400 hover:text-white'}`}
         >
           <List size={14} /> PASARAN
         </button>
         <button 
           onClick={() => setActiveTab('settings')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded transition-all tracking-[2px] ${activeTab === 'settings' ? 'bg-[var(--gold)] text-black' : 'text-gray-400 hover:text-white'}`}
         >
           <Settings size={14} /> SETTING SISTEM
         </button>
      </div>
      
      {activeTab === 'markets' ? (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {marketsList.map(m => (
              <div key={m.id} className="flex items-center gap-1">
                 <button 
                    onClick={() => loadData(m.id)}
                    className={`px-4 py-2 text-[11px] font-bold border rounded transition-all tracking-[1px] ${selectedMarket === m.id ? 'bg-[var(--cyan)] border-[var(--cyan)] text-black' : 'border-[var(--border2)] text-gray-400 hover:border-gray-500'}`}
                 >
                    {m.id}
                 </button>
                 {selectedMarket === m.id && (
                     <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveMarket('up')} className="p-0.5 hover:text-[var(--gold)] text-gray-500 transition-colors"><ChevronUp size={12}/></button>
                        <button onClick={() => moveMarket('down')} className="p-0.5 hover:text-[var(--gold)] text-gray-500 transition-colors"><ChevronDown size={12}/></button>
                     </div>
                 )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newMarketId}
              onChange={e => setNewMarketId(e.target.value)}
              placeholder="NAMA PASARAN BARU"
              className="flex-1 bg-black/50 border border-[var(--border2)] rounded p-2 text-[11px] font-['Roboto_Mono'] text-white focus:outline-none focus:border-[var(--cyan)] uppercase tracking-[1px]"
            />
            <button onClick={handleAddNewMarket} className="bg-[var(--gold)] text-black px-4 py-2 text-[11px] font-bold rounded hover:bg-yellow-400 transition-colors uppercase tracking-[1px]">
              TAMBAH
            </button>
          </div>

          <div className="mb-6">
            <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 uppercase tracking-[2px]">UPDATE DATA {selectedMarket}:</label>
            <textarea
              value={historyData}
              onChange={(e) => setHistoryData(e.target.value)}
              className="w-full h-[250px] bg-black/50 border border-[var(--border2)] rounded p-3 text-[11px] font-['Roboto_Mono'] text-white focus:outline-none focus:border-[var(--cyan)] leading-5"
              placeholder={`Format: 1234 (per baris)\n\nURUTAN: TERBARU DI PALING ATAS\n\nContoh:\n5832\n6553\n3585\n...dst`}
            />
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSave}
              disabled={loading || !selectedMarket}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-3 rounded text-[11px] font-bold disabled:opacity-50 tracking-[3px] shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
            >
              SIMPAN DATA
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || !selectedMarket}
              className="bg-red-800/80 hover:bg-red-700 text-white px-4 py-3 rounded text-[11px] font-bold disabled:opacity-50 border border-red-500 tracking-[1px]"
            >
              HAPUS
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
           <div>
              <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase">RUNNING TEXT (PENGUMUMAN):</label>
              <textarea 
                value={runningText}
                onChange={e => setRunningText(e.target.value)}
                className="w-full h-24 bg-black/50 border border-[var(--border2)] rounded p-3 text-[11px] text-white focus:outline-none focus:border-[var(--cyan)]"
                placeholder="Contoh: Selamat Datang di Analisa Angka Premium..."
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase">SYSTEM STATUS:</label>
                 <select 
                   value={systemStatus} 
                   onChange={e => setSystemStatus(e.target.value)}
                   className="w-full bg-black/50 border border-[var(--border2)] rounded p-2 text-[11px] text-white outline-none focus:border-[var(--gold)] appearance-none cursor-pointer"
                 >
                    <option value="ONLINE">ONLINE (NORMAL)</option>
                    <option value="MAINTENANCE">MAINTENANCE (OFFLINE)</option>
                 </select>
              </div>
              <div>
                 <label className="text-[10px] text-[var(--cyan)] font-bold block mb-2 tracking-[2px] uppercase">VERSION:</label>
                 <input 
                   type="text" 
                   value={appVersion}
                   onChange={e => setAppVersion(e.target.value)}
                   className="w-full bg-black/50 border border-[var(--border2)] rounded p-2 text-[11px] text-white outline-none focus:border-[var(--cyan)]"
                 />
              </div>
           </div>

           <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded text-[11px] font-bold shadow-[0_4px_15px_rgba(37,99,235,0.3)] disabled:opacity-50 tracking-[3px]"
            >
              {loading ? 'MENYIMPAN...' : 'UPDATE SETTING SISTEM'}
           </button>
        </div>
      )}

      {message && <div className="mt-6 p-3 bg-black/40 text-[10px] font-bold text-center border border-gray-700 text-yellow-400 rounded transition-all uppercase tracking-[2px] animate-pulse">{message}</div>}
    </div>
  );
}

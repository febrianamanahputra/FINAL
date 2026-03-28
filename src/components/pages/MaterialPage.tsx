import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { Plus, Send, Search, Package, RefreshCw, Trash2, X, Edit3 } from 'lucide-react';
import { capitalizeWords } from '../../utils';
import Overlay from '../Overlay';

interface MaterialPageProps {
  state: AppState;
  locData: LocData;
  updateLocData: (locId: string, updater: (prev: LocData) => LocData) => void;
  onBack: () => void;
}

type TabType = 'request' | 'tracking' | 'stock' | 'shop';

export default function MaterialPage({ state, locData, updateLocData, onBack }: MaterialPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('request');

  const locName = state.locations.find(l => l.id === state.activeLoc)?.name || '—';

  return (
    <div className="flex flex-col h-full bg-white">
      <PageHeader
        title="Material"
        subtitle={locName}
        onBack={onBack}
      />
      
      <div className="flex gap-1 px-5 pt-2 border-b border-black/5 shrink-0 overflow-x-auto hide-scrollbar">
        {[
          { id: 'request', label: 'Request' },
          { id: 'tracking', label: 'Tracking' },
          { id: 'stock', label: 'Stok' },
          { id: 'shop', label: 'Shop' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary text-[#1a1a1a]' 
                : 'border-transparent text-black/35 hover:text-black/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        {activeTab === 'request' && <RequestTab locData={locData} locName={locName} />}
        {activeTab === 'tracking' && <TrackingTab locData={locData} />}
        {activeTab === 'stock' && <StockTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} locName={locName} />}
        {activeTab === 'shop' && <ShopTab locName={locName} />}
      </div>
    </div>
  );
}

function RequestTab({ locData, locName }: { locData: LocData, locName: string }) {
  const [tglReq, setTglReq] = useState(new Date().toISOString().split('T')[0]);
  const [tglPerlu, setTglPerlu] = useState('');
  const [items, setItems] = useState([{ id: 'mi_1', nama: '', jumlah: '', satuan: '' }]);

  const handleAddItem = () => {
    setItems([...items, { id: `mi_${Date.now()}`, nama: '', jumlah: '', satuan: '' }]);
  };

  const handleUpdateItem = (id: string, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: field === 'nama' ? capitalizeWords(value) : value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSend = () => {
    const filled = items.filter(i => i.nama.trim());
    if (!filled.length) return alert('Isi minimal satu item material.');
    if (!tglPerlu) return alert('Isi Tanggal Diperlukan.');

    const fmtDate = (d: string) => { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
    const itemLines = filled.map(m => `- ${m.nama}: ${m.jumlah} ${m.satuan}`).join('\n');
    const waText = `*Request Material*\n📍 ${locName}\n📅 Tgl Request: ${fmtDate(tglReq)}\n⏳ Diperlukan: ${fmtDate(tglPerlu)}\n\n${itemLines}\n\nMohon Segera Diproses.`;

    window.location.href = `whatsapp://send?text=${encodeURIComponent(waText)}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] text-black/35 uppercase tracking-[1.2px] mb-1 block">Tanggal Request</label>
          <input type="date" value={tglReq} onChange={e => setTglReq(e.target.value)} className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
        </div>
        <div className="flex-1">
          <label className="text-[9px] text-black/35 uppercase tracking-[1.2px] mb-1 block">Tanggal Diperlukan</label>
          <input type="date" value={tglPerlu} onChange={e => setTglPerlu(e.target.value)} className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 mb-2">
        <div className="text-[9px] text-black/35 uppercase tracking-[1.5px]">Item Material</div>
        <button onClick={handleAddItem} className="bg-primary text-primary-text font-medium text-[10px] px-2.5 py-1 rounded flex items-center gap-1">
          <Plus size={12} /> Item
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white border border-black/10 rounded-[10px] overflow-hidden flex flex-col">
            <div className="flex items-center border-b border-black/5">
              <input
                id={`req-nama-${idx}`}
                value={item.nama}
                onChange={e => handleUpdateItem(item.id, 'nama', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`req-jumlah-${idx}`)?.focus(); } }}
                placeholder="Nama Barang..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1a1a1a] px-3 py-2.5 placeholder:text-black/20"
              />
              <button onClick={() => handleRemoveItem(item.id)} className="px-3.5 text-black/25 hover:text-red-600 text-lg leading-none">×</button>
            </div>
            <div className="flex items-center">
              <input
                id={`req-jumlah-${idx}`}
                value={item.jumlah}
                onChange={e => handleUpdateItem(item.id, 'jumlah', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`req-satuan-${idx}`)?.focus(); } }}
                placeholder="Jumlah"
                className="flex-1 bg-transparent border-none border-r border-black/5 outline-none text-xs text-[#1a1a1a] px-2.5 py-2 placeholder:text-black/20"
              />
              <input
                id={`req-satuan-${idx}`}
                value={item.satuan}
                onChange={e => handleUpdateItem(item.id, 'satuan', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (idx === items.length - 1) {
                      handleAddItem();
                      setTimeout(() => document.getElementById(`req-nama-${idx + 1}`)?.focus(), 50);
                    } else {
                      document.getElementById(`req-nama-${idx + 1}`)?.focus();
                    }
                  }
                }}
                placeholder="Satuan (pcs, kg...)"
                className="flex-1 bg-transparent border-none outline-none text-xs text-[#1a1a1a] px-2.5 py-2 placeholder:text-black/20"
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSend} className="w-full bg-[#25D366] text-white font-medium text-[13px] p-3 rounded-lg flex items-center justify-center gap-2 mt-3">
        <Send size={16} /> Upload ke WA
      </button>
    </div>
  );
}

function TrackingTab({ locData }: { locData: LocData }) {
  const pending = locData.pendingRequests || [];
  return (
    <div className="flex flex-col gap-3">
      <button className="w-full bg-black/5 border border-black/10 p-2 text-[11px] rounded-lg text-[#1a1a1a] flex items-center justify-center gap-1.5">
        <RefreshCw size={12} /> Refresh Tracking
      </button>
      {pending.length === 0 ? (
        <div className="text-[11px] text-black/25 text-center py-6">Belum ada request pending.</div>
      ) : (
        <div className="text-[11px] text-black/50 text-center">Tracking data will appear here.</div>
      )}
    </div>
  );
}

function StockTab({ locData, updateLocData, locId, locName }: { locData: LocData, updateLocData: any, locId: string | null, locName: string }) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [nama, setNama] = useState('');
  const [stok, setStok] = useState('');
  const [satuan, setSatuan] = useState('');

  const stockMap = locData.stock || {};
  const stockList = Object.entries(stockMap).map(([id, data]) => ({ id, ...data }));
  const filtered = stockList.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));

  const handleOpenAdd = () => {
    setEditId(null);
    setNama('');
    setStok('');
    setSatuan('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditId(item.id);
    setNama(item.nama);
    setStok(item.stok.toString());
    setSatuan(item.satuan);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!nama.trim()) return alert('Nama material tidak boleh kosong!');
    if (locId) {
      updateLocData(locId, (prev: any) => {
        const newStock = { ...(prev.stock || {}) };
        const id = editId || `stk_${Date.now()}`;
        newStock[id] = {
          nama: capitalizeWords(nama.trim()),
          stok: parseFloat(stok) || 0,
          satuan: satuan.trim()
        };
        return { ...prev, stock: newStock };
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (editId && locId) {
      if (confirm('Yakin ingin menghapus material ini dari stok?')) {
        updateLocData(locId, (prev: any) => {
          const newStock = { ...(prev.stock || {}) };
          delete newStock[editId];
          return { ...prev, stock: newStock };
        });
        setIsFormOpen(false);
      }
    }
  };

  const handleSendWA = () => {
    if (stockList.length === 0) return alert('Stok kosong!');
    const lines = stockList
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map(s => `- ${s.nama}: ${s.stok} ${s.satuan}${s.stok === 0 ? ' (HABIS)' : ''}`)
      .join('\n');
    
    const text = `*LAPORAN STOK GUDANG*\n📍 ${locName}\n📅 ${new Date().toLocaleDateString('id-ID')}\n\n${lines}`;
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari material..."
            className="w-full bg-white border border-black/10 rounded-lg pl-9 pr-3 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary"
          />
        </div>
        <button onClick={handleOpenAdd} className="bg-primary text-primary-text font-medium text-[11px] px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1">
          <Plus size={14} /> Tambah
        </button>
      </div>
      
      <button onClick={handleSendWA} className="w-full bg-[#25D366] text-white font-medium text-xs p-2.5 rounded-lg flex items-center justify-center gap-1.5 mb-2 shadow-sm">
        <Send size={14} /> Laporan Stok ke WA
      </button>
      
      <div className="flex flex-col bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-black/25 text-center py-10 flex flex-col items-center gap-2">
            <Package size={24} className="opacity-10" />
            {search ? 'Material tidak ditemukan.' : 'Stok gudang kosong.'}
          </div>
        ) : (
          filtered.map((s, i) => (
            <div 
              key={s.id} 
              onClick={() => handleOpenEdit(s)}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors ${i < filtered.length - 1 ? 'border-b border-black/5' : ''}`}
            >
              <div className="flex-1">
                <div className="text-xs text-[#1a1a1a] font-bold">{s.nama}</div>
                <div className="text-[10px] text-black/40 mt-0.5">ID: {s.id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`font-mono text-sm font-bold ${s.stok === 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  {s.stok}
                </div>
                <div className="text-[10px] text-black/40 min-w-[32px]">{s.satuan}</div>
                {s.stok === 0 && (
                  <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 font-bold rounded tracking-wide">HABIS</span>
                )}
                <Edit3 size={12} className="text-black/10 ml-1" />
              </div>
            </div>
          ))
        )}
      </div>

      <Overlay isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editId ? "Edit Stok" : "Tambah Stok"}>
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-black/40 uppercase tracking-[1.5px] font-bold">Nama Material</label>
            <input
              autoFocus
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="Semen, Pasir, Besi D12..."
              className="bg-black/5 border border-black/10 rounded-xl px-3.5 py-3 text-sm text-[#1a1a1a] outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px] font-bold">Jumlah Stok</label>
              <input
                type="number"
                value={stok}
                onChange={e => setStok(e.target.value)}
                placeholder="0"
                className="bg-black/5 border border-black/10 rounded-xl px-3.5 py-3 text-sm text-[#1a1a1a] outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px] font-bold">Satuan</label>
              <input
                value={satuan}
                onChange={e => setSatuan(e.target.value)}
                placeholder="zak, m3, btg..."
                className="bg-black/5 border border-black/10 rounded-xl px-3.5 py-3 text-sm text-[#1a1a1a] outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {editId && (
              <button 
                onClick={handleDelete}
                className="flex-1 bg-red-50 text-red-600 font-bold text-xs p-3.5 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Hapus
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-[2] bg-primary text-primary-text font-bold text-xs p-3.5 rounded-xl shadow-lg shadow-primary/20"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}

function ShopTab({ locName }: { locName: string }) {
  const [items, setItems] = useState([{ id: 'sh_1', nama: '', jumlah: '' }, { id: 'sh_2', nama: '', jumlah: '' }]);

  const handleSend = () => {
    const filled = items.filter(i => i.nama.trim());
    if (!filled.length) return alert('Isi dulu nama barang!');
    const lines = filled.map((x, i) => `${i + 1}. ${x.nama.trim()}${x.jumlah ? ' — ' + x.jumlah : ''}`).join('\n');
    const text = `*Daftar Belanja* — ${locName}\n\n${lines}`;
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  const handleAddBaris = () => {
    setItems([...items, { id: `sh_${Date.now()}`, nama: '', jumlah: '' }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[9px] text-black/35 uppercase tracking-[1.5px] mb-1">Daftar Belanja</div>
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-0 mb-1">
          <div className="w-[22px] shrink-0 text-[11px] text-black/30 py-2.5 pr-1 flex items-center">{idx + 1}.</div>
          <input
            id={`shop-nama-${idx}`}
            value={item.nama}
            onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, nama: capitalizeWords(e.target.value) } : i))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`shop-jumlah-${idx}`)?.focus(); } }}
            placeholder="Nama barang..."
            className="flex-[1.6] bg-black/5 border border-black/10 border-r-0 rounded-l-lg px-2.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary"
          />
          <input
            id={`shop-jumlah-${idx}`}
            value={item.jumlah}
            onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, jumlah: e.target.value } : i))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (idx === items.length - 1) {
                  handleAddBaris();
                  setTimeout(() => document.getElementById(`shop-nama-${idx + 1}`)?.focus(), 50);
                } else {
                  document.getElementById(`shop-nama-${idx + 1}`)?.focus();
                }
              }
            }}
            placeholder="Jml / Satuan"
            className="flex-1 bg-black/5 border border-black/10 rounded-r-lg px-2.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary"
          />
        </div>
      ))}
      <button onClick={handleAddBaris} className="w-full bg-transparent border-[1.5px] border-dashed border-primary/50 rounded-lg p-2.5 text-[11px] text-[#4a8800] mt-1">
        + Baris
      </button>
      <button onClick={handleSend} className="w-full bg-[#25D366] text-white font-medium text-[13px] p-3 rounded-lg flex items-center justify-center gap-2 mt-3">
        <Send size={16} /> Kirim ke WA
      </button>
    </div>
  );
}

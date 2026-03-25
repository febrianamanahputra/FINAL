import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { Plus, Send, Search, Package, RefreshCw } from 'lucide-react';
import { capitalizeWords } from '../../utils';

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
        {activeTab === 'stock' && <StockTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} />}
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

function StockTab({ locData, updateLocData, locId }: { locData: LocData, updateLocData: any, locId: string | null }) {
  const [search, setSearch] = useState('');
  const stock = Object.values(locData.stock || {});
  const filtered = stock.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari material..."
          className="flex-1 bg-white border border-black/10 rounded-lg px-2.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary"
        />
        <button className="bg-primary text-primary-text font-medium text-[11px] px-2.5 py-1.5 rounded-md whitespace-nowrap">
          + Tambah
        </button>
      </div>
      <button className="w-full bg-[#25D366] text-white font-medium text-xs p-2.5 rounded-lg flex items-center justify-center gap-1.5 mb-2">
        <Send size={14} /> Laporan Stok ke WA
      </button>
      
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-black/25 text-center py-6">Stok gudang kosong.</div>
        ) : (
          filtered.map((s, i) => (
            <div key={i} className="flex items-center py-2.5 border-b border-black/5 cursor-pointer">
              <div className="flex-1 text-xs text-[#1a1a1a] font-medium">{s.nama}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="font-mono text-xs text-primary-text font-semibold">{s.stok}</div>
                <div className="text-[10px] text-black/40 min-w-[28px]">{s.satuan}</div>
                {s.stok === 0 && <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 font-medium tracking-wide">HABIS</span>}
              </div>
            </div>
          ))
        )}
      </div>
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

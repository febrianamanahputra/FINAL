import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { Plus, Send, Search, Package, RefreshCw, Trash2, X, Edit3, Copy, FileSpreadsheet } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-bg">
      <PageHeader
        title="Material"
        subtitle={locName}
        onBack={onBack}
        rightContent={
          <a 
            href="https://docs.google.com/spreadsheets/d/1dUAgJCx5NIDVABMPBXbHWGs6NwE1dgKI/edit?usp=drivesdk&ouid=100307049725343762177&rtpof=true&sd=true" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 active:bg-green-500/20 transition-colors"
            title="Buka Spreadsheet"
          >
            <FileSpreadsheet size={18} />
          </a>
        }
      />
      
      <div className="flex gap-1 px-5 pt-2 border-b border-border shrink-0 overflow-x-auto hide-scrollbar">
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
                ? 'border-primary text-text' 
                : 'border-transparent text-text/35 hover:text-text/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        {activeTab === 'request' && <RequestTab locData={locData} locName={locName} updateLocData={updateLocData} locId={state.activeLoc} />}
        {activeTab === 'tracking' && <TrackingTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} />}
        {activeTab === 'stock' && <StockTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} locName={locName} />}
        {activeTab === 'shop' && <ShopTab locName={locName} />}
      </div>
    </div>
  );
}

function RequestTab({ locData, locName, updateLocData, locId }: { locData: LocData, locName: string, updateLocData: any, locId: string | null }) {
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

    if (locId) {
      const newRequest = {
        id: `req_${Date.now()}`,
        tglReq,
        tglPerlu,
        items: filled,
        status: 'Menunggu'
      };
      updateLocData(locId, (prev: any) => ({
        ...prev,
        pendingRequests: [newRequest, ...(prev.pendingRequests || [])]
      }));
    }

    const fmtDate = (d: string) => { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
    const itemLines = filled.map(m => `- ${m.nama}: ${m.jumlah} ${m.satuan}`).join('\n');
    const waText = `*Request Material*\n📍 ${locName}\n📅 Tgl Request: ${fmtDate(tglReq)}\n⏳ Diperlukan: ${fmtDate(tglPerlu)}\n\n${itemLines}\n\nMohon Segera Diproses.`;

    window.location.href = `whatsapp://send?text=${encodeURIComponent(waText)}`;
    
    // Reset form
    setItems([{ id: `mi_${Date.now()}`, nama: '', jumlah: '', satuan: '' }]);
    setTglPerlu('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] text-text/35 uppercase tracking-[1.2px] mb-1 block">Tanggal Request</label>
          <input type="date" value={tglReq} onChange={e => setTglReq(e.target.value)} className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text outline-none focus:border-primary" />
        </div>
        <div className="flex-1">
          <label className="text-[9px] text-text/35 uppercase tracking-[1.2px] mb-1 block">Tanggal Diperlukan</label>
          <input type="date" value={tglPerlu} onChange={e => setTglPerlu(e.target.value)} className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text outline-none focus:border-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 mb-2">
        <div className="text-[9px] text-text/35 uppercase tracking-[1.5px]">Item Material</div>
        <button onClick={handleAddItem} className="bg-primary text-primary-text font-medium text-[10px] px-2.5 py-1 rounded flex items-center gap-1">
          <Plus size={12} /> Item
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-card border border-border rounded-[10px] overflow-hidden flex flex-col">
            <div className="flex items-center border-b border-border">
              <input
                id={`req-nama-${idx}`}
                value={item.nama}
                onChange={e => handleUpdateItem(item.id, 'nama', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`req-jumlah-${idx}`)?.focus(); } }}
                placeholder="Nama Barang..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text px-3 py-2.5 placeholder:text-text/20"
              />
              <button onClick={() => handleRemoveItem(item.id)} className="px-3.5 text-text/25 hover:text-red-600 text-lg leading-none">×</button>
            </div>
            <div className="flex items-center">
              <input
                id={`req-jumlah-${idx}`}
                value={item.jumlah}
                onChange={e => handleUpdateItem(item.id, 'jumlah', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`req-satuan-${idx}`)?.focus(); } }}
                placeholder="Jumlah"
                className="flex-1 bg-transparent border-none border-r border-border outline-none text-xs text-text px-2.5 py-2 placeholder:text-text/20"
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
                className="flex-1 bg-transparent border-none outline-none text-xs text-text px-2.5 py-2 placeholder:text-text/20"
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

function TrackingTab({ locData, updateLocData, locId }: { locData: LocData, updateLocData: any, locId: string | null }) {
  const pending = locData.pendingRequests || [];
  const [isDoneOpen, setIsDoneOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [doneForm, setDoneForm] = useState({
    penerima: '',
    confirm: '',
    statusSm: '',
    picSupply: ''
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!locId) return;
    updateLocData(locId, (prev: any) => ({
      ...prev,
      pendingRequests: (prev.pendingRequests || []).map((req: any) => 
        req.id === id ? { ...req, status: newStatus } : req
      )
    }));
  };

  const handleDelete = (id: string) => {
    if (!locId) return;
    if (confirm('Yakin ingin menghapus request ini?')) {
      updateLocData(locId, (prev: any) => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || []).filter((req: any) => req.id !== id)
      }));
    }
  };

  const handleOpenDone = (req: any) => {
    setSelectedReq(req);
    setDoneForm({
      penerima: req.penerima || '',
      confirm: req.confirm || '',
      statusSm: req.statusSm || '',
      picSupply: req.picSupply || ''
    });
    setIsDoneOpen(true);
  };

  const handleSaveDone = () => {
    if (!locId || !selectedReq) return;
    updateLocData(locId, (prev: any) => {
      const newStock = { ...(prev.stock || {}) };
      
      if (selectedReq.items && Array.isArray(selectedReq.items)) {
        selectedReq.items.forEach((item: any) => {
          if (!item.nama) return;
          
          const itemName = capitalizeWords(item.nama.trim());
          const itemQty = parseFloat(item.jumlah) || 0;
          
          const existingKey = Object.keys(newStock).find(
            key => newStock[key].nama.toLowerCase() === itemName.toLowerCase()
          );
          
          if (existingKey) {
            newStock[existingKey].stok += itemQty;
          } else {
            newStock[`stk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`] = {
              nama: itemName,
              stok: itemQty,
              satuan: item.satuan || ''
            };
          }
        });
      }

      return {
        ...prev,
        stock: newStock,
        pendingRequests: (prev.pendingRequests || []).map((r: any) => 
          r.id === selectedReq.id ? { 
            ...r, 
            status: 'Selesai',
            penerima: doneForm.penerima,
            confirm: doneForm.confirm,
            statusSm: doneForm.statusSm,
            picSupply: doneForm.picSupply
          } : r
        )
      };
    });
    setIsDoneOpen(false);
  };

  const handleCopySpreadsheet = (req: any) => {
    const today = new Date().toLocaleDateString('id-ID');
    const tglP = req.tglPerlu ? new Date(req.tglPerlu).toLocaleDateString('id-ID') : '';
    
    let tsv = '';
    if (req.items && Array.isArray(req.items)) {
      req.items.forEach((item: any) => {
        if (!item.nama) return;
        const row = [
          `=N(INDIRECT("A"&(ROW()-1)))+1`, // A
          today, // B
          item.nama, // C
          item.jumlah, // D
          item.satuan, // E
          tglP // F
        ];
        tsv += row.join('\t') + '\n';
      });
    }
    
    navigator.clipboard.writeText(tsv).then(() => {
      alert('Berhasil disalin ke clipboard! Silakan paste di Spreadsheet.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Gagal menyalin ke clipboard.');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Diproses': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dikirim': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Selesai': return 'bg-green-100 text-green-800 border-green-200';
      case 'Dibatalkan': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-text/5 text-text/80 border-border';
    }
  };

  const fmtDate = (d: string) => {
    if (!d) return '';
    const p = d.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
  };

  const RadioGroup = ({ label, options, value, onChange }: any) => (
    <div className="flex flex-col gap-1.5 mb-3.5">
      <label className="text-[10px] font-bold text-text/50 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${value === opt ? 'border-primary bg-primary' : 'border-border bg-card'}`}>
              {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-primary-text" />}
            </div>
            <span className="text-xs text-text">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {pending.length === 0 ? (
        <div className="text-[11px] text-text/25 text-center py-6">Belum ada request material.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((req: any) => (
            <div key={req.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-text/[0.02]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text/40 uppercase tracking-wide">Req: {fmtDate(req.tglReq)}</span>
                  <span className="text-[11px] font-bold text-text">Perlu: {fmtDate(req.tglPerlu)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={req.status || 'Menunggu'}
                    onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md border outline-none appearance-none cursor-pointer ${getStatusColor(req.status || 'Menunggu')}`}
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Dikirim">Dikirim</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                  <button onClick={() => handleCopySpreadsheet(req)} className="bg-blue-500 text-white p-1 rounded-md shadow-sm" title="Salin ke Spreadsheet">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => handleOpenDone(req)} className="bg-primary text-primary-text font-bold text-[10px] px-2.5 py-1 rounded-md shadow-sm">
                    Done
                  </button>
                  <button onClick={() => handleDelete(req.id)} className="text-text/20 hover:text-red-500 transition-colors ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="px-3 py-2">
                <ul className="list-disc pl-4 m-0 space-y-1">
                  {req.items.map((item: any, idx: number) => (
                    <li key={idx} className="text-xs text-text">
                      <span className="font-semibold">{item.nama}</span> — {item.jumlah} {item.satuan}
                    </li>
                  ))}
                </ul>
              </div>
              {(req.penerima || req.confirm || req.statusSm || req.picSupply) && (
                <div className="px-3 py-2 border-t border-border bg-text/[0.02] flex flex-col gap-2">
                  <div className="text-[10px] text-text/60 grid grid-cols-2 gap-1.5">
                    <div><span className="font-semibold text-text/80">Penerima:</span> {req.penerima || '-'}</div>
                    <div><span className="font-semibold text-text/80">Confirm:</span> {req.confirm || '-'}</div>
                    <div><span className="font-semibold text-text/80">Status SM:</span> {req.statusSm || '-'}</div>
                    <div><span className="font-semibold text-text/80">PIC Supply:</span> {req.picSupply || '-'}</div>
                  </div>
                  <button 
                    onClick={() => {
                      const itemsText = req.items.map((i: any) => `- ${i.nama} (${i.jumlah} ${i.satuan})`).join('\n');
                      const text = `*Laporan Pengiriman Material*\n\n*Tanggal Request:* ${fmtDate(req.tglReq)}\n*Tanggal Perlu:* ${fmtDate(req.tglPerlu)}\n\n*Item:*\n${itemsText}\n\n*Status Pengiriman:*\nPenerima: ${req.penerima || '-'}\nConfirm: ${req.confirm || '-'}\nStatus SM: ${req.statusSm || '-'}\nPIC Supply: ${req.picSupply || '-'}\nStatus By SCM: -`;
                      window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
                    }}
                    className="w-full bg-[#25D366] text-white font-bold text-[10px] py-1.5 rounded-md flex items-center justify-center gap-1.5"
                  >
                    Kirim Laporan WA
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Overlay isOpen={isDoneOpen} onClose={() => setIsDoneOpen(false)} title="Status Pengiriman (Done)">
        <div className="flex flex-col pb-4">
          <RadioGroup 
            label="Penerima" 
            options={['Site Manager', 'Mandor']} 
            value={doneForm.penerima} 
            onChange={(val: string) => setDoneForm({ ...doneForm, penerima: val })} 
          />
          <RadioGroup 
            label="Confirm" 
            options={['Diterima', 'Ditolak', 'Kurang']} 
            value={doneForm.confirm} 
            onChange={(val: string) => setDoneForm({ ...doneForm, confirm: val })} 
          />
          <RadioGroup 
            label="Status by SM" 
            options={['Sampai', 'Belum Sampai', 'Terlambat']} 
            value={doneForm.statusSm} 
            onChange={(val: string) => setDoneForm({ ...doneForm, statusSm: val })} 
          />
          <RadioGroup 
            label="PIC Supply" 
            options={['Toko', 'Pak Edi', 'Kurir', 'Pick Up']} 
            value={doneForm.picSupply} 
            onChange={(val: string) => setDoneForm({ ...doneForm, picSupply: val })} 
          />
          
          <div className="flex flex-col gap-1.5 mb-4 opacity-50 pointer-events-none">
            <label className="text-[10px] font-bold text-text/50 uppercase tracking-wide">Status By SCM</label>
            <input disabled placeholder="Dikosongkan" className="bg-text/5 border border-border rounded-lg px-3 py-2 text-xs text-text/50" />
          </div>

          <button onClick={handleSaveDone} className="w-full bg-primary text-primary-text font-bold text-xs p-3.5 rounded-xl shadow-lg shadow-primary/20 mt-2">
            Simpan & Selesaikan
          </button>
        </div>
      </Overlay>
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari material..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-text outline-none focus:border-primary"
          />
        </div>
        <button onClick={handleOpenAdd} className="bg-primary text-primary-text font-medium text-[11px] px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1">
          <Plus size={14} /> Tambah
        </button>
      </div>
      
      <button onClick={handleSendWA} className="w-full bg-[#25D366] text-white font-medium text-xs p-2.5 rounded-lg flex items-center justify-center gap-1.5 mb-2 shadow-sm">
        <Send size={14} /> Laporan Stok ke WA
      </button>
      
      <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-text/25 text-center py-10 flex flex-col items-center gap-2">
            <Package size={24} className="opacity-10" />
            {search ? 'Material tidak ditemukan.' : 'Stok gudang kosong.'}
          </div>
        ) : (
          filtered.map((s, i) => (
            <div 
              key={s.id} 
              onClick={() => handleOpenEdit(s)}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-text/[0.02] transition-colors ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex-1">
                <div className="text-xs text-text font-bold">{s.nama}</div>
                <div className="text-[10px] text-text/40 mt-0.5">ID: {s.id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`font-mono text-sm font-bold ${s.stok === 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  {s.stok}
                </div>
                <div className="text-[10px] text-text/40 min-w-[32px]">{s.satuan}</div>
                {s.stok === 0 && (
                  <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 font-bold rounded tracking-wide">HABIS</span>
                )}
                <Edit3 size={12} className="text-text/10 ml-1" />
              </div>
            </div>
          ))
        )}
      </div>

      <Overlay isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editId ? "Edit Stok" : "Tambah Stok"}>
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px] font-bold">Nama Material</label>
            <input
              autoFocus
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="Semen, Pasir, Besi D12..."
              className="bg-text/5 border border-border rounded-xl px-3.5 py-3 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px] font-bold">Jumlah Stok</label>
              <input
                type="number"
                value={stok}
                onChange={e => setStok(e.target.value)}
                placeholder="0"
                className="bg-text/5 border border-border rounded-xl px-3.5 py-3 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px] font-bold">Satuan</label>
              <input
                value={satuan}
                onChange={e => setSatuan(e.target.value)}
                placeholder="zak, m3, btg..."
                className="bg-text/5 border border-border rounded-xl px-3.5 py-3 text-sm text-text outline-none focus:border-primary"
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
      <div className="text-[9px] text-text/35 uppercase tracking-[1.5px] mb-1">Daftar Belanja</div>
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-0 mb-1">
          <div className="w-[22px] shrink-0 text-[11px] text-text/30 py-2.5 pr-1 flex items-center">{idx + 1}.</div>
          <input
            id={`shop-nama-${idx}`}
            value={item.nama}
            onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, nama: capitalizeWords(e.target.value) } : i))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`shop-jumlah-${idx}`)?.focus(); } }}
            placeholder="Nama barang..."
            className="flex-[1.6] bg-text/5 border border-border border-r-0 rounded-l-lg px-2.5 py-2 text-xs text-text outline-none focus:border-primary"
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
            className="flex-1 bg-text/5 border border-border rounded-r-lg px-2.5 py-2 text-xs text-text outline-none focus:border-primary"
          />
        </div>
      ))}
      <button onClick={handleAddBaris} className="w-full bg-transparent border-[1.5px] border-dashed border-primary/50 rounded-lg p-2.5 text-[11px] text-primary-dark mt-1">
        + Baris
      </button>
      <button onClick={handleSend} className="w-full bg-[#25D366] text-white font-medium text-[13px] p-3 rounded-lg flex items-center justify-center gap-2 mt-3">
        <Send size={16} /> Kirim ke WA
      </button>
    </div>
  );
}

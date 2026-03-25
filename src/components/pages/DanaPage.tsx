import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Camera, Send } from 'lucide-react';
import Overlay from '../Overlay';
import { capitalizeWords } from '../../utils';

interface DanaPageProps {
  state: AppState;
  locData: LocData;
  updateLocData: (locId: string, updater: (prev: LocData) => LocData) => void;
  onBack: () => void;
}

export default function DanaPage({ state, locData, updateLocData, onBack }: DanaPageProps) {
  const [noSeri, setNoSeri] = useState(locData.danaNoSeri || 1);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [klasifikasi, setKlasifikasi] = useState('Bahan');
  const [items, setItems] = useState([{ id: 'di_1', uraian: '', vol: '', satuan: '', hargaSatuan: '', totalHarga: '' }]);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editItemIdx, setEditItemIdx] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ uraian: '', vol: '', satuan: '', hargaSatuan: '', totalHarga: '' });

  const locName = state.locations.find(l => l.id === state.activeLoc)?.name || '—';

  const handleNoSeriChange = (delta: number) => {
    const newVal = Math.max(1, noSeri + delta);
    setNoSeri(newVal);
    if (state.activeLoc) {
      updateLocData(state.activeLoc, prev => ({ ...prev, danaNoSeri: newVal }));
    }
  };

  const handleOpenItemForm = (idx: number | null) => {
    setEditItemIdx(idx);
    if (idx !== null) {
      setItemForm(items[idx]);
    } else {
      setItemForm({ uraian: '', vol: '', satuan: '', hargaSatuan: '', totalHarga: '' });
    }
    setIsItemFormOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.uraian.trim()) return alert('Isi nama barang dulu!');
    if (editItemIdx !== null) {
      const newItems = [...items];
      newItems[editItemIdx] = { ...newItems[editItemIdx], ...itemForm };
      setItems(newItems);
    } else {
      setItems([...items, { id: `di_${Date.now()}`, ...itemForm }]);
    }
    setIsItemFormOpen(false);
  };

  const handleDeleteItem = () => {
    if (editItemIdx !== null) {
      setItems(items.filter((_, i) => i !== editItemIdx));
      setIsItemFormOpen(false);
    }
  };

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const t = item.totalHarga ? parseFloat(item.totalHarga) : (parseFloat(item.vol) || 0) * (parseFloat(item.hargaSatuan) || 0);
      return sum + (t || 0);
    }, 0);
  };

  const total = calcTotal();
  const totalStr = `Rp ${Math.round(total).toLocaleString('id-ID')}`;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    const filled = items.filter(x => x.uraian.trim());
    if (!filled.length) return alert('Isi minimal 1 uraian!');

    const fmtDate = (d: string) => { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
    const itemLines = filled.map(x => {
      const tot = x.totalHarga ? parseFloat(x.totalHarga) : (parseFloat(x.vol) || 0) * (parseFloat(x.hargaSatuan) || 0);
      const totStr = tot ? ` = Rp ${Math.round(tot).toLocaleString('id-ID')}` : '';
      const volStr = x.vol ? `${x.vol} ${x.satuan}` : '';
      const hrgStr = x.hargaSatuan ? ` × Rp ${parseFloat(x.hargaSatuan).toLocaleString('id-ID')}` : '';
      return `- ${x.uraian.trim()}${volStr ? ` (${volStr}${hrgStr})` : ''}${totStr}`;
    }).join('\n');

    const waText = `*Dana Lapangan — No. ${noSeri}*\n📍 ${locName}\n📅 ${fmtDate(tanggal)}\n🏷️ ${klasifikasi}\n\n${itemLines}\n\n*Total: Rp ${Math.round(total).toLocaleString('id-ID')}*`;
    window.location.href = `whatsapp://send?text=${encodeURIComponent(waText)}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <PageHeader
        title="Dana Lapangan"
        subtitle={locName}
        onBack={onBack}
        rightContent={
          <div className="flex items-center gap-1">
            <button onClick={() => handleNoSeriChange(-1)} className="w-5 h-5 border border-black/10 bg-white rounded flex items-center justify-center text-black/50">‹</button>
            <div className="flex items-center border border-black/10 bg-white rounded px-1.5 py-0.5">
              <span className="text-[10px] text-black/40 font-bold mr-0.5">#</span>
              <input type="number" value={noSeri} onChange={e => setNoSeri(parseInt(e.target.value) || 1)} className="w-6 text-center text-sm font-bold font-mono text-[#1a1a1a] bg-transparent outline-none" />
            </div>
            <button onClick={() => handleNoSeriChange(1)} className="w-5 h-5 border border-black/10 bg-white rounded flex items-center justify-center text-black/50">›</button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#f8f8f8] rounded-lg p-2.5">
            <div className="text-[9px] text-[#999] uppercase tracking-[0.8px] mb-1">Sisa Dana</div>
            <div className="text-[15px] font-bold text-[#2a7a00] font-mono">—</div>
            <div className="text-[9px] text-[#bbb] flex items-center gap-1 mt-1 cursor-pointer">
              <RefreshCw size={8} strokeWidth={2.5} /> refresh
            </div>
          </div>
          <div className="bg-[#f8f8f8] rounded-lg p-2.5">
            <div className="text-[9px] text-[#999] uppercase tracking-[0.8px] mb-1">Total Nota</div>
            <div className="text-[15px] font-bold text-[#1a1a1a] font-mono">{totalStr}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-[#f8f8f8] rounded-md p-2">
            <div className="text-[9px] text-[#999] uppercase tracking-[0.8px] mb-0.5">Tanggal</div>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="border-none outline-none text-xs w-full bg-transparent text-[#1a1a1a] font-medium" />
          </div>
          <div className="flex-1 bg-[#f8f8f8] rounded-md p-2">
            <div className="text-[9px] text-[#999] uppercase tracking-[0.8px] mb-0.5">Klasifikasi</div>
            <select value={klasifikasi} onChange={e => setKlasifikasi(e.target.value)} className="border-none outline-none text-xs w-full bg-transparent text-[#1a1a1a] font-medium p-0">
              <option value="Bahan">Bahan</option>
              <option value="Peralatan">Peralatan</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>
        </div>

        <div className="border border-[#efefef] rounded-lg">
          <div className="grid grid-cols-[1fr_52px_78px_80px] bg-[#fafafa] px-3 py-1.5 border-b border-[#efefef] rounded-t-lg">
            <span className="text-[9px] text-[#bbb] uppercase tracking-[0.6px]">Uraian</span>
            <span className="text-[9px] text-[#bbb] uppercase tracking-[0.6px] text-right">Vol</span>
            <span className="text-[9px] text-[#bbb] uppercase tracking-[0.6px] text-right">Harga Sat.</span>
            <span className="text-[9px] text-[#bbb] uppercase tracking-[0.6px] text-right">Total</span>
          </div>
          <div className="min-h-[260px]">
            {items.map((item, idx) => {
              const t = item.totalHarga ? parseFloat(item.totalHarga) : (parseFloat(item.vol) || 0) * (parseFloat(item.hargaSatuan) || 0);
              const hSat = item.hargaSatuan ? Math.round(parseFloat(item.hargaSatuan)).toLocaleString('id-ID') : '';
              const tStr = t ? Math.round(t).toLocaleString('id-ID') : '';
              return (
                <div key={item.id} onClick={() => handleOpenItemForm(idx)} className="grid grid-cols-[1fr_52px_78px_80px] px-3 py-2.5 border-b border-[#efefef] items-center cursor-pointer min-h-[38px]">
                  <div className={`text-xs truncate ${item.uraian ? 'text-[#1a1a1a]' : 'text-[#ccc]'}`}>{item.uraian || '—'}</div>
                  <div className="text-[11px] text-[#999] text-right">{item.vol} {item.satuan}</div>
                  <div className="text-[11px] text-[#999] text-right">{hSat}</div>
                  <div className="text-xs font-semibold text-[#2a7a00] text-right font-mono">{tStr}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#f5ffe8] rounded-lg">
          <div className="text-[11px] text-[#5a9a00] font-medium">Total Nota #{noSeri}</div>
          <div className="text-base font-bold text-[#2a4a00] font-mono">{totalStr}</div>
        </div>

        <div className="flex gap-2 items-stretch">
          <button onClick={() => handleOpenItemForm(null)} className="w-14 h-16 bg-primary border-none rounded-lg cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0">
            <Plus size={18} className="text-primary-text" strokeWidth={2.5} />
            <span className="text-[9px] font-semibold text-primary-text tracking-[0.3px]">Item</span>
          </button>

          {fotoUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative border border-black/5">
              <img src={fotoUrl} alt="Nota" className="w-full h-full object-cover" />
              <button onClick={() => setFotoUrl(null)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px]">×</button>
            </div>
          ) : (
            <label className="flex-1 border-[1.5px] border-dashed border-[#d0e8b0] rounded-lg p-2.5 flex items-center gap-2.5 cursor-pointer bg-[#fafff5] min-h-[64px]">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Camera size={16} className="text-primary-text" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[11px] text-[#5a9a00] font-medium">Foto Nota</div>
                <div className="text-[10px] text-[#aaa] mt-[1px]">Kamera atau galeri</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>

        <button onClick={handleSend} className="w-full bg-[#25D366] border-none rounded-lg p-3 text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2">
          <Send size={13} strokeWidth={2.2} /> Upload
        </button>

        <div>
          <div className="text-[9px] text-black/35 uppercase tracking-[1.5px] mb-2">Riwayat</div>
          {locData.dana?.length ? (
            locData.dana.map((d: any) => (
              <div key={d.id} className="bg-black/5 border border-black/5 rounded-lg p-2.5 mb-2 flex items-start gap-2.5">
                <div className="flex-1">
                  <div className="text-xs font-medium text-black/80 mb-1">No.{d.noSeri} — {d.klasifikasi}</div>
                  <div className="text-[10px] text-black/40 leading-relaxed">{d.tgl} · {d.items?.length || 0} item</div>
                </div>
                <div className="font-mono text-[11px] text-[#4a7a00] font-medium shrink-0">Rp {Math.round(d.total || 0).toLocaleString('id-ID')}</div>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-black/25 text-center py-6">Belum ada catatan.</div>
          )}
        </div>
      </div>

      {/* Item Form Overlay */}
      <Overlay isOpen={isItemFormOpen} onClose={() => setIsItemFormOpen(false)} title={editItemIdx !== null ? "Edit Item" : "Tambah Item"}>
        <div className="flex flex-col gap-3 pb-6">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Uraian / Nama Barang</label>
            <input id="item-uraian" value={itemForm.uraian} onChange={e => setItemForm({ ...itemForm, uraian: capitalizeWords(e.target.value) })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-vol')?.focus(); } }} placeholder="Nama barang..." className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Vol</label>
              <input id="item-vol" type="number" value={itemForm.vol} onChange={e => setItemForm({ ...itemForm, vol: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-satuan')?.focus(); } }} placeholder="0" className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Satuan</label>
              <input id="item-satuan" value={itemForm.satuan} onChange={e => setItemForm({ ...itemForm, satuan: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-harga')?.focus(); } }} placeholder="pcs, kg, m..." className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Harga Satuan</label>
              <input id="item-harga" type="number" value={itemForm.hargaSatuan} onChange={e => setItemForm({ ...itemForm, hargaSatuan: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-total')?.focus(); } }} placeholder="Rp 0" className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Total Harga</label>
              <input id="item-total" type="number" value={itemForm.totalHarga} onChange={e => setItemForm({ ...itemForm, totalHarga: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveItem(); } }} placeholder="Rp 0" className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary" />
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-lg px-3.5 py-2.5 flex justify-between items-center">
            <span className="text-[11px] text-black/50">Total item ini</span>
            <span className="text-[15px] font-semibold text-primary-text font-mono">
              Rp {Math.round(itemForm.totalHarga ? parseFloat(itemForm.totalHarga) : (parseFloat(itemForm.vol) || 0) * (parseFloat(itemForm.hargaSatuan) || 0) || 0).toLocaleString('id-ID')}
            </span>
          </div>

          <button onClick={handleSaveItem} className="w-full bg-primary text-primary-text font-medium text-[13px] p-3 rounded-[10px]">
            Simpan Item
          </button>
          {editItemIdx !== null && (
            <button onClick={handleDeleteItem} className="w-full bg-transparent border border-red-600/30 text-red-600 font-medium text-xs p-2.5 rounded-[10px]">
              Hapus Item Ini
            </button>
          )}
        </div>
      </Overlay>
    </div>
  );
}

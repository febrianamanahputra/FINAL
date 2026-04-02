import React, { useState, useEffect } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Camera, Send, Copy, CheckSquare } from 'lucide-react';
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

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedDanaIds, setSelectedDanaIds] = useState<string[]>([]);

  const locName = state.locations.find(l => l.id === state.activeLoc)?.name || '—';

  useEffect(() => {
    const existingDana = locData.dana?.find((d: any) => d.noSeri === noSeri);
    if (existingDana) {
      setTanggal(existingDana.tgl);
      setKlasifikasi(existingDana.klasifikasi);
      setItems(existingDana.items?.length ? existingDana.items : [{ id: `di_${Date.now()}`, uraian: '', vol: '', satuan: '', hargaSatuan: '', totalHarga: '' }]);
      setFotoUrl(existingDana.fotoUrl || null);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setKlasifikasi('Bahan');
      setItems([{ id: `di_${Date.now()}`, uraian: '', vol: '', satuan: '', hargaSatuan: '', totalHarga: '' }]);
      setFotoUrl(null);
    }
  }, [noSeri]); // intentionally omitting locData.dana to prevent overwriting during sync

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

  const handleSaveItem = (lastField?: 'hargaSatuan' | 'totalHarga') => {
    if (!itemForm.uraian.trim()) return alert('Isi nama barang dulu!');
    
    let finalItem = { ...itemForm };
    let numHarga = parseFloat(finalItem.hargaSatuan.replace(/\D/g, '')) || 0;
    let numTotal = parseFloat(finalItem.totalHarga.replace(/\D/g, '')) || 0;
    const vol = parseFloat(finalItem.vol) || 0;

    if (lastField === 'totalHarga') {
        if (numTotal > 0 && numTotal < 1000) {
            numTotal *= 1000;
            finalItem.totalHarga = numTotal.toString();
            finalItem.hargaSatuan = vol > 0 ? Math.round(numTotal / vol).toString() : '';
        }
    } else if (lastField === 'hargaSatuan') {
        if (numHarga > 0 && numHarga < 1000) {
            numHarga *= 1000;
            finalItem.hargaSatuan = numHarga.toString();
            finalItem.totalHarga = vol > 0 ? (numHarga * vol).toString() : '';
        }
    } else {
        if (numHarga > 0 && numHarga < 1000) {
            numHarga *= 1000;
            finalItem.hargaSatuan = numHarga.toString();
            finalItem.totalHarga = vol > 0 ? (numHarga * vol).toString() : '';
        } else if (numTotal > 0 && numTotal < 1000) {
            numTotal *= 1000;
            finalItem.totalHarga = numTotal.toString();
            finalItem.hargaSatuan = vol > 0 ? Math.round(numTotal / vol).toString() : '';
        }
    }

    if (editItemIdx !== null) {
      const newItems = [...items];
      newItems[editItemIdx] = { ...newItems[editItemIdx], ...finalItem };
      setItems(newItems);
    } else {
      setItems([...items, { id: `di_${Date.now()}`, ...finalItem }]);
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

  const handleVolChange = (val: string) => {
    const vol = parseFloat(val) || 0;
    const harga = parseFloat(itemForm.hargaSatuan.replace(/\D/g, '')) || 0;
    const total = vol * harga;
    setItemForm({
      ...itemForm,
      vol: val,
      totalHarga: total ? total.toString() : ''
    });
  };

  const handleHargaSatuanChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const harga = parseFloat(cleanVal) || 0;
    const vol = parseFloat(itemForm.vol) || 0;
    const total = vol * harga;
    setItemForm({
      ...itemForm,
      hargaSatuan: cleanVal,
      totalHarga: total ? total.toString() : ''
    });
  };

  const handleTotalHargaChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const total = parseFloat(cleanVal) || 0;
    const vol = parseFloat(itemForm.vol) || 0;
    const harga = vol > 0 ? Math.round(total / vol) : 0;
    setItemForm({
      ...itemForm,
      totalHarga: cleanVal,
      hargaSatuan: harga ? harga.toString() : ''
    });
  };

  const handleBlurMultiply = (field: 'hargaSatuan' | 'totalHarga') => {
    const currentVal = itemForm[field];
    if (!currentVal) return;
    const num = parseFloat(currentVal.replace(/\D/g, ''));
    if (num > 0 && num < 1000) {
      const newVal = (num * 1000).toString();
      if (field === 'hargaSatuan') {
        handleHargaSatuanChange(newVal);
      } else {
        handleTotalHargaChange(newVal);
      }
    }
  };

  const formatCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('id-ID');
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
    
    const existingDana = locData.dana?.find((d: any) => d.noSeri === noSeri);
    const newDana = {
      id: existingDana ? existingDana.id : `dana_${Date.now()}`,
      noSeri,
      tgl: tanggal,
      klasifikasi,
      items: filled,
      total,
      fotoUrl
    };
    
    if (state.activeLoc) {
      updateLocData(state.activeLoc, prev => {
        const existingIdx = (prev.dana || []).findIndex((d: any) => d.noSeri === noSeri);
        let newDanaList = [...(prev.dana || [])];
        if (existingIdx >= 0) {
          newDanaList[existingIdx] = newDana;
        } else {
          newDanaList = [newDana, ...newDanaList];
        }
        
        const nextNoSeri = Math.max(prev.danaNoSeri || 1, noSeri + 1);
        
        return {
          ...prev,
          danaNoSeri: nextNoSeri,
          dana: newDanaList
        };
      });
    }
    
    setNoSeri(noSeri + 1);
    
    window.location.href = `whatsapp://send?text=${encodeURIComponent(waText)}`;
  };

  const handleOpenCopyModal = () => {
    setSelectedDanaIds([]);
    setIsCopyModalOpen(true);
  };

  const handleCopyDana = () => {
    const selectedDana = locData.dana?.filter((d: any) => selectedDanaIds.includes(d.id)) || [];
    if (!selectedDana.length) return alert('Pilih minimal 1 dana');
    
    let tsv = '';
    const today = new Date().toLocaleDateString('id-ID');
    
    selectedDana.forEach(dana => {
      dana.items.forEach((item: any) => {
        const row = [
          `=N(INDIRECT("A"&(ROW()-1)))+1`, // A
          today, // B
          item.uraian, // C
          '', // D
          item.uraian, // E
          dana.klasifikasi, // F
          '', // G
          item.vol, // H
          item.satuan, // I
          item.hargaSatuan, // J
          item.totalHarga || (parseFloat(item.vol) * parseFloat(item.hargaSatuan)).toString() // K
        ];
        tsv += row.join('\t') + '\n';
      });
    });
    
    navigator.clipboard.writeText(tsv).then(() => {
      alert('Berhasil disalin ke clipboard! Silakan paste di Spreadsheet.');
      setIsCopyModalOpen(false);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Gagal menyalin ke clipboard.');
    });
  };

  const toggleDanaSelection = (id: string) => {
    setSelectedDanaIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <PageHeader
        title="Dana Lapangan"
        subtitle={locName}
        onBack={onBack}
        rightContent={
          <div className="flex items-center gap-1">
            <button onClick={() => handleNoSeriChange(-1)} className="w-5 h-5 border border-border bg-card rounded flex items-center justify-center text-text/50">‹</button>
            <div className="flex items-center border border-border bg-card rounded px-1.5 py-0.5">
              <span className="text-[10px] text-text/40 font-bold mr-0.5">#</span>
              <input type="number" value={noSeri} onChange={e => setNoSeri(parseInt(e.target.value) || 1)} className="w-6 text-center text-sm font-bold font-mono text-text bg-transparent outline-none" />
            </div>
            <button onClick={() => handleNoSeriChange(1)} className="w-5 h-5 border border-border bg-card rounded flex items-center justify-center text-text/50">›</button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-text/5 rounded-lg p-2.5">
            <div className="text-[9px] text-text/50 uppercase tracking-[0.8px] mb-1">Sisa Dana</div>
            <div className="text-[15px] font-bold text-primary-dark font-mono">—</div>
            <div className="text-[9px] text-text/40 flex items-center gap-1 mt-1 cursor-pointer">
              <RefreshCw size={8} strokeWidth={2.5} /> refresh
            </div>
          </div>
          <div className="bg-text/5 rounded-lg p-2.5">
            <div className="text-[9px] text-text/50 uppercase tracking-[0.8px] mb-1">Total Nota</div>
            <div className="text-[15px] font-bold text-text font-mono">{totalStr}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-text/5 rounded-md p-2">
            <div className="text-[9px] text-text/50 uppercase tracking-[0.8px] mb-0.5">Tanggal</div>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="border-none outline-none text-xs w-full bg-transparent text-text font-medium" />
          </div>
          <div className="flex-1 bg-text/5 rounded-md p-2">
            <div className="text-[9px] text-text/50 uppercase tracking-[0.8px] mb-0.5">Klasifikasi</div>
            <select value={klasifikasi} onChange={e => setKlasifikasi(e.target.value)} className="border-none outline-none text-xs w-full bg-transparent text-text font-medium p-0">
              <option value="Bahan">Bahan</option>
              <option value="Peralatan">Peralatan</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>
        </div>

        <div className="border border-border rounded-lg">
          <div className="grid grid-cols-[1fr_52px_78px_80px] bg-text/5 px-3 py-1.5 border-b border-border rounded-t-lg">
            <span className="text-[9px] text-text/40 uppercase tracking-[0.6px]">Uraian</span>
            <span className="text-[9px] text-text/40 uppercase tracking-[0.6px] text-right">Vol</span>
            <span className="text-[9px] text-text/40 uppercase tracking-[0.6px] text-right">Harga Sat.</span>
            <span className="text-[9px] text-text/40 uppercase tracking-[0.6px] text-right">Total</span>
          </div>
          <div className="min-h-[260px]">
            {items.map((item, idx) => {
              const t = item.totalHarga ? parseFloat(item.totalHarga) : (parseFloat(item.vol) || 0) * (parseFloat(item.hargaSatuan) || 0);
              const hSat = item.hargaSatuan ? Math.round(parseFloat(item.hargaSatuan)).toLocaleString('id-ID') : '';
              const tStr = t ? Math.round(t).toLocaleString('id-ID') : '';
              return (
                <div key={item.id} onClick={() => handleOpenItemForm(idx)} className="grid grid-cols-[1fr_52px_78px_80px] px-3 py-2.5 border-b border-border items-center cursor-pointer min-h-[38px]">
                  <div className={`text-xs truncate ${item.uraian ? 'text-text' : 'text-text/30'}`}>{item.uraian || '—'}</div>
                  <div className="text-[11px] text-text/50 text-right">{item.vol} {item.satuan}</div>
                  <div className="text-[11px] text-text/50 text-right">{hSat}</div>
                  <div className="text-xs font-semibold text-primary-dark text-right font-mono">{tStr}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-primary/10 rounded-lg">
          <div className="text-[11px] text-primary font-medium">Total Nota #{noSeri}</div>
          <div className="text-base font-bold text-primary-text font-mono">{totalStr}</div>
        </div>

        <div className="flex gap-2 items-stretch">
          <button onClick={() => handleOpenItemForm(null)} className="w-14 h-16 bg-primary border-none rounded-lg cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0">
            <Plus size={18} className="text-primary-text" strokeWidth={2.5} />
            <span className="text-[9px] font-semibold text-primary-text tracking-[0.3px]">Item</span>
          </button>

          {fotoUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative border border-border">
              <img src={fotoUrl} alt="Nota" className="w-full h-full object-cover" />
              <button onClick={() => setFotoUrl(null)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-text/50 text-bg flex items-center justify-center text-[10px]">×</button>
            </div>
          ) : (
            <label className="flex-1 border-[1.5px] border-dashed border-primary/30 rounded-lg p-2.5 flex items-center gap-2.5 cursor-pointer bg-primary/5 min-h-[64px]">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Camera size={16} className="text-primary-text" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[11px] text-primary font-medium">Foto Nota</div>
                <div className="text-[10px] text-text/40 mt-[1px]">Kamera atau galeri</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={handleOpenCopyModal} className="flex-1 bg-blue-500 border-none rounded-lg p-3 text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2">
            <Copy size={13} strokeWidth={2.2} /> Salin Spreadsheet
          </button>
          <button onClick={handleSend} className="flex-1 bg-[#25D366] border-none rounded-lg p-3 text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2">
            <Send size={13} strokeWidth={2.2} /> Upload WA
          </button>
        </div>

        <div>
          <div className="text-[9px] text-text/35 uppercase tracking-[1.5px] mb-2">Riwayat</div>
          {locData.dana?.length ? (
            locData.dana.map((d: any) => (
              <div key={d.id} className="bg-text/5 border border-border rounded-lg p-2.5 mb-2 flex items-start gap-2.5">
                <div className="flex-1">
                  <div className="text-xs font-medium text-text/80 mb-1">No.{d.noSeri} — {d.klasifikasi}</div>
                  <div className="text-[10px] text-text/40 leading-relaxed">{d.tgl} · {d.items?.length || 0} item</div>
                </div>
                <div className="font-mono text-[11px] text-primary-dark font-medium shrink-0">Rp {Math.round(d.total || 0).toLocaleString('id-ID')}</div>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-text/25 text-center py-6">Belum ada catatan.</div>
          )}
        </div>
      </div>

      {/* Item Form Overlay */}
      <Overlay isOpen={isItemFormOpen} onClose={() => setIsItemFormOpen(false)} title={editItemIdx !== null ? "Edit Item" : "Tambah Item"}>
        <div className="flex flex-col gap-3 pb-6">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Uraian / Nama Barang</label>
            <input id="item-uraian" value={itemForm.uraian} onChange={e => setItemForm({ ...itemForm, uraian: capitalizeWords(e.target.value) })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-vol')?.focus(); } }} placeholder="Nama barang..." className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Vol</label>
              <input id="item-vol" type="number" value={itemForm.vol} onChange={e => handleVolChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-satuan')?.focus(); } }} placeholder="0" className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Satuan</label>
              <input id="item-satuan" value={itemForm.satuan} onChange={e => setItemForm({ ...itemForm, satuan: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-harga')?.focus(); } }} placeholder="pcs, kg, m..." className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Harga Satuan</label>
              <input id="item-harga" type="text" inputMode="numeric" value={formatCurrency(itemForm.hargaSatuan)} onChange={e => handleHargaSatuanChange(e.target.value)} onBlur={() => handleBlurMultiply('hargaSatuan')} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('item-total')?.focus(); } }} placeholder="Rp 0" className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Total Harga</label>
              <input id="item-total" type="text" inputMode="numeric" value={formatCurrency(itemForm.totalHarga)} onChange={e => handleTotalHargaChange(e.target.value)} onBlur={() => handleBlurMultiply('totalHarga')} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveItem('totalHarga'); } }} placeholder="Rp 0" className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-lg px-3.5 py-2.5 flex justify-between items-center">
            <span className="text-[11px] text-text/50">Total item ini</span>
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

      {/* Copy to Spreadsheet Overlay */}
      <Overlay isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title="Salin ke Spreadsheet">
        <div className="flex flex-col gap-3 pb-6">
          <div className="text-[11px] text-text/60 mb-2">Pilih nomor dana yang ingin disalin:</div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {locData.dana?.length ? (
              locData.dana.map((d: any) => (
                <div 
                  key={d.id} 
                  onClick={() => toggleDanaSelection(d.id)}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedDanaIds.includes(d.id) ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedDanaIds.includes(d.id) ? 'bg-primary border-primary text-primary-text' : 'border-text/30'
                  }`}>
                    {selectedDanaIds.includes(d.id) && <CheckSquare size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-text">No. {d.noSeri}</div>
                    <div className="text-[10px] text-text/50">{d.tgl} • {d.klasifikasi}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-primary-dark">
                    Rp {Math.round(d.total || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-text/30 text-center py-4">Belum ada data dana.</div>
            )}
          </div>
          <button 
            onClick={handleCopyDana} 
            disabled={selectedDanaIds.length === 0}
            className="w-full bg-blue-500 text-white font-bold text-xs p-3.5 rounded-xl mt-2 disabled:opacity-50"
          >
            Salin {selectedDanaIds.length} Data
          </button>
        </div>
      </Overlay>
    </div>
  );
}

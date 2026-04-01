import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { X } from 'lucide-react';
import { capitalizeWords } from '../../utils';

interface CatatanPageProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onBack: () => void;
}

export default function CatatanPage({ state, updateState, onBack }: CatatanPageProps) {
  const [activeTab, setActiveTab] = useState<'umum' | 'tukang' | 'belanja'>('umum');
  
  // Catatan Umum state
  const [catatanUmum, setCatatanUmum] = useState('');

  // Belanja state
  const [namaBarang, setNamaBarang] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('');

  // Tukang state
  const [namaTukang, setNamaTukang] = useState('');
  const [totalTukang, setTotalTukang] = useState('');

  const locName = 'Semua Proyek';

  const handleSave = () => {
    let newItem: any = {
      id: Date.now(),
      type: activeTab,
      tgl: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    if (activeTab === 'umum') {
      if (!catatanUmum.trim()) return;
      newItem.teks = catatanUmum.trim();
      setCatatanUmum('');
    } else if (activeTab === 'belanja') {
      if (!namaBarang.trim() || !jumlah.trim() || !satuan.trim()) return;
      newItem.data = { namaBarang: namaBarang.trim(), jumlah: jumlah.trim(), satuan: satuan.trim() };
      setNamaBarang('');
      setJumlah('');
      setSatuan('');
    } else {
      if (!namaTukang.trim() || !totalTukang.trim()) return;
      newItem.data = { namaTukang: namaTukang.trim(), totalTukang: totalTukang.trim() };
      setNamaTukang('');
      setTotalTukang('');
    }

    updateState(prev => ({
      ...prev,
      globalCatatan: [newItem, ...(prev.globalCatatan || [])]
    }));
  };

  const handleDelete = (id: number) => {
    updateState(prev => ({
      ...prev,
      globalCatatan: (prev.globalCatatan || []).filter((c: any) => c.id !== id)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <PageHeader
        title="Catatan"
        subtitle={locName}
        onBack={onBack}
      />
      
      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        
        <div className="flex gap-0.5 mb-5 border-b border-border">
          <button
            onClick={() => setActiveTab('umum')}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'umum' ? 'border-primary text-primary-dark' : 'border-transparent text-text/40 hover:text-text/60'
            }`}
          >
            Catatan
          </button>
          <button
            onClick={() => setActiveTab('tukang')}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'tukang' ? 'border-primary text-primary-dark' : 'border-transparent text-text/40 hover:text-text/60'
            }`}
          >
            Tukang
          </button>
          <button
            onClick={() => setActiveTab('belanja')}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'belanja' ? 'border-primary text-primary-dark' : 'border-transparent text-text/40 hover:text-text/60'
            }`}
          >
            Belanja
          </button>
        </div>

        {activeTab === 'umum' ? (
          <div className="flex flex-col gap-2.5 mb-6">
            <textarea
              value={catatanUmum}
              onChange={e => setCatatanUmum(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Tulis catatan di sini..."
              className="w-full bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary min-h-[100px] resize-y"
            />
            <button onClick={handleSave} className="w-full bg-primary text-primary-text font-bold text-xs p-2.5 rounded-none mt-1">
              Simpan Catatan
            </button>
          </div>
        ) : activeTab === 'tukang' ? (
          <div className="flex flex-col gap-2.5 mb-6">
            <input
              id="catatan-nama-tukang"
              value={namaTukang}
              onChange={e => setNamaTukang(capitalizeWords(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('catatan-total-tukang')?.focus(); } }}
              placeholder="Nama Tukang"
              className="w-full bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
            />
            <input
              id="catatan-total-tukang"
              value={totalTukang}
              onChange={e => setTotalTukang(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); document.getElementById('catatan-nama-tukang')?.focus(); } }}
              placeholder="Total (misal: Rp 150.000 atau 2 Hari)"
              className="w-full bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
            />
            <button onClick={handleSave} className="w-full bg-primary text-primary-text font-bold text-xs p-2.5 rounded-none mt-1">
              Simpan Catatan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mb-6">
            <input
              id="catatan-nama-barang"
              value={namaBarang}
              onChange={e => setNamaBarang(capitalizeWords(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('catatan-jumlah-barang')?.focus(); } }}
              placeholder="Nama Barang"
              className="w-full bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
            />
            <div className="flex gap-2.5">
              <input
                id="catatan-jumlah-barang"
                type="number"
                value={jumlah}
                onChange={e => setJumlah(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('catatan-satuan-barang')?.focus(); } }}
                placeholder="Jumlah"
                className="flex-1 bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
              />
              <input
                id="catatan-satuan-barang"
                value={satuan}
                onChange={e => setSatuan(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); document.getElementById('catatan-nama-barang')?.focus(); } }}
                placeholder="Satuan (pcs, sak, dll)"
                className="flex-1 bg-transparent border border-border rounded-none px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
              />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-primary-text font-bold text-xs p-2.5 rounded-none mt-1">
              Simpan Catatan
            </button>
          </div>
        )}

        <div className="text-[9px] text-text/35 uppercase tracking-[1.5px] mb-3">Catatan Tersimpan</div>
        
        <div className="flex flex-col gap-2.5">
          {state.globalCatatan?.filter((c: any) => c.type === activeTab).length ? (
            state.globalCatatan.filter((c: any) => c.type === activeTab).map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-none p-3 relative shadow-sm flex items-start justify-between gap-3">
                <div className="flex-1 pr-6">
                  {c.type === 'belanja' ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="px-2 py-1 bg-text/5 text-text/80 border border-border text-[10px] font-bold rounded-none">
                        {c.data.namaBarang}
                      </span>
                      <span className="px-2 py-1 bg-text/5 text-text/80 border border-border text-[10px] font-bold rounded-none">
                        {c.data.jumlah} {c.data.satuan}
                      </span>
                      <span className="text-[9px] text-text/40 font-mono ml-1">{c.tgl}</span>
                    </div>
                  ) : c.type === 'tukang' ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="px-2 py-1 bg-text/5 text-text/80 border border-border text-[10px] font-bold rounded-none">
                        {c.data.namaTukang}
                      </span>
                      <span className="px-2 py-1 bg-text/5 text-text/80 border border-border text-[10px] font-bold rounded-none">
                        {c.data.totalTukang}
                      </span>
                      <span className="text-[9px] text-text/40 font-mono ml-1">{c.tgl}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-xs font-medium text-text/80">
                      {c.teks} <span className="text-[9px] text-text/40 font-mono ml-1">{c.tgl}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(c.id)} className="absolute top-2.5 right-2.5 text-text/30 hover:text-red-500 p-0.5">
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-text/25 text-center py-6">Belum ada catatan.</div>
          )}
        </div>
      </div>
    </div>
  );
}

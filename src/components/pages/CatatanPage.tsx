import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { X, GripVertical, Plus } from 'lucide-react';
import { capitalizeWords } from '../../utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Overlay from '../Overlay';

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

  // Category state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const locName = 'Semua Proyek';

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newItem = {
      id: Date.now(),
      type: activeTab,
      isCategory: true,
      teks: newCategoryName.trim(),
      tgl: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    updateState(prev => ({
      ...prev,
      globalCatatan: [newItem, ...(prev.globalCatatan || [])]
    }));
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const currentTabItems = state.globalCatatan?.filter((c: any) => c.type === activeTab) || [];
    const otherItems = state.globalCatatan?.filter((c: any) => c.type !== activeTab) || [];

    const newTabItems = Array.from(currentTabItems);
    const [reorderedItem] = newTabItems.splice(sourceIndex, 1);
    newTabItems.splice(destinationIndex, 0, reorderedItem);

    updateState(prev => ({
      ...prev,
      globalCatatan: [...newTabItems, ...otherItems]
    }));
  };

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
        
        <div className="flex flex-col gap-2.5 pb-24">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`droppable-${activeTab}`}>
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="flex flex-col gap-2.5"
                >
                  {state.globalCatatan?.filter((c: any) => c.type === activeTab).length ? (
                    state.globalCatatan.filter((c: any) => c.type === activeTab).map((c: any, index: number) => (
                      <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'opacity-90 z-50' : ''}`}
                          >
                            {c.isCategory ? (
                              <div className="flex items-center gap-2 mt-4 mb-1 group relative">
                                <div {...provided.dragHandleProps} className="text-text/30 hover:text-text/60 cursor-grab active:cursor-grabbing p-1">
                                  <GripVertical size={14} />
                                </div>
                                <div className="flex-1 h-px bg-border"></div>
                                <span className="text-[10px] font-bold text-text/50 uppercase tracking-wider px-2">{c.teks}</span>
                                <div className="flex-1 h-px bg-border"></div>
                                <button onClick={() => handleDelete(c.id)} className="text-text/30 hover:text-red-500 p-1">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="bg-card border border-border rounded-none p-3 relative shadow-sm flex items-start justify-between gap-3 group">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-text/30 hover:text-text/60 cursor-grab active:cursor-grabbing shrink-0">
                                  <GripVertical size={16} />
                                </div>
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
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <div className="text-[11px] text-text/25 text-center py-6">Belum ada catatan.</div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      <button
        onClick={() => setIsCategoryModalOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-text rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
      >
        <Plus size={24} />
      </button>

      <Overlay isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Tambah Kategori">
        <div className="p-4 flex flex-col gap-3">
          <input
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }}
            placeholder="Nama Kategori (misal: Penting, Selesai, dll)"
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
            autoFocus
          />
          <button
            onClick={handleAddCategory}
            className="w-full bg-primary text-primary-text font-medium text-sm p-3 rounded-lg"
          >
            Tambah Kategori
          </button>
        </div>
      </Overlay>
    </div>
  );
}

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
  const [input, setInput] = useState('');
  const locName = 'Semua Proyek';

  const handleSave = () => {
    if (!input.trim()) return;
    
    updateState(prev => ({
      ...prev,
      globalCatatan: [{ id: Date.now(), teks: input.trim(), tgl: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...(prev.globalCatatan || [])]
    }));
    setInput('');
  };

  const handleDelete = (id: number) => {
    updateState(prev => ({
      ...prev,
      globalCatatan: (prev.globalCatatan || []).filter((c: any) => c.id !== id)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <PageHeader
        title="Catatan"
        subtitle={locName}
        onBack={onBack}
      />
      
      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        <div className="flex flex-col gap-2.5 mb-5">
          <textarea
            value={input}
            onChange={e => setInput(capitalizeWords(e.target.value))}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Tulis catatan..."
            rows={3}
            className="w-full bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary resize-none"
          />
          <button onClick={handleSave} className="w-full bg-primary text-primary-text font-medium text-xs p-2.5 rounded-[10px]">
            Simpan Catatan
          </button>
        </div>

        <div className="text-[9px] text-black/35 uppercase tracking-[1.5px] mb-2.5">Catatan Tersimpan</div>
        
        <div className="flex flex-col gap-2">
          {state.globalCatatan?.length ? (
            state.globalCatatan.map((c: any) => (
              <div key={c.id} className="bg-black/5 border border-black/5 rounded-[10px] p-2.5 relative">
                <div className="pr-7 whitespace-pre-wrap break-words text-xs font-medium text-black/80 mb-1">{c.teks}</div>
                <div className="text-[10px] text-black/40">{c.tgl}</div>
                <button onClick={() => handleDelete(c.id)} className="absolute top-2.5 right-2.5 text-black/30 hover:text-red-500 p-0.5">
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-black/25 text-center py-6">Belum ada catatan.</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { ExternalLink, X } from 'lucide-react';
import { capitalizeWords } from '../../utils';

interface LinkPageProps {
  state: AppState;
  locData: LocData;
  updateLocData: (locId: string, updater: (prev: LocData) => LocData) => void;
  onBack: () => void;
}

export default function LinkPage({ state, locData, updateLocData, onBack }: LinkPageProps) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleSave = () => {
    if (!state.activeLoc) return alert('Pilih lokasi dulu!');
    if (!label.trim() || !url.trim()) return alert('Isi nama dan URL!');
    
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

    updateLocData(state.activeLoc, prev => ({
      ...prev,
      links: [{ id: Date.now(), label: label.trim(), url: finalUrl, tgl: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...(prev.links || [])]
    }));
    setLabel('');
    setUrl('');
  };

  const handleDelete = (id: number) => {
    if (!state.activeLoc) return;
    updateLocData(state.activeLoc, prev => ({
      ...prev,
      links: (prev.links || []).filter((l: any) => l.id !== id)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <PageHeader
        title="Link Cepat"
        subtitle="Akses Cepat"
        onBack={onBack}
      />
      
      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        <div className="text-[9px] text-black/35 uppercase tracking-[1.5px] mb-2.5">Tambah Link</div>
        <div className="flex flex-col gap-2.5 mb-4">
          <input
            id="link-label"
            value={label}
            onChange={e => setLabel(capitalizeWords(e.target.value))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('link-url')?.focus(); } }}
            placeholder="Nama / Label link..."
            className="w-full bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary"
          />
          <input
            id="link-url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            placeholder="https://..."
            type="url"
            className="w-full bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary"
          />
          <button onClick={handleSave} className="w-full bg-primary text-primary-text font-medium text-xs p-2.5 rounded-[10px]">
            + Tambah Link
          </button>
        </div>

        <div className="text-[9px] text-black/35 uppercase tracking-[1.5px] mb-2.5">Link Tersimpan</div>
        
        <div className="flex flex-col gap-2">
          {locData.links?.length ? (
            locData.links.map((l: any) => (
              <div key={l.id} className="bg-black/5 border border-black/5 rounded-[10px] p-2.5 flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#1a1a1a] block mb-0.5 truncate hover:underline">
                    {l.label}
                  </a>
                  <div className="text-[10px] text-black/40 truncate">{l.url}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center text-black/70 hover:bg-black/10">
                    <ExternalLink size={13} />
                  </a>
                  <button onClick={() => handleDelete(l.id)} className="w-7 h-7 rounded-lg bg-transparent border border-black/10 flex items-center justify-center text-black/35 hover:text-red-500 hover:border-red-500/30">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-black/25 text-center py-6">Belum ada link.</div>
          )}
        </div>
      </div>
    </div>
  );
}

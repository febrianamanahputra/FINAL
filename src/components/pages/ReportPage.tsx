import React, { useState } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { Plus, Send, Camera, Trash2, MapPin } from 'lucide-react';
import Overlay from '../Overlay';
import { capitalizeWords } from '../../utils';

interface ReportPageProps {
  state: AppState;
  locData: LocData;
  updateLocData: (locId: string, updater: (prev: LocData) => LocData) => void;
  onBack: () => void;
}

interface Baris {
  id: string;
  teks: string;
  area: any | null;
  fotos: { url: string }[];
}

export default function ReportPage({ state, locData, updateLocData, onBack }: ReportPageProps) {
  const [barisList, setBarisList] = useState<Baris[]>(() => {
    const saved = localStorage.getItem(`baris_draft_${state.activeLoc || 'global'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length) return parsed.map((b: any) => ({ ...b, fotos: [] }));
      } catch (e) {}
    }
    return Array.from({ length: 5 }).map((_, i) => ({ id: `b_${i + 1}`, teks: '', area: null, fotos: [] }));
  });

  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [activeBarisId, setActiveBarisId] = useState<string | null>(null);

  const saveDraft = (list: Baris[]) => {
    localStorage.setItem(`baris_draft_${state.activeLoc || 'global'}`, JSON.stringify(list.map(b => ({ id: b.id, teks: b.teks, area: b.area }))));
  };

  const handleAddBaris = () => {
    const newList = [...barisList, { id: `b_${Date.now()}`, teks: '', area: null, fotos: [] }];
    setBarisList(newList);
    saveDraft(newList);
  };

  const handleUpdateBaris = (id: string, teks: string) => {
    const newList = barisList.map(b => b.id === id ? { ...b, teks: capitalizeWords(teks) } : b);
    setBarisList(newList);
    saveDraft(newList);
  };

  const handleDeleteBaris = (id: string) => {
    if (barisList.length <= 1) return;
    const newList = barisList.filter(b => b.id !== id);
    setBarisList(newList);
    saveDraft(newList);
  };

  const handleSharePhoto = async (baris: Baris, files: File[]) => {
    if (!baris.teks.trim()) {
      alert('Isi keterangan pekerjaan dulu sebelum memilih foto!');
      return;
    }
    const areaStr = baris.area ? ` | ${baris.area.nama}${baris.area.kategori ? ` ${baris.area.kategori}` : ''}` : '';
    const caption = `- Pek. ${baris.teks.trim()}${areaStr}`;

    let shareSuccess = false;

    if (navigator.share) {
      try {
        const canShareFiles = navigator.canShare ? navigator.canShare({ files }) : true;
        
        if (canShareFiles) {
          await navigator.share({
            files: files,
            title: 'Laporan Foto',
            text: caption
          });
          shareSuccess = true;
        } else {
          throw new Error("File sharing not supported");
        }
      } catch (err: any) {
        console.log('Share with files failed:', err);
        if (err.name === 'AbortError') return; // User cancelled
        
        // Fallback to text only share
        try {
          await navigator.share({
            title: 'Laporan Foto',
            text: caption
          });
          shareSuccess = true;
          alert('Browser/Aplikasi ini membatasi share foto langsung.\n\nTeks keterangan telah diteruskan, silakan lampirkan foto secara manual di WhatsApp.');
        } catch (fallbackErr: any) {
          if (fallbackErr.name === 'AbortError') return;
          console.log('Fallback share failed:', fallbackErr);
        }
      }
    }

    if (!shareSuccess) {
      // Fallback 2: Copy to clipboard
      try {
        await navigator.clipboard.writeText(caption);
        const isAndroid = /android/i.test(navigator.userAgent);
        const confirmMsg = 'Browser ini memblokir share foto.\n\nTeks telah disalin! Apakah Anda ingin pindah ke Chrome agar bisa share foto?';
        
        if (window.confirm(confirmMsg)) {
          if (isAndroid) {
            const url = window.location.href.replace(/^https?:\/\//, '');
            window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end;`;
          } else {
            alert('Ketuk ikon 3 titik/panah di pojok layar lalu pilih "Buka di Browser Utama".');
          }
        } else {
          alert('Silakan buka WA, pilih foto dari galeri, lalu "Paste/Tempel" keterangannya.');
        }
      } catch (clipboardErr) {
        alert('Gagal share. Silakan copy teks ini manual:\n\n' + caption);
      }
    }
  };

  const handleSendWA = () => {
    if (!state.activeLoc) return alert('Pilih lokasi proyek dulu!');
    const filled = barisList.filter(b => b.teks.trim());
    if (!filled.length) return alert('Isi minimal 1 baris laporan!');

    const now = new Date();
    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tglStr = `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
    const jam = now.getHours();
    const proyekNama = locData.waProyek || state.locations.find(l => l.id === state.activeLoc)?.name || 'Project';

    let header = jam < 14
      ? `Bismillah, Assalamualaikum\nRencana Kerja ${proyekNama}\n⬇️\n${tglStr}`
      : `Bismillah, Alhamdulillah\nProgres Kerja ${proyekNama}\n⬇️\n${tglStr}`;

    const lines = filled.map(b => {
      const areaStr = b.area ? ` | ${b.area.nama}${b.area.kategori ? ` ${b.area.kategori}` : ''}` : '';
      return `- Pek. ${b.teks.trim()}${areaStr}`;
    }).join('\n');

    const text = `${header}\n\n${lines}`;
    const num = (locData.waNumber || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    const waUrl = num ? `https://wa.me/${num}?text=${encoded}` : `whatsapp://send?text=${encoded}`;

    window.location.href = waUrl;
  };

  const locName = state.locations.find(l => l.id === state.activeLoc)?.name || '—';

  return (
    <div className="flex flex-col h-full bg-bg">
      <PageHeader
        title="Daily Report"
        subtitle={locName}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-[480px] mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] text-text/35 uppercase tracking-[1.5px]">Baris Laporan</div>
          <button onClick={handleAddBaris} className="bg-primary text-primary-text font-medium text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1">
            <Plus size={12} /> Baris
          </button>
        </div>

        <div className="flex flex-col gap-0.5 mb-4">
          {barisList.map((baris, idx) => (
            <div key={baris.id} className="flex items-center gap-2 border-b-[1.5px] border-primary py-1">
              <textarea
                id={`report-input-${idx}`}
                value={baris.teks}
                onChange={e => handleUpdateBaris(baris.id, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (idx === barisList.length - 1) {
                      handleAddBaris();
                      setTimeout(() => document.getElementById(`report-input-${idx + 1}`)?.focus(), 50);
                    } else {
                      document.getElementById(`report-input-${idx + 1}`)?.focus();
                    }
                  }
                }}
                placeholder={`Pekerjaan ${idx + 1}...`}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text resize-none h-10 leading-relaxed py-2 placeholder:text-text/20"
                rows={1}
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setActiveBarisId(baris.id); setIsAreaPickerOpen(true); }}
                  className={`p-1 flex items-center justify-center ${baris.area ? 'text-primary-dark' : 'text-text/45'}`}
                >
                  <MapPin size={14} strokeWidth={baris.area ? 2 : 1.5} />
                </button>
                <label className="p-1 flex items-center justify-center text-text/70 opacity-70 hover:opacity-100 cursor-pointer">
                  <Camera size={16} strokeWidth={1.5} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleSharePhoto(baris, Array.from(e.target.files));
                      }
                      e.target.value = '';
                    }} 
                  />
                </label>
                <button onClick={() => handleDeleteBaris(baris.id)} className="p-1 flex items-center justify-center text-text/25 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSendWA} className="w-full bg-[#25D366] text-white font-medium text-[13px] p-3 rounded-[10px] flex items-center justify-center gap-2 mb-4">
          <Send size={16} /> Kirim ke WA
        </button>
      </div>

      {/* Area Picker Overlay */}
      <Overlay isOpen={isAreaPickerOpen} onClose={() => setIsAreaPickerOpen(false)} title="Pilih Area">
        <div className="flex flex-col gap-1.5 pb-6">
          {locData.areas.length === 0 ? (
            <div className="text-xs text-text/40 text-center py-4">Belum ada area.<br/>Tambah di Kelola Area dulu.</div>
          ) : (
            locData.areas.map((a, i) => {
              const b = barisList.find(x => x.id === activeBarisId);
              const isSelected = b?.area?.nama === a.nama;
              return (
                <button
                  key={i}
                  onClick={() => {
                    const newList = barisList.map(x => x.id === activeBarisId ? { ...x, area: isSelected ? null : a } : x);
                    setBarisList(newList);
                    saveDraft(newList);
                    setIsAreaPickerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition-colors ${isSelected ? 'bg-primary text-primary-text font-medium' : 'bg-text/5 text-text'}`}
                >
                  {a.nama} {a.kategori && <span className="opacity-50 text-[11px]">{a.kategori}</span>}
                </button>
              );
            })
          )}
        </div>
      </Overlay>
    </div>
  );
}

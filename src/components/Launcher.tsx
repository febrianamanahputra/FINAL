import React, { useState, useEffect } from 'react';
import { Camera, FileText, Package, Wallet, StickyNote, Link as LinkIcon, Wrench, MapPin, X } from 'lucide-react';
import { AppState, LocData } from '../types';
import Overlay from './Overlay';
import { capitalizeWords } from '../utils';

interface LauncherProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  getLocData: (locId: string | null) => LocData;
  onOpenPage: (page: string) => void;
}

const MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function Launcher({ state, updateState, getLocData, onOpenPage }: LauncherProps) {
  const [time, setTime] = useState(new Date());
  const [isLocOpen, setIsLocOpen] = useState(false);
  const [isProfOpen, setIsProfOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [profForm, setProfForm] = useState({ name: state.profile.name, role: state.profile.role });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeLocName = state.activeLoc ? state.locations.find(l => l.id === state.activeLoc)?.name : 'Pilih Lokasi Proyek';
  const locData = getLocData(state.activeLoc);
  const coverPhoto = locData.coverPhoto;

  const handleAddLoc = () => {
    if (!newLocName.trim()) return;
    const id = 'loc_' + Date.now();
    updateState(prev => ({
      ...prev,
      locations: [...prev.locations, { id, name: newLocName.trim() }],
      activeLoc: prev.activeLoc || id
    }));
    setNewLocName('');
  };

  const handleDeleteLoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateState(prev => {
      const newLocs = prev.locations.filter(l => l.id !== id);
      return {
        ...prev,
        locations: newLocs,
        activeLoc: prev.activeLoc === id ? (newLocs.length ? newLocs[0].id : null) : prev.activeLoc
      };
    });
  };

  const handleSaveProf = () => {
    updateState(prev => ({
      ...prev,
      profile: { ...prev.profile, name: profForm.name || 'Nama Pengguna', role: profForm.role || 'Jabatan' }
    }));
    setIsProfOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.activeLoc) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateState(prev => ({
        ...prev,
        locData: {
          ...prev.locData,
          [state.activeLoc!]: { ...prev.locData[state.activeLoc!], coverPhoto: dataUrl }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateState(prev => ({
        ...prev,
        profile: { ...prev.profile, avatar: dataUrl }
      }));
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '—';

  return (
    <div className="flex flex-col px-5 pt-4 pb-16 max-w-[480px] mx-auto w-full h-full overflow-y-auto hide-scrollbar">
      {/* Date Block */}
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="font-condensed text-[64px] tracking-tight font-extrabold text-[#1a1a1a] leading-none uppercase m-0">
          {MONTHS[time.getMonth()]}
        </div>
        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          <div className="text-[11px] text-black/40 uppercase tracking-[1.5px] font-medium whitespace-nowrap">
            {DAYS[time.getDay()]},
          </div>
          <div className="font-mono text-[10px] text-black/30 tracking-wide whitespace-nowrap">
            {String(time.getDate()).padStart(2, '0')} / {time.getFullYear()}
          </div>
          <div className="font-mono text-[10px] text-black/30 whitespace-nowrap ml-auto">
            {String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Photo Section */}
      <div className="flex items-center justify-center w-full relative mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <label className="w-[370px] h-[260px] max-w-full bg-[#f0f0f0] relative overflow-hidden flex items-center justify-center cursor-pointer active:scale-[0.995] transition-transform">
          {coverPhoto ? (
            <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover absolute inset-0 z-10" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 opacity-35">
              <Camera size={28} strokeWidth={1.5} />
              <span className="text-[9px] uppercase tracking-[2px]">tap upload</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

      {/* Dock */}
      <div className="flex-shrink-0 w-full pb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex justify-center w-full gap-2.5 mb-5">
          {[
            { id: 'report', icon: FileText },
            { id: 'material', icon: Package },
            { id: 'dana', icon: Wallet },
            { id: 'catatan', icon: StickyNote },
            { id: 'link', icon: LinkIcon },
            { id: 'tools', icon: Wrench },
          ].map(app => (
            <button
              key={app.id}
              onClick={() => onOpenPage(app.id)}
              className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center cursor-pointer border-[1.5px] border-black/10 bg-white relative transition-all active:scale-[0.88] hover:border-black/25"
            >
              <app.icon size={22} strokeWidth={1.5} className="text-[#1a1a1a]" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsLocOpen(true)}
          className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-3.5 py-2 cursor-pointer transition-colors active:bg-black/10 mb-2.5 w-full"
        >
          <MapPin size={14} className="text-primary-dark opacity-80 shrink-0" />
          <div className="flex-1 text-[11px] text-black/45 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-left">
            {activeLocName}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-dark relative shrink-0">
            <div className="absolute -inset-[3px] rounded-full border border-primary-dark animate-ping opacity-50" />
          </div>
        </button>

        <button
          onClick={() => setIsProfOpen(true)}
          className="flex items-center gap-2 cursor-pointer py-0.5 w-full text-left"
        >
          <div className="w-[30px] h-[30px] rounded-full bg-[#e8f5c8] border-[1.5px] border-[#78c80080] flex items-center justify-center text-[10px] font-medium text-[#4a8800] overflow-hidden font-mono shrink-0">
            {state.profile.avatar ? (
              <img src={state.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(state.profile.name)}</span>
            )}
          </div>
          <div className="bg-black/5 border-l-2 border-primary rounded-r px-2 py-0.5 flex-1">
            <div className="text-[10px] font-medium text-black/75 tracking-wide truncate">{state.profile.name}</div>
            <div className="text-[8px] text-black/40 uppercase tracking-[1.2px] truncate">{state.profile.role}</div>
          </div>
        </button>
      </div>

      {/* Location Overlay */}
      <Overlay isOpen={isLocOpen} onClose={() => setIsLocOpen(false)} title="Lokasi Proyek">
        <div className="flex flex-col gap-1.5 mb-3">
          {state.locations.length === 0 ? (
            <div className="text-[11px] text-black/30 text-center py-4">Belum ada lokasi.</div>
          ) : (
            state.locations.map(l => {
              const ld = getLocData(l.id);
              const cnt = ld.reports.length + ld.materials.length + ld.dana.length;
              const isActive = state.activeLoc === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => { updateState(p => ({ ...p, activeLoc: l.id })); setIsLocOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2.5 border rounded-[10px] cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/10' : 'bg-black/5 border-black/10'}`}
                >
                  <MapPin size={12} className="text-primary-dark opacity-80 shrink-0" />
                  <div className="flex-1 text-xs text-black/75 truncate">{l.name}</div>
                  {cnt > 0 && <span className="text-[8px] text-[#4a8800] bg-[#78c8001f] px-2 py-0.5 rounded-full font-mono">{cnt}</span>}
                  <button onClick={(e) => handleDeleteLoc(l.id, e)} className="text-red-500/50 hover:text-red-500 p-1">
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={newLocName}
            onChange={e => setNewLocName(capitalizeWords(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleAddLoc()}
            placeholder="Nama lokasi proyek..."
            className="flex-1 bg-black/5 border border-black/10 rounded-[10px] px-3 py-2 text-xs text-[#1a1a1a] outline-none focus:border-primary transition-colors"
            maxLength={50}
          />
          <button onClick={handleAddLoc} className="bg-primary text-primary-text font-medium text-[11px] px-3.5 py-2 rounded-[10px] whitespace-nowrap">
            + Tambah
          </button>
        </div>
      </Overlay>

      {/* Profile Overlay */}
      <Overlay isOpen={isProfOpen} onClose={() => setIsProfOpen(false)} title="Profil">
        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-[46px] h-[46px] rounded-full bg-[#e8f5c8] border-[1.5px] border-[#78c80066] flex items-center justify-center text-sm font-medium text-[#4a8800] overflow-hidden font-mono shrink-0">
            {state.profile.avatar ? (
              <img src={state.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(profForm.name || state.profile.name)}</span>
            )}
          </div>
          <label className="flex-1 bg-black/5 border border-dashed border-black/15 rounded-[10px] p-2 text-[10px] text-black/40 cursor-pointer text-center uppercase tracking-wide">
            Upload Foto
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Nama</label>
          <input
            value={profForm.name}
            onChange={e => setProfForm({ ...profForm, name: capitalizeWords(e.target.value) })}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('prof-role-input')?.focus()}
            placeholder="Nama lengkap..."
            className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[9px] text-black/40 uppercase tracking-[1.5px]">Jabatan</label>
          <input
            id="prof-role-input"
            value={profForm.role}
            onChange={e => setProfForm({ ...profForm, role: capitalizeWords(e.target.value) })}
            onKeyDown={e => e.key === 'Enter' && handleSaveProf()}
            placeholder="Jabatan / posisi..."
            className="bg-black/5 border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-primary transition-colors"
          />
        </div>
        <button onClick={handleSaveProf} className="w-full bg-primary text-primary-text font-medium text-xs p-3 rounded-[10px]">
          Simpan Profil
        </button>
      </Overlay>
    </div>
  );
}

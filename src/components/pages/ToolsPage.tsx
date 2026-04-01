import React, { useState, useEffect, useRef } from 'react';
import { AppState, LocData } from '../../types';
import PageHeader from '../PageHeader';
import { Plus, Trash2, Sparkles, Loader2, X, ChevronDown, ChevronUp, Edit3, Send } from 'lucide-react';
import Overlay from '../Overlay';
import { capitalizeWords } from '../../utils';
import { GoogleGenAI, Type } from '@google/genai';
import Markdown from 'react-markdown';

interface ToolsPageProps {
  state: AppState;
  locData: LocData;
  updateLocData: (locId: string, updater: (prev: LocData) => LocData) => void;
  onBack: () => void;
}

type TabType = 'action' | 'volume' | 'beton' | 'iron' | 'aimaterial';

export default function ToolsPage({ state, locData, updateLocData, onBack }: ToolsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('action');
  const locName = state.locations.find(l => l.id === state.activeLoc)?.name || '—';

  return (
    <div className="flex flex-col h-full bg-bg">
      <PageHeader
        title="Tools"
        subtitle={locName}
        onBack={onBack}
      />
      
      <div className="flex gap-0.5 px-5 pt-2 border-b border-border shrink-0 overflow-x-auto hide-scrollbar">
        {[
          { id: 'action', label: 'Action Plan' },
          { id: 'aimaterial', label: 'AI Material Plan' },
          { id: 'volume', label: 'Volume' },
          { id: 'beton', label: 'Beton' },
          { id: 'iron', label: 'Iron Calc' }
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
        {activeTab === 'action' && <ActionPlanTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} />}
        {activeTab === 'aimaterial' && <AiMaterialPlanTab />}
        {activeTab === 'volume' && <VolumeTab />}
        {activeTab === 'beton' && <BetonTab />}
        {activeTab === 'iron' && <IronCalcTab locData={locData} updateLocData={updateLocData} locId={state.activeLoc} />}
      </div>
    </div>
  );
}

function ActionPlanTab({ locData, updateLocData, locId }: { locData: LocData, updateLocData: any, locId: string | null }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  
  const [materials, setMaterials] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [labor, setLabor] = useState('');
  const [targetDays, setTargetDays] = useState('');
  const [progress, setProgress] = useState('0');
  const [constraints, setConstraints] = useState('');
  const [sni, setSni] = useState('');
  const [taskDays, setTaskDays] = useState<number[]>([1]);

  const [matInput, setMatInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'item' | 'labor'>('item');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const pekerjaan = locData.pekerjaan || [];

  const handleAiAnalyze = async () => {
    if (!taskName.trim()) return alert('Isi nama pekerjaan dulu untuk dianalisis AI!');
    
    // @ts-ignore
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta.env.VITE_GEMINI_API_KEY as string);
    if (!apiKey) {
      alert('API Key tidak ditemukan. Jika Anda sudah mempublish aplikasi, pastikan GEMINI_API_KEY sudah diatur di environment variables atau pengaturan platform.');
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analisis pekerjaan konstruksi berikut: "${taskName}". Berikan daftar material yang dibutuhkan, alat yang dibutuhkan, tenaga kerja yang disarankan, estimasi target hari (angka saja). Untuk 'constraints', berikan analisis yang sangat komprehensif dan kompleks mengenai kemungkinan kendala di lapangan, risiko kegagalan, dan hal-hal krusial apa saja yang harus sangat diperhatikan (Quality Control & Safety). Berikan juga standar SNI yang berlaku.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materials: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar material" },
              tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar alat" },
              labor: { type: Type.STRING, description: "Saran tenaga kerja (misal: 1 Tukang Cat, 1 Kenek)" },
              targetDays: { type: Type.NUMBER, description: "Estimasi hari (angka)" },
              constraints: { type: Type.STRING, description: "Analisis komprehensif kendala dan hal yang harus diperhatikan" },
              sni: { type: Type.STRING, description: "Standar SNI yang berlaku" }
            }
          }
        }
      });

      let text = response.text || '{}';
      // Bersihkan markdown block jika ada
      text = text.replace(/^```json\n?/i, '').replace(/```$/i, '').trim();
      
      const data = JSON.parse(text);
      if (data.materials) setMaterials(data.materials);
      if (data.tools) setTools(data.tools);
      if (data.labor) setLabor(data.labor);
      if (data.targetDays) setTargetDays(data.targetDays.toString());
      if (data.constraints) setConstraints(data.constraints);
      if (data.sni) setSni(data.sni);
    } catch (error: any) {
      console.error('AI Error:', error);
      alert(`Gagal menganalisis dengan AI: ${error?.message || 'Error tidak diketahui'}. Pastikan API Key valid.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditTaskId(null);
    setTaskName('');
    setMaterials([]);
    setTools([]);
    setLabor('');
    setTargetDays('');
    setProgress('0');
    setConstraints('');
    setSni('');
    setTaskDays([1]);
    setMatInput('');
    setToolInput('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditTaskId(task.id);
    setTaskName(task.teks || '');
    setMaterials(task.materials || []);
    setTools(task.tools || []);
    setLabor(task.labor || '');
    setTargetDays(task.targetDays || '');
    setProgress(task.progress || '0');
    setConstraints(task.constraints || '');
    setSni(task.sni || '');
    setTaskDays(task.days || [task.day] || [1]);
    setMatInput('');
    setToolInput('');
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!taskName.trim()) return alert('Nama pekerjaan tidak boleh kosong!');
    if (locId) {
      updateLocData(locId, (prev: any) => {
        const newTask = { 
          id: editTaskId || `task_${Date.now()}`, 
          teks: taskName.trim(), 
          isDone: false,
          materials,
          tools,
          labor,
          targetDays,
          progress,
          constraints,
          sni,
          days: taskDays
        };

        let newPekerjaan = prev.pekerjaan || [];
        if (editTaskId) {
          newPekerjaan = newPekerjaan.map((p: any) => p.id === editTaskId ? newTask : p);
        } else {
          newPekerjaan = [newTask, ...newPekerjaan];
        }

        return { ...prev, pekerjaan: newPekerjaan };
      });
    }
    setIsFormOpen(false);
  };

  const toggleTaskDay = (taskId: string, day: number) => {
    if (locId) {
      updateLocData(locId, (prev: any) => ({
        ...prev,
        pekerjaan: (prev.pekerjaan || []).map((p: any) => {
          if (p.id === taskId) {
            const currentDays = p.days || [p.day] || [];
            const newDays = currentDays.includes(day)
              ? currentDays.filter((d: number) => d !== day)
              : [...currentDays, day].sort((a, b) => a - b);
            return { ...p, days: newDays };
          }
          return p;
        })
      }));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus pekerjaan ini?')) {
      if (locId) {
        updateLocData(locId, (prev: any) => ({
          ...prev,
          pekerjaan: (prev.pekerjaan || []).filter((p: any) => p.id !== id)
        }));
      }
    }
  };

  const addMaterial = () => {
    if (matInput.trim()) {
      setMaterials([...materials, capitalizeWords(matInput.trim())]);
      setMatInput('');
    }
  };

  const addTool = () => {
    if (toolInput.trim()) {
      setTools([...tools, capitalizeWords(toolInput.trim())]);
      setToolInput('');
    }
  };

  const sortedPekerjaan = [...pekerjaan].sort((a, b) => {
    if (viewMode === 'labor') {
      return (a.labor || 'ZZZ').localeCompare(b.labor || 'ZZZ');
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-3">
      <button onClick={handleOpenAdd} className="w-full bg-primary text-primary-text font-medium text-xs p-2.5 rounded-lg flex items-center justify-center gap-1.5">
        <Plus size={14} /> Tambah Pekerjaan
      </button>

      <div className="flex bg-text/5 p-1 rounded-lg mt-1">
        <button onClick={() => setViewMode('item')} className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${viewMode === 'item' ? 'bg-card shadow-sm text-text' : 'text-text/40'}`}>Berdasarkan Item</button>
        <button onClick={() => setViewMode('labor')} className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${viewMode === 'labor' ? 'bg-card shadow-sm text-text' : 'text-text/40'}`}>Berdasarkan Tukang</button>
      </div>
      
      <div className="flex flex-col gap-2.5 mt-1">
        {sortedPekerjaan.length === 0 ? (
          <div className="text-[11px] text-text/25 text-center py-6">Belum ada action plan.</div>
        ) : (
          sortedPekerjaan.map((p: any) => {
            const primaryText = viewMode === 'item' ? p.teks : (p.labor || 'Tanpa Tukang');
            const secondaryText = viewMode === 'item' ? (p.labor || 'Tanpa Tukang') : p.teks;
            const isExpanded = expandedId === p.id;
            const activeDays = p.days || [p.day] || [];

            return (
              <div key={p.id} className="bg-card border border-border shadow-sm rounded-[10px] overflow-hidden">
                <div onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-3 flex justify-between items-center cursor-pointer hover:bg-text/5 transition-colors">
                  <div className="flex-1 pr-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-sm font-bold text-text leading-tight">{primaryText}</div>
                      
                      {/* Small 7-day bar in thumbnail */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <div 
                            key={d} 
                            className={`w-2.5 h-1 rounded-full ${activeDays.includes(d) ? 'bg-primary' : 'bg-text/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] text-text/50 mt-1.5">{secondaryText}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-xs font-bold text-primary-text bg-primary/20 px-2 py-1 rounded-md">{p.progress || 0}%</div>
                    {isExpanded ? <ChevronUp size={16} className="text-text/40" /> : <ChevronDown size={16} className="text-text/40" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-border flex flex-col gap-3 bg-text/[0.02]">
                    {/* Large interactive 7-day bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[9px] font-bold text-text/40 uppercase tracking-wider">Timeline (Tap hari untuk aktifkan)</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <button
                            key={d}
                            onClick={(e) => { e.stopPropagation(); toggleTaskDay(p.id, d); }}
                            className={`flex-1 h-7 rounded-md text-[10px] font-bold transition-all ${
                              activeDays.includes(d) 
                                ? 'bg-primary text-primary-text shadow-sm' 
                                : 'bg-text/5 text-text/30 border border-border'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {p.materials?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-text/40 uppercase tracking-wider mb-1.5">Material</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.materials.map((m: string, i: number) => (
                            <span key={i} className="bg-green-500/10 text-green-700 text-[10px] px-2 py-1 rounded-md border border-green-500/20">{m}</span>
                          ))}
                        </div>
                        <div className="h-[1px] w-full bg-[#25D366] mt-3 opacity-40"></div>
                      </div>
                    )}
                    
                    {p.tools?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-text/40 uppercase tracking-wider mb-1.5">Alat</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.tools.map((t: string, i: number) => (
                            <span key={i} className="bg-green-500/10 text-green-700 text-[10px] px-2 py-1 rounded-md border border-green-500/20">{t}</span>
                          ))}
                        </div>
                        <div className="h-[1px] w-full bg-[#25D366] mt-3 opacity-40"></div>
                      </div>
                    )}

                    {p.constraints && (
                      <div>
                        <div className="text-[10px] font-bold text-text/40 uppercase tracking-wider mb-1">Kemungkinan Kendala & Perhatian</div>
                        <div className="text-[11px] text-text/70 leading-relaxed whitespace-pre-wrap">{p.constraints}</div>
                      </div>
                    )}

                    {p.sni && (
                      <div>
                        <div className="text-[10px] font-bold text-text/40 uppercase tracking-wider mb-1">Standar SNI</div>
                        <div className="text-[11px] text-text/70 leading-relaxed whitespace-pre-wrap">{p.sni}</div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border">
                      <button onClick={() => handleOpenEdit(p)} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-medium transition-colors hover:bg-blue-100">
                        <Edit3 size={12} /> Edit Keterangan
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-md font-medium transition-colors hover:bg-red-100">
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Overlay isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editTaskId ? "Edit Pekerjaan" : "Tambah Action Plan"}>
        <div className="flex flex-col gap-3.5 pb-6">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Nama Pekerjaan</label>
            <div className="flex gap-2">
              <input
                autoFocus
                value={taskName}
                onChange={e => setTaskName(capitalizeWords(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('mat-input')?.focus(); } }}
                placeholder="contoh: Pengecatan Lt.1"
                className="flex-1 bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
              />
              <button 
                onClick={handleAiAnalyze} 
                disabled={isAiLoading || !taskName.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-[10px] px-3 flex items-center justify-center disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </button>
            </div>
            <p className="text-[8px] text-text/30 mt-0.5 italic">
              *Fitur AI memerlukan GEMINI_API_KEY di environment variables setelah dipublish.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Material — pilih AI atau ketik</label>
            <div className="flex gap-2">
              <input
                id="mat-input"
                value={matInput}
                onChange={e => setMatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMaterial(); } }}
                placeholder="Ketik material..."
                className="flex-1 bg-text/5 border border-border rounded-[10px] px-3 py-2 text-xs text-text outline-none focus:border-primary"
              />
              <button onClick={addMaterial} className="bg-text/5 border border-border rounded-[10px] px-3 flex items-center justify-center text-text/50 hover:bg-text/10">
                <Plus size={16} />
              </button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {materials.map((m, i) => (
                  <div key={i} className="bg-primary/20 text-primary-text text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                    {m} <button onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Alat — pilih AI atau ketik</label>
            <div className="flex gap-2">
              <input
                id="tool-input"
                value={toolInput}
                onChange={e => setToolInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTool(); } }}
                placeholder="Ketik alat..."
                className="flex-1 bg-text/5 border border-border rounded-[10px] px-3 py-2 text-xs text-text outline-none focus:border-primary"
              />
              <button onClick={addTool} className="bg-text/5 border border-border rounded-[10px] px-3 flex items-center justify-center text-text/50 hover:bg-text/10">
                <Plus size={16} />
              </button>
            </div>
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tools.map((t, i) => (
                  <div key={i} className="bg-primary/20 text-primary-text text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                    {t} <button onClick={() => setTools(tools.filter((_, idx) => idx !== i))}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Tukang / Tenaga</label>
            <input
              value={labor}
              onChange={e => setLabor(capitalizeWords(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('target-hari')?.focus(); } }}
              placeholder="Mandor, Buruh, Sub-kon..."
              className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Target Hari</label>
              <input
                id="target-hari"
                type="number"
                value={targetDays}
                onChange={e => setTargetDays(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('progress-input')?.focus(); } }}
                placeholder="0"
                className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Progress (%)</label>
              <input
                id="progress-input"
                type="number"
                value={progress}
                onChange={e => setProgress(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                placeholder="0"
                className="bg-text/5 border border-border rounded-[10px] px-3 py-2.5 text-xs text-text outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1.5px]">Pilih Hari (1-7)</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    const newDays = taskDays.includes(d)
                      ? taskDays.filter(day => day !== d)
                      : [...taskDays, d].sort((a, b) => a - b);
                    setTaskDays(newDays);
                  }}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                    taskDays.includes(d) 
                      ? 'bg-primary text-primary-text shadow-sm' 
                      : 'bg-text/5 text-text/40 border border-border'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {(constraints || sni) && (
            <div className="bg-blue-50 border border-blue-100 rounded-[10px] p-3 flex flex-col gap-2 mt-1">
              {constraints && (
                <div>
                  <div className="text-[9px] font-bold text-blue-800 uppercase tracking-[1px] mb-0.5">Potensi Kendala</div>
                  <div className="text-[10px] text-blue-900 leading-relaxed">{constraints}</div>
                </div>
              )}
              {sni && (
                <div>
                  <div className="text-[9px] font-bold text-blue-800 uppercase tracking-[1px] mb-0.5">Standar SNI</div>
                  <div className="text-[10px] text-blue-900 leading-relaxed">{sni}</div>
                </div>
              )}
            </div>
          )}

          <button onClick={handleSave} className="w-full bg-primary text-primary-text font-medium text-[13px] p-3 rounded-[10px] mt-2">
            Simpan Pekerjaan
          </button>
        </div>
      </Overlay>
    </div>
  );
}

function VolumeTab() {
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [kp, setKp] = useState('');
  const [kl, setKl] = useState('');
  const [kt, setKt] = useState('');
  const [rp, setRp] = useState('');
  const [rl, setRl] = useState('');
  const [rt, setRt] = useState('');

  const luas = (parseFloat(p) || 0) * (parseFloat(l) || 0);
  const kubik = (parseFloat(kp) || 0) * (parseFloat(kl) || 0) * (parseFloat(kt) || 0);
  const keliling = 2 * ((parseFloat(rp) || 0) + (parseFloat(rl) || 0));
  const luasDinding = keliling * (parseFloat(rt) || 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="p-3.5 border-b border-border">
        <div className="text-[9px] font-semibold text-text/35 uppercase tracking-[1.2px] mb-2.5">Luas Persegi</div>
        <div className="flex gap-2.5 items-end">
          <div className="flex-1">
            <div className="text-[9px] text-text/40 mb-1">Panjang (m)</div>
            <input id="vol-p" type="number" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-l')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="text-[13px] text-text/30 pb-2.5">×</div>
          <div className="flex-1">
            <div className="text-[9px] text-text/40 mb-1">Lebar (m)</div>
            <input id="vol-l" type="number" value={l} onChange={e => setL(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-kp')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="text-[13px] text-text/30 pb-2.5">=</div>
          <div className="flex-1 bg-primary/10 p-2 text-center rounded">
            <div className="text-[9px] text-text/40">Luas</div>
            <div className="text-base font-bold text-primary-text font-mono">{luas.toFixed(2)}</div>
            <div className="text-[9px] text-text/40">m²</div>
          </div>
        </div>
      </div>

      <div className="p-3.5 border-b border-border">
        <div className="text-[9px] font-semibold text-text/35 uppercase tracking-[1.2px] mb-2.5">Volume Kubik</div>
        <div className="flex gap-1.5 items-end">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-text/40 mb-1">P (m)</div>
            <input id="vol-kp" type="number" value={kp} onChange={e => setKp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-kl')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="text-[13px] text-text/30 pb-2.5">×</div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-text/40 mb-1">L (m)</div>
            <input id="vol-kl" type="number" value={kl} onChange={e => setKl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-kt')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="text-[13px] text-text/30 pb-2.5">×</div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-text/40 mb-1">T (m)</div>
            <input id="vol-kt" type="number" value={kt} onChange={e => setKt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-rp')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="text-[13px] text-text/30 pb-2.5">=</div>
          <div className="flex-1 min-w-0 bg-primary/10 p-2 text-center rounded">
            <div className="text-[9px] text-text/40">Vol</div>
            <div className="text-base font-bold text-primary-text font-mono">{kubik.toFixed(3)}</div>
            <div className="text-[9px] text-text/40">m³</div>
          </div>
        </div>
      </div>

      <div className="p-3.5">
        <div className="text-[9px] font-semibold text-text/35 uppercase tracking-[1.2px] mb-2.5">Keliling & Luas Dinding</div>
        <div className="flex gap-1.5 mb-2.5">
          <div className="flex-1">
            <div className="text-[9px] text-text/40 mb-1">P (m)</div>
            <input id="vol-rp" type="number" value={rp} onChange={e => setRp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-rl')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-text/40 mb-1">L (m)</div>
            <input id="vol-rl" type="number" value={rl} onChange={e => setRl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('vol-rt')?.focus(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-text/40 mb-1">T (m)</div>
            <input id="vol-rt" type="number" value={rt} onChange={e => setRt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} placeholder="0" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/10 p-2.5 text-center rounded">
            <div className="text-[9px] text-text/40 mb-0.5">Keliling</div>
            <div className="text-lg font-bold text-primary-text font-mono">{keliling.toFixed(2)}</div>
            <div className="text-[9px] text-text/40">m</div>
          </div>
          <div className="bg-primary/10 p-2.5 text-center rounded">
            <div className="text-[9px] text-text/40 mb-0.5">Luas Dinding</div>
            <div className="text-lg font-bold text-primary-text font-mono">{luasDinding.toFixed(2)}</div>
            <div className="text-[9px] text-text/40">m²</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BetonTab() {
  const [jenis, setJenis] = useState('beton_k175');
  const [vol, setVol] = useState('2.5');

  const BETON_RASIO: Record<string, any> = {
    beton_k100: { semen: 1, pasir: 3, kerikil: 5, air: 0.5, nama: 'Beton K-100 (1:3:5)' },
    beton_k175: { semen: 1, pasir: 2, kerikil: 3, air: 0.5, nama: 'Beton K-175 (1:2:3)' },
    beton_k225: { semen: 1, pasir: 1.5, kerikil: 2.5, air: 0.4, nama: 'Beton K-225 (1:1.5:2.5)' },
    beton_k300: { semen: 1, pasir: 1, kerikil: 2, air: 0.4, nama: 'Beton K-300 (1:1:2)' },
    mortar_12: { semen: 1, pasir: 2, air: 0.5, nama: 'Mortar 1:2' },
    mortar_13: { semen: 1, pasir: 3, air: 0.5, nama: 'Mortar 1:3' },
    mortar_15: { semen: 1, pasir: 5, air: 0.6, nama: 'Mortar 1:5' },
    mortar_16: { semen: 1, pasir: 6, air: 0.7, nama: 'Mortar 1:6' },
  };

  const r = BETON_RASIO[jenis];
  const v = parseFloat(vol) || 0;
  
  let hasil = null;
  if (r && v > 0) {
    const total = r.semen + (r.pasir || 0) + (r.kerikil || 0);
    const faktorSusut = 1.3;
    const volBruto = v * faktorSusut;
    const SEMEN_ZAK_M3 = 0.028;
    const PASIR_BERAT_M3 = 1400;

    const volSemen = (r.semen / total) * volBruto;
    const zakSemen = Math.ceil(volSemen / SEMEN_ZAK_M3);
    const volPasir = (r.pasir / total) * volBruto;
    const volKerikil = r.kerikil ? (r.kerikil / total) * volBruto : 0;
    const volAir = v * r.air * 1000;

    hasil = [
      { label: 'Semen', val: `${zakSemen} zak`, sub: `${zakSemen * 40} kg` },
      { label: 'Pasir', val: `${volPasir.toFixed(2)} m³`, sub: `${Math.ceil(volPasir * PASIR_BERAT_M3)} kg` },
      ...(volKerikil ? [{ label: 'Kerikil / Split', val: `${volKerikil.toFixed(2)} m³`, sub: `${Math.ceil(volKerikil * 1600)} kg` }] : []),
      { label: 'Air', val: `${volAir.toFixed(0)} liter`, sub: '' },
    ];
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="p-3.5 border-b border-border">
        <div className="text-[9px] font-semibold text-text/35 uppercase tracking-[1.2px] mb-2">Jenis Campuran</div>
        <select id="beton-jenis" value={jenis} onChange={e => setJenis(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('beton-vol')?.focus(); } }} className="w-full bg-text/5 border border-border rounded px-2 py-2 text-xs outline-none focus:border-primary mb-3">
          <optgroup label="BETON">
            <option value="beton_k100">Beton K-100 (1:3:5)</option>
            <option value="beton_k175">Beton K-175 (1:2:3)</option>
            <option value="beton_k225">Beton K-225 (1:1.5:2.5)</option>
            <option value="beton_k300">Beton K-300 (1:1:2)</option>
          </optgroup>
          <optgroup label="MORTAR">
            <option value="mortar_12">Mortar 1:2</option>
            <option value="mortar_13">Mortar 1:3</option>
            <option value="mortar_15">Mortar 1:5</option>
            <option value="mortar_16">Mortar 1:6</option>
          </optgroup>
        </select>
        <div className="text-[9px] text-text/40 mb-1">Volume (m³)</div>
        <input id="beton-vol" type="number" value={vol} onChange={e => setVol(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} placeholder="2.5" className="w-full bg-text/5 border border-border rounded px-2 py-2 text-xs outline-none focus:border-primary" />
      </div>
      
      {r && (
        <div className="px-3.5 py-2.5 text-[10px] text-text/40">
          <b>{r.nama}</b><br/>
          Rasio: {r.semen} Semen : {r.pasir} Pasir{r.kerikil ? ` : ${r.kerikil} Kerikil` : ''}
        </div>
      )}

      {hasil && (
        <div>
          <div className="px-3.5 py-2 bg-primary/10 border-y border-border">
            <div className="text-[9px] font-semibold text-text/40 uppercase tracking-[1px]">Kebutuhan Material</div>
          </div>
          {hasil.map((row, i) => (
            <div key={i} className={`flex justify-between items-center px-3.5 py-2.5 ${i < hasil.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="text-xs text-text">{row.label}</span>
              <div className="text-right">
                <div className="text-sm font-bold text-primary-text font-mono">{row.val}</div>
                {row.sub && <div className="text-[9px] text-text/40">{row.sub}</div>}
              </div>
            </div>
          ))}
          <div className="px-3.5 py-2 text-[9px] text-text/35 border-t border-border">
            *Faktor susut 30% sudah termasuk. Volume bersih: {v.toFixed(2)} m³
          </div>
        </div>
      )}
    </div>
  );
}



function IronCalcTab({ locData, updateLocData, locId }: { locData: LocData, updateLocData: any, locId: string | null }) {
  const [tipe, setTipe] = useState('Balok');
  const [b, setB] = useState('200'); // mm
  const [h, setH] = useState('300'); // mm
  const [L, setL] = useState('4'); // m
  const [cover, setCover] = useState('25'); // mm
  const [mutuBeton, setMutuBeton] = useState('fc 20');

  const [top1Count, setTop1Count] = useState('3');
  const [top1Dia, setTop1Dia] = useState('12');
  const [top1Type, setTop1Type] = useState('D');
  const [top2Count, setTop2Count] = useState('');
  const [top2Dia, setTop2Dia] = useState('10');
  const [top2Type, setTop2Type] = useState('D');
  
  const [waist1Count, setWaist1Count] = useState('2');
  const [waist1Dia, setWaist1Dia] = useState('10');
  const [waist1Type, setWaist1Type] = useState('D');
  const [waist2Count, setWaist2Count] = useState('');
  const [waist2Dia, setWaist2Dia] = useState('8');
  const [waist2Type, setWaist2Type] = useState('D');
  
  const [bot1Count, setBot1Count] = useState('3');
  const [bot1Dia, setBot1Dia] = useState('12');
  const [bot1Type, setBot1Type] = useState('D');
  const [bot2Count, setBot2Count] = useState('');
  const [bot2Dia, setBot2Dia] = useState('10');
  const [bot2Type, setBot2Type] = useState('D');

  const [begelDia, setBegelDia] = useState('8');
  const [begelType, setBegelType] = useState('Ø');
  const [jarakTumpuan, setJarakTumpuan] = useState('100'); // mm
  const [jarakLapangan, setJarakLapangan] = useState('150'); // mm

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Calculations
  const b_mm = parseFloat(b) || 0;
  const h_mm = parseFloat(h) || 0;
  const L_m = parseFloat(L) || 0;
  const c_mm = parseFloat(cover) || 0;

  const t1C = parseInt(top1Count) || 0;
  const t1D = parseFloat(top1Dia) || 0;
  const t2C = parseInt(top2Count) || 0;
  const t2D = parseFloat(top2Dia) || 0;
  
  const w1C = parseInt(waist1Count) || 0;
  const w1D = parseFloat(waist1Dia) || 0;
  const w2C = parseInt(waist2Count) || 0;
  const w2D = parseFloat(waist2Dia) || 0;
  
  const b1C = parseInt(bot1Count) || 0;
  const b1D = parseFloat(bot1Dia) || 0;
  const b2C = parseInt(bot2Count) || 0;
  const b2D = parseFloat(bot2Dia) || 0;
  
  const bgDia = parseFloat(begelDia) || 0;
  const jTumpuan = parseFloat(jarakTumpuan) || 0;
  const jLapangan = parseFloat(jarakLapangan) || 0;

  const L_mm = L_m * 1000;
  const lenTumpuan = L_mm / 2;
  const lenLapangan = L_mm / 2;
  
  const numBegelTumpuan = jTumpuan > 0 ? Math.ceil(lenTumpuan / jTumpuan) : 0;
  const numBegelLapangan = jLapangan > 0 ? Math.ceil(lenLapangan / jLapangan) : 0;
  const totalBegel = numBegelTumpuan + numBegelLapangan;

  const begelWidth = Math.max(0, b_mm - 2 * c_mm);
  const begelHeight = Math.max(0, h_mm - 2 * c_mm);
  const hookLength = Math.max(6 * bgDia, 50);
  const lenOneBegel = 2 * begelWidth + 2 * begelHeight + 2 * hookLength;
  const totalLenBegel = (totalBegel * lenOneBegel) / 1000;

  const anchorage = 0.4;
  const lenTop1 = t1C * (L_m + anchorage);
  const lenTop2 = t2C * (L_m + anchorage);
  const lenWaist1 = w1C * L_m;
  const lenWaist2 = w2C * L_m;
  const lenBot1 = b1C * (L_m + anchorage);
  const lenBot2 = b2C * (L_m + anchorage);

  const getWeight = (dia: number, len: number) => (0.006165 * dia * dia) * len;

  const wTop1 = getWeight(t1D, lenTop1);
  const wTop2 = getWeight(t2D, lenTop2);
  const wWaist1 = getWeight(w1D, lenWaist1);
  const wWaist2 = getWeight(w2D, lenWaist2);
  const wBot1 = getWeight(b1D, lenBot1);
  const wBot2 = getWeight(b2D, lenBot2);
  const wBegel = getWeight(bgDia, totalLenBegel);

  const totalWeight = wTop1 + wTop2 + wWaist1 + wWaist2 + wBot1 + wBot2 + wBegel;

  const rebarSummary: Record<string, { len: number, weight: number }> = {};
  const addRebar = (type: string, dia: number, len: number, weight: number) => {
    if (dia === 0 || len === 0) return;
    const key = `${type}${dia}`;
    if (!rebarSummary[key]) rebarSummary[key] = { len: 0, weight: 0 };
    rebarSummary[key].len += len;
    rebarSummary[key].weight += weight;
  };

  addRebar(top1Type, t1D, lenTop1, wTop1);
  addRebar(top2Type, t2D, lenTop2, wTop2);
  addRebar(waist1Type, w1D, lenWaist1, wWaist1);
  addRebar(waist2Type, w2D, lenWaist2, wWaist2);
  addRebar(bot1Type, b1D, lenBot1, wBot1);
  addRebar(bot2Type, b2D, lenBot2, wBot2);
  addRebar(begelType, bgDia, totalLenBegel, wBegel);

  const totalBars = Object.values(rebarSummary).reduce((sum, data) => sum + Math.ceil(data.len / 12), 0);

  const svgW = 240;
  const svgH = 240;
  const margin = 30;
  const drawW = svgW - 2 * margin;
  const drawH = svgH - 2 * margin;
  
  const maxDim = Math.max(b_mm, h_mm);
  const scale = maxDim > 0 ? Math.min(drawW / b_mm, drawH / h_mm) : 1;
  
  const rectW = b_mm * scale;
  const rectH = h_mm * scale;
  const startX = (svgW - rectW) / 2;
  const startY = (svgH - rectH) / 2;
  
  const innerX = startX + c_mm * scale;
  const innerY = startY + c_mm * scale;
  const innerW = Math.max(0, rectW - 2 * c_mm * scale);
  const innerH = Math.max(0, rectH - 2 * c_mm * scale);

  const handleSave = () => {
    const name = prompt("Masukkan nama perhitungan (misal: Balok B1 Lantai 2):");
    if (!name) return;
    const calcData = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      form: {
        tipe, b, h, L, cover, mutuBeton,
        top1Count, top1Dia, top1Type, top2Count, top2Dia, top2Type,
        waist1Count, waist1Dia, waist1Type, waist2Count, waist2Dia, waist2Type,
        bot1Count, bot1Dia, bot1Type, bot2Count, bot2Dia, bot2Type,
        begelDia, begelType, jarakTumpuan, jarakLapangan
      },
      totalWeight,
      totalBars,
      rebarSummary
    };
    if (locId) {
      updateLocData(locId, (prev: any) => ({
        ...prev,
        ironCalcs: [calcData, ...(prev.ironCalcs || [])]
      }));
      alert("Perhitungan tersimpan!");
    }
  };

  const handleLoad = (calc: any) => {
    const f = calc.form;
    setTipe(f.tipe); setB(f.b); setH(f.h); setL(f.L); setCover(f.cover); setMutuBeton(f.mutuBeton);
    setTop1Count(f.top1Count); setTop1Dia(f.top1Dia); setTop1Type(f.top1Type || 'D');
    setTop2Count(f.top2Count); setTop2Dia(f.top2Dia); setTop2Type(f.top2Type || 'D');
    setWaist1Count(f.waist1Count); setWaist1Dia(f.waist1Dia); setWaist1Type(f.waist1Type || 'D');
    setWaist2Count(f.waist2Count); setWaist2Dia(f.waist2Dia); setWaist2Type(f.waist2Type || 'D');
    setBot1Count(f.bot1Count); setBot1Dia(f.bot1Dia); setBot1Type(f.bot1Type || 'D');
    setBot2Count(f.bot2Count); setBot2Dia(f.bot2Dia); setBot2Type(f.bot2Type || 'D');
    setBegelDia(f.begelDia); setBegelType(f.begelType || 'Ø'); setJarakTumpuan(f.jarakTumpuan); setJarakLapangan(f.jarakLapangan);
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus riwayat ini?")) {
      if (locId) {
        updateLocData(locId, (prev: any) => ({
          ...prev,
          ironCalcs: (prev.ironCalcs || []).filter((c: any) => c.id !== id)
        }));
      }
    }
  };

  const historyList = locData?.ironCalcs || [];

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 bg-primary/20 text-primary-dark font-medium text-xs py-2 rounded-lg hover:bg-primary/30 transition-colors">Simpan Perhitungan</button>
        <button onClick={() => setIsHistoryOpen(true)} className="flex-1 bg-text/5 text-text font-medium text-xs py-2 rounded-lg hover:bg-text/10 transition-colors">List Elemen ({historyList.length})</button>
      </div>

      {/* Inputs Section */}
      <div className="border border-border rounded-lg p-3.5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Tipe Elemen</label>
            <select value={tipe} onChange={e => setTipe(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary">
              <option>Slof</option>
              <option>Kolom</option>
              <option>Balok</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Mutu Beton</label>
            <input value={mutuBeton} onChange={e => setMutuBeton(e.target.value)} placeholder="fc 20" className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Lebar (b) mm</label>
            <input type="number" value={b} onChange={e => setB(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Tinggi (h) mm</label>
            <input type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Panjang (L) m</label>
            <input type="number" value={L} onChange={e => setL(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-text/40 uppercase tracking-[1px] mb-1 block">Selimut Beton (mm)</label>
            <input type="number" value={cover} onChange={e => setCover(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Tulangan Utama */}
      <div className="border border-border rounded-lg p-3.5 flex flex-col gap-4">
        <div className="text-[10px] font-bold text-text/60 uppercase tracking-[1px]">Tulangan Utama</div>
        
        {/* Atas */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-text/60">Atas</div>
          <div className="flex items-center gap-2">
            <input type="number" value={top1Count} onChange={e => setTop1Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setTop1Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{top1Type}</button>
            <input type="number" value={top1Dia} onChange={e => setTop1Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia (mm)" />
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={top2Count} onChange={e => setTop2Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setTop2Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{top2Type}</button>
            <input type="number" value={top2Dia} onChange={e => setTop2Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia Ekstra (mm)" />
          </div>
        </div>

        {/* Pinggang */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-text/60">Pinggang</div>
          <div className="flex items-center gap-2">
            <input type="number" value={waist1Count} onChange={e => setWaist1Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setWaist1Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{waist1Type}</button>
            <input type="number" value={waist1Dia} onChange={e => setWaist1Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia (mm)" />
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={waist2Count} onChange={e => setWaist2Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setWaist2Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{waist2Type}</button>
            <input type="number" value={waist2Dia} onChange={e => setWaist2Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia Ekstra (mm)" />
          </div>
        </div>

        {/* Bawah */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-text/60">Bawah</div>
          <div className="flex items-center gap-2">
            <input type="number" value={bot1Count} onChange={e => setBot1Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setBot1Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{bot1Type}</button>
            <input type="number" value={bot1Dia} onChange={e => setBot1Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia (mm)" />
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={bot2Count} onChange={e => setBot2Count(e.target.value)} className="w-16 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary text-center" placeholder="Jml" />
            <span className="text-[10px] text-text/40">btg</span>
            <button onClick={() => setBot2Type(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark ml-1 w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{bot2Type}</button>
            <input type="number" value={bot2Dia} onChange={e => setBot2Dia(e.target.value)} className="flex-1 bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Dia Ekstra (mm)" />
          </div>
        </div>
      </div>

      {/* Begel */}
      <div className="border border-border rounded-lg p-3.5 flex flex-col gap-3">
        <div className="text-[10px] font-bold text-text/60 uppercase tracking-[1px]">Begel / Sengkang</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-text/40 mb-1 block">Diameter (mm)</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setBegelType(t => t === 'D' ? 'Ø' : 'D')} className="font-bold text-primary-dark w-6 h-6 flex items-center justify-center rounded hover:bg-text/5 transition-colors">{begelType}</button>
              <input type="number" value={begelDia} onChange={e => setBegelDia(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-[9px] text-text/40 mb-1 block">Jrk Tumpuan (mm)</label>
            <input type="number" value={jarakTumpuan} onChange={e => setJarakTumpuan(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary mt-1" />
          </div>
          <div>
            <label className="text-[9px] text-text/40 mb-1 block">Jrk Lapangan (mm)</label>
            <input type="number" value={jarakLapangan} onChange={e => setJarakLapangan(e.target.value)} className="w-full bg-text/5 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary mt-1" />
          </div>
        </div>
        <div className="text-[9px] text-text/40 mt-1">
          *Tumpuan dihitung 1/4 bentang di kedua ujung (total 1/2 L). Lapangan di tengah (1/2 L).
        </div>
      </div>

      {/* Sketch */}
      <div className="border border-border rounded-lg p-3.5 flex flex-col items-center bg-text/[0.02]">
        <div className="text-[10px] font-bold text-text/60 uppercase tracking-[1px] mb-4 w-full text-left">Sketsa Penampang</div>
        <svg width={svgW} height={svgH} className="bg-card border border-border rounded shadow-sm">
          {/* Concrete */}
          <rect x={startX} y={startY} width={rectW} height={rectH} fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
          {/* Stirrup */}
          <rect x={innerX} y={innerY} width={innerW} height={innerH} fill="none" stroke="#3b82f6" strokeWidth="3" rx="4" />
          {/* Top Rebars */}
          {(() => {
            const topRebars = [...Array(t1C).fill(t1D), ...Array(t2C).fill(t2D)];
            return topRebars.map((dia, i) => {
              const cx = topRebars.length === 1 ? innerX + innerW/2 : innerX + (i * innerW / (topRebars.length - 1));
              return <circle key={`t-${i}`} cx={cx} cy={innerY} r={Math.max(3, dia/2 * scale)} fill="#ef4444" />
            });
          })()}
          {/* Bottom Rebars */}
          {(() => {
            const botRebars = [...Array(b1C).fill(b1D), ...Array(b2C).fill(b2D)];
            return botRebars.map((dia, i) => {
              const cx = botRebars.length === 1 ? innerX + innerW/2 : innerX + (i * innerW / (botRebars.length - 1));
              return <circle key={`b-${i}`} cx={cx} cy={innerY + innerH} r={Math.max(3, dia/2 * scale)} fill="#ef4444" />
            });
          })()}
          {/* Waist Rebars */}
          {(() => {
            const waistRebars = [...Array(w1C).fill(w1D), ...Array(w2C).fill(w2D)];
            const wCountTotal = waistRebars.length;
            if (wCountTotal === 0) return null;
            
            return waistRebars.map((dia, i) => {
              const pairs = Math.floor(wCountTotal / 2);
              const isLeft = i % 2 === 0;
              const pairIdx = Math.floor(i / 2);
              
              if (wCountTotal % 2 !== 0 && i === wCountTotal - 1) {
                 return <circle key={`w-mid`} cx={innerX + innerW/2} cy={innerY + innerH/2} r={Math.max(3, dia/2 * scale)} fill="#f59e0b" />
              }

              const cy = pairs === 1 ? innerY + innerH/2 : innerY + ((pairIdx + 1) * innerH / (pairs + 1));
              const cx = isLeft ? innerX : innerX + innerW;
              return <circle key={`w-${i}`} cx={cx} cy={cy} r={Math.max(3, dia/2 * scale)} fill="#f59e0b" />
            });
          })()}
          
          {/* Dimensions */}
          <text x={startX + rectW/2} y={startY - 8} fontSize="10" textAnchor="middle" fill="#6b7280">{b_mm} mm</text>
          <text x={startX - 8} y={startY + rectH/2} fontSize="10" textAnchor="middle" fill="#6b7280" transform={`rotate(-90, ${startX - 8}, ${startY + rectH/2})`}>{h_mm} mm</text>
        </svg>
      </div>

      {/* Results */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 p-3.5 border-b border-border">
          <div className="text-[10px] font-bold text-text/60 uppercase tracking-[1px] mb-1">Total Kebutuhan Besi</div>
          <div className="text-2xl font-bold text-primary-text font-mono">{totalWeight.toFixed(2)} <span className="text-sm font-normal">kg</span></div>
        </div>
        <div className="p-3.5 flex flex-col gap-2">
          {Object.entries(rebarSummary).map(([dia, data]) => {
            const bars = Math.ceil(data.len / 12);
            return (
              <div key={dia} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                <div className="font-bold text-sm">{dia}</div>
                <div className="text-right">
                  <div className="text-xs font-bold text-text">{bars} batang <span className="text-[10px] font-normal text-text/50">(12m)</span></div>
                  <div className="text-[10px] text-text/50">{data.weight.toFixed(2)} kg • {data.len.toFixed(2)} m</div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-[9px] text-text/40">
            *Estimasi berat menggunakan rumus 0.006165 × d². Panjang batang standar 12m. Sudah termasuk estimasi panjang kait/jangkar.
          </div>
        </div>
      </div>

      <Overlay isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="List Elemen Tersimpan">
        <div className="flex flex-col gap-3 pb-6">
          {historyList.length === 0 ? (
            <div className="text-xs text-text/40 text-center py-6">Belum ada elemen tersimpan.</div>
          ) : (
            historyList.map((calc: any) => (
              <div key={calc.id} onClick={() => handleLoad(calc)} className="bg-card border border-border rounded-xl p-3.5 flex flex-col gap-2 cursor-pointer hover:bg-text/5 transition-colors shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold text-text">{calc.name}</div>
                    <div className="text-[10px] text-text/40 mt-0.5">
                      {new Date(calc.date).toLocaleDateString('id-ID')} • {calc.form.tipe} ({calc.form.b}x{calc.form.h} mm) • L: {calc.form.L}m
                    </div>
                  </div>
                  <button onClick={(e) => handleDeleteHistory(calc.id, e)} className="text-text/20 hover:text-red-500 p-1 -mr-1 -mt-1"><Trash2 size={16} /></button>
                </div>
                
                {calc.rebarSummary && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex flex-col gap-1.5 mt-1">
                    <div className="text-[9px] font-bold text-primary-dark/60 uppercase tracking-wider mb-0.5">Rincian Kebutuhan Besi:</div>
                    {Object.entries(calc.rebarSummary).map(([dia, data]: [string, any]) => (
                      <div key={dia} className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-text">{dia}</span>
                        <div className="text-right">
                          <span className="font-bold text-primary-dark">{Math.ceil(data.len / 12)} btg</span>
                          <span className="text-text/40 ml-1">({data.weight.toFixed(1)} kg)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-text/40 uppercase tracking-wider">Total Keseluruhan</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-primary-dark">{calc.totalBars ? `${calc.totalBars} btg` : '-'}</span>
                    <span className="text-[10px] font-bold text-text/40 ml-1.5">({calc.totalWeight.toFixed(1)} kg)</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Overlay>

    </div>
  );
}

interface HistoryTag {
  label: string;
  value: string;
  color: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  material: string;
  dimensions: string;
  tags: HistoryTag[];
  suggestions: string[];
  expanded: boolean;
}

function AiMaterialPlanTab() {
  const [calcType, setCalcType] = useState<'M1' | 'M2' | 'M3'>('M2');
  const [inputMode, setInputMode] = useState<'dimensi' | 'total'>('dimensi');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [material, setMaterial] = useState('');

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [aiAnswer, setAiAnswer] = useState('');
  const [conversationContext, setConversationContext] = useState<string[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCalculate = async (isFollowUp = false) => {
    if (!isFollowUp) {
      if (!material) return;
      if (inputMode === 'dimensi') {
        if (!length) return;
        if (calcType === 'M2' && !width) return;
        if (calcType === 'M3' && (!width || !height)) return;
      } else {
        if (!totalValue) return;
      }
      setConversationContext([]);
      setAiQuestion('');
      setAiOptions([]);
    } else {
      if (!aiAnswer.trim()) return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        setErrorMsg('API Key tidak ditemukan di environment. Hubungi administrator.');
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      let dimensionText = '';
      if (inputMode === 'dimensi') {
        dimensionText = `Panjang: ${length} m`;
        if (calcType === 'M2' || calcType === 'M3') dimensionText += `, Lebar: ${width} m`;
        if (calcType === 'M3') dimensionText += `, Tinggi: ${height} m`;
      } else {
        dimensionText = `Total Volume: ${totalValue} ${calcType}`;
      }

      const currentContext = [...conversationContext];
      if (isFollowUp) {
        currentContext.push(`User menjawab: ${aiAnswer}`);
      }

      const promptObj = {
        task: "Hitung kebutuhan material bangunan",
        tipeVolume: calcType,
        modeInput: inputMode,
        dimensi: dimensionText,
        material: material,
        riwayatPercakapan: currentContext
      };

      const prompt = JSON.stringify(promptObj, null, 2);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: `ANDA ADALAH SEBUAH AI MATERIAL PLANNER UNTUK APLIKASI KONSTRUKSI ANDROID.
TUGAS UTAMA: Membantu pengguna menghitung kebutuhan material bangunan secara otomatis berdasarkan input terstruktur.
ATURAN:
1. Analisis input dimensi/volume dan material yang diberikan.
2. HASIL PERHITUNGAN WAJIB DALAM SATUAN FISIK (batang, dos, pcs, sak, lembar, dll). DILARANG KERAS memberikan hasil hanya dalam bentuk luas (m2) atau volume (m3).
3. JIKA ada informasi krusial yang kurang untuk menghitung material menjadi satuan fisik (misal: ukuran keramik, ukuran plafond, jenis bata, mutu beton K100/K250, jenis rangka), kembalikan JSON dengan status "need_info" dan tanyakan detail tersebut.
4. JIKA memberikan pertanyaan, berikan opsi jawaban yang umum (misal mutu beton: ["K100", "K150", "K225", "K250", "Lainnya"]) di dalam array "options". Jika pertanyaan terbuka, kosongkan array "options".
5. JIKA informasi sudah cukup, lakukan perhitungan dan kembalikan JSON dengan status "success".
6. Hasil perhitungan harus disajikan dalam bentuk "tags" (label dan value) agar minimalis. Contoh: label: "Keramik", value: "27 pcs", color: "blue", atau label: "Keramik", value: "2 dos", color: "green".
7. Pilihan warna tag yang diizinkan: "blue", "green", "orange", "purple", "red", "gray".
8. Berikan saran cerdas yang relevan dalam bentuk list.

FORMAT OUTPUT JSON (PILIH SALAH SATU):

JIKA BUTUH INFO TAMBAHAN:
{
  "status": "need_info",
  "question": "Pertanyaan singkat untuk user (misal: 'Berapa ukuran keramik yang digunakan?')",
  "options": ["Opsi 1", "Opsi 2", "Opsi 3"] 
}

JIKA BERHASIL DIHITUNG:
{
  "status": "success",
  "tags": [
    { "label": "Nama Item", "value": "Jumlah", "color": "blue" }
  ],
  "suggestions": [
    "Saran 1",
    "Saran 2"
  ]
}`
        }
      });

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText);

      if (result.status === 'need_info') {
        setAiQuestion(result.question);
        setAiOptions(result.options || []);
        if (isFollowUp) {
          setConversationContext([...currentContext, `AI bertanya: ${result.question}`]);
        } else {
          setConversationContext([`AI bertanya: ${result.question}`]);
        }
        setAiAnswer('');
      } else if (result.status === 'success') {
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          material: material,
          dimensions: dimensionText,
          tags: result.tags || [],
          suggestions: result.suggestions || [],
          expanded: true
        };
        setHistory(prev => [newItem, ...prev]);
        setAiQuestion('');
        setAiOptions([]);
        setAiAnswer('');
        setConversationContext([]);
      } else {
        setErrorMsg('Format respons AI tidak dikenali.');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setErrorMsg('Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, expanded: !item.expanded } : item));
  };

  const getColorClass = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-text/5 text-text/80 border-border';
    }
  };

  const handleCancelQuestion = () => {
    setAiQuestion('');
    setAiOptions([]);
    setAiAnswer('');
    setConversationContext([]);
  };

  const isCalculateDisabled = isLoading || !material || (inputMode === 'dimensi' ? (!length || (calcType !== 'M1' && !width) || (calcType === 'M3' && !height)) : !totalValue);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className={`bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4 transition-opacity ${aiQuestion ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="bg-primary text-primary-text p-2 rounded-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-text">AI Material Planner</h3>
            <p className="text-xs text-text/60">Isi form untuk menghitung material</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text/60 mb-2">Tipe Perhitungan</label>
          <div className="flex gap-2">
            {(['M1', 'M2', 'M3'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCalcType(type)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                  calcType === type
                    ? 'bg-primary/10 border-primary text-primary-dark'
                    : 'bg-card border-border text-text/40 hover:border-border'
                }`}
              >
                {type} {type === 'M1' ? '(Panjang)' : type === 'M2' ? '(Luas)' : '(Volume)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setInputMode('dimensi')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${
                inputMode === 'dimensi' ? 'bg-text/10 text-text' : 'bg-transparent text-text/40 hover:bg-text/5'
              }`}
            >
              Input Dimensi
            </button>
            <button
              onClick={() => setInputMode('total')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${
                inputMode === 'total' ? 'bg-text/10 text-text' : 'bg-transparent text-text/40 hover:bg-text/5'
              }`}
            >
              Input Total
            </button>
          </div>

          {inputMode === 'dimensi' ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-text/5 text-[10px] uppercase text-text/40">
                  <tr>
                    <th className="p-2 font-bold border-b border-border">Panjang (m)</th>
                    {calcType !== 'M1' && <th className="p-2 font-bold border-b border-border border-l">Lebar (m)</th>}
                    {calcType === 'M3' && <th className="p-2 font-bold border-b border-border border-l">Tinggi (m)</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-0">
                      <input
                        id="ai-calc-length"
                        type="number"
                        value={length}
                        onChange={e => setLength(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ai-calc-width')?.focus() || document.getElementById('ai-calc-material')?.focus(); } }}
                        className="w-full bg-transparent border-none px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="0"
                      />
                    </td>
                    {calcType !== 'M1' && (
                      <td className="p-0 border-l border-border">
                        <input
                          id="ai-calc-width"
                          type="number"
                          value={width}
                          onChange={e => setWidth(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ai-calc-height')?.focus() || document.getElementById('ai-calc-material')?.focus(); } }}
                          className="w-full bg-transparent border-none px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="0"
                        />
                      </td>
                    )}
                    {calcType === 'M3' && (
                      <td className="p-0 border-l border-border">
                        <input
                          id="ai-calc-height"
                          type="number"
                          value={height}
                          onChange={e => setHeight(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ai-calc-material')?.focus(); } }}
                          className="w-full bg-transparent border-none px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="0"
                        />
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Total Volume ({calcType})</label>
              <input
                type="number"
                value={totalValue}
                onChange={e => setTotalValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ai-calc-material')?.focus(); } }}
                className="w-full bg-text/5 border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="0"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-text/60 mb-1">Material yang Dihitung</label>
          <input
            id="ai-calc-material"
            type="text"
            value={material}
            onChange={e => setMaterial(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); !isCalculateDisabled && handleCalculate(false); } }}
            className="w-full bg-text/5 border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Contoh: Keramik, Bata Merah, Cat Dinding..."
          />
        </div>

        <button
          onClick={() => handleCalculate(false)}
          disabled={isCalculateDisabled}
          className="w-full bg-primary text-primary-text font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity mt-2"
        >
          {isLoading && !aiQuestion ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Hitung dengan AI
            </>
          )}
        </button>
      </div>

      {aiQuestion && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-primary-dark font-bold text-sm">
              <Sparkles size={16} />
              AI Butuh Detail Tambahan
            </div>
            <button onClick={handleCancelQuestion} className="text-text/40 hover:text-text/60">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-text/70">{aiQuestion}</p>
          
          {aiOptions && aiOptions.length > 0 && (
            <div className="flex flex-col gap-2 my-1">
              {aiOptions.map((opt, i) => (
                <label key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="aiOption"
                    value={opt}
                    checked={aiAnswer === opt}
                    onChange={() => setAiAnswer(opt)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm text-text/80">{opt}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={aiAnswer}
              onChange={e => setAiAnswer(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCalculate(true);
              }}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder={aiOptions && aiOptions.length > 0 ? "Atau ketik jawaban lain..." : "Ketik jawaban Anda..."}
              autoFocus={!aiOptions || aiOptions.length === 0}
            />
            <button
              onClick={() => handleCalculate(true)}
              disabled={isLoading || !aiAnswer.trim()}
              className="bg-primary text-primary-text px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Kirim'}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="font-bold text-sm text-text/60 px-1">Riwayat Perhitungan</h4>
          {history.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div 
                className="p-3 bg-text/5 flex justify-between items-center cursor-pointer hover:bg-text/10 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <div>
                  <div className="font-bold text-sm text-text">{item.material}</div>
                  <div className="text-[10px] text-text/40 mt-0.5">{item.dimensions}</div>
                </div>
                <div className="text-text/40">
                  {item.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              
              {item.expanded && (
                <div className="p-4 border-t border-border">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, i) => (
                      <div key={i} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${getColorClass(tag.color)} flex items-center gap-1.5`}>
                        <span className="opacity-60 font-medium">{tag.label}:</span> 
                        <span>{tag.value}</span>
                      </div>
                    ))}
                  </div>
                  
                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="bg-text/5 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-text/40 uppercase mb-2">Saran AI</div>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-text/70">
                        {item.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
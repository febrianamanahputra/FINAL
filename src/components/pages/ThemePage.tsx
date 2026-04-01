import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '../../store';
import { THEMES } from '../../themes';

interface ThemePageProps {
  onBack: () => void;
}

export default function ThemePage({ onBack }: ThemePageProps) {
  const { state, updateState } = useAppStore();
  const currentTheme = state.theme || 'default';

  const handleThemeSelect = (themeId: string) => {
    updateState(prev => ({ ...prev, theme: themeId }));
    
    // Apply theme to document
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary);
      root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
      root.style.setProperty('--color-primary-text', theme.colors.primaryText);
      root.style.setProperty('--color-bg', theme.colors.bg);
      root.style.setProperty('--color-text', theme.colors.text);
      root.style.setProperty('--color-card', theme.colors.card);
      root.style.setProperty('--color-border', theme.colors.border);
      root.style.setProperty('--font-sans', theme.font);
    }
  };

  const categories = Array.from(new Set(THEMES.map(t => t.category)));

  return (
    <div className="w-full h-full bg-bg flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: 'var(--color-card)' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Tema Aplikasi</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-20">
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50">{category}</h2>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.filter(t => t.category === category).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="flex flex-col items-center p-3 rounded-xl border-2 transition-all relative overflow-hidden"
                  style={{ 
                    backgroundColor: theme.colors.card, 
                    borderColor: currentTheme === theme.id ? theme.colors.primary : theme.colors.border,
                    color: theme.colors.text,
                    fontFamily: theme.font
                  }}
                >
                  <div className="w-full h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.bg }}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                  </div>
                  <span className="text-[10px] font-bold text-center">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                      <Check size={10} color={theme.colors.bg} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

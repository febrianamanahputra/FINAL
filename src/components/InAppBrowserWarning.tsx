import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

export default function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    // Deteksi browser bawaan aplikasi (WhatsApp, FB, IG, Line, dll) atau Android WebView ('wv')
    const rules = ['WhatsApp', 'FBAV', 'FBAN', 'Instagram', 'Line', 'Snapchat', 'WeChat', 'TikTok', 'wv'];
    const isApp = rules.some(rule => ua.includes(rule));
    
    if (isApp) {
      setIsInApp(true);
    }
  }, []);

  if (!isInApp || dismissed) return null;

  const handleOpenChrome = () => {
    const url = window.location.href.replace(/^https?:\/\//, '');
    const isAndroid = /android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Force open in Chrome via Android Intent
      window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end;`;
    } else {
      // iOS / others fallback
      alert('Silakan ketuk ikon menu (3 titik/panah) di pojok layar dan pilih "Buka di Browser Utama" atau "Open in Safari".');
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[100] bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-start gap-3 shadow-md animate-in slide-in-from-top-full duration-300">
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[11px] text-amber-800 font-medium mb-2 leading-snug">
          Anda sedang menggunakan browser bawaan aplikasi (WhatsApp/Sosmed). Fitur kirim foto mungkin diblokir.
        </p>
        <button 
          onClick={handleOpenChrome}
          className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-md text-[10px] font-bold shadow-sm active:bg-amber-600 transition-colors"
        >
          <ExternalLink size={12} /> Buka di Chrome / Browser Utama
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 text-amber-600/50 hover:text-amber-600 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  rightContent?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, onBack, rightContent }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5 shrink-0 bg-white sticky top-0 z-10">
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-full bg-black/5 border border-black/5 flex items-center justify-center shrink-0 active:bg-black/10 transition-colors"
      >
        <ChevronLeft size={18} className="text-black/60" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-black/85 truncate">{title}</h1>
        <p className="text-[9px] text-black/35 uppercase tracking-[1.5px] mt-[1px] truncate">{subtitle}</p>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Overlay({ isOpen, onClose, title, children }: OverlayProps) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-text/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-card rounded-t-3xl max-h-[85vh]"
          >
            <div className="w-8 h-1 bg-text/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h3 className="text-[11px] text-text/40 tracking-[1.5px] uppercase font-medium">{title}</h3>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full bg-text/5 flex items-center justify-center text-text/40 hover:bg-text/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-5 pb-6 overflow-y-auto hide-scrollbar flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

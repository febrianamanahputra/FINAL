import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from './store';
import Launcher from './components/Launcher';
import ReportPage from './components/pages/ReportPage';
import MaterialPage from './components/pages/MaterialPage';
import DanaPage from './components/pages/DanaPage';
import ToolsPage from './components/pages/ToolsPage';
import CatatanPage from './components/pages/CatatanPage';
import LinkPage from './components/pages/LinkPage';
import InAppBrowserWarning from './components/InAppBrowserWarning';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { state, updateState, getLocData, updateLocData } = useAppStore();
  const [currentPage, setCurrentPage] = useState<string>('launcher');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentPageRef = useRef(currentPage);
  const showExitConfirmRef = useRef(showExitConfirm);

  useEffect(() => {
    currentPageRef.current = currentPage;
    showExitConfirmRef.current = showExitConfirm;
  }, [currentPage, showExitConfirm]);

  useEffect(() => {
    // Push initial state to trap back button
    window.history.pushState({ trapped: true }, '', window.location.href);

    const handlePopState = () => {
      if (showExitConfirmRef.current) {
        // If dialog is open, close it
        setShowExitConfirm(false);
        window.history.pushState({ trapped: true }, '', window.location.href);
      } else if (currentPageRef.current !== 'launcher') {
        // If on a subpage, go back to launcher
        setCurrentPage('launcher');
        window.history.pushState({ trapped: true }, '', window.location.href);
      } else {
        // If on launcher, show exit confirmation
        setShowExitConfirm(true);
        window.history.pushState({ trapped: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const locData = getLocData(state.activeLoc);

  const renderPage = () => {
    switch (currentPage) {
      case 'report':
        return <ReportPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      case 'material':
        return <MaterialPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      case 'dana':
        return <DanaPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      case 'tools':
        return <ToolsPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      case 'catatan':
        return <CatatanPage state={state} updateState={updateState} onBack={() => setCurrentPage('launcher')} />;
      case 'link':
        return <LinkPage state={state} locData={locData} updateLocData={updateLocData} updateState={updateState} onBack={() => setCurrentPage('launcher')} />;
      default:
        return <Launcher state={state} updateState={updateState} getLocData={getLocData} onOpenPage={setCurrentPage} />;
    }
  };

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      <InAppBrowserWarning />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: currentPage === 'launcher' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: currentPage === 'launcher' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Keluar Aplikasi?</h3>
              <p className="text-sm text-gray-500 mb-6">Apakah Anda yakin ingin keluar dari aplikasi?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    window.close();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-red-500 text-white active:bg-red-600 transition-colors"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


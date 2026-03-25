import React, { useState } from 'react';
import { useAppStore } from './store';
import Launcher from './components/Launcher';
import ReportPage from './components/pages/ReportPage';
import MaterialPage from './components/pages/MaterialPage';
import DanaPage from './components/pages/DanaPage';
import ToolsPage from './components/pages/ToolsPage';
import CatatanPage from './components/pages/CatatanPage';
import LinkPage from './components/pages/LinkPage';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { state, updateState, getLocData, updateLocData } = useAppStore();
  const [currentPage, setCurrentPage] = useState<string>('launcher');

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
        return <CatatanPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      case 'link':
        return <LinkPage state={state} locData={locData} updateLocData={updateLocData} onBack={() => setCurrentPage('launcher')} />;
      default:
        return <Launcher state={state} updateState={updateState} getLocData={getLocData} onOpenPage={setCurrentPage} />;
    }
  };

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
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
    </div>
  );
}


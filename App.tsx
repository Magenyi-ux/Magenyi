import React, { useState, useCallback, useEffect } from 'react';
import { Page, Theme } from './types';
import { NAV_ITEMS } from './constants';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import SolverPage from './pages/SolverPage';
import PracticePage from './pages/PracticePage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import FAB from './components/FAB';
import VoiceAssistantModal from './components/VoiceAssistantModal';

export default function App() {
  const [theme, setTheme] = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('Home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'Home':
        return <HomePage navigate={navigate} />;
      case 'Solver':
        return <SolverPage />;
      case 'Practice':
        return <PracticePage />;
      case 'Notes':
        return <NotesPage />;
      case 'Settings':
        return <SettingsPage theme={theme} setTheme={setTheme} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  useEffect(() => {
    document.body.className = `${theme} bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300`;
  }, [theme]);

  return (
    <div className={`flex h-screen w-full antialiased`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={NAV_ITEMS}
        currentPage={currentPage}
        navigate={navigate}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} currentPage={currentPage} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
      <FAB onClick={() => setVoiceModalOpen(true)} />
      <VoiceAssistantModal isOpen={isVoiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
}
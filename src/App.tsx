

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Page, UserStats } from './types';
import { NAV_ITEMS, INITIAL_STATS } from './constants';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import SolverPage from './pages/SolverPage';
import AiTutorPage from './pages/GeneralAiPage';
import PracticePage from './pages/PracticePage';
import NotesPage from './pages/NotesPage';
import YouTubeSummarizerPage from './pages/YouTubeSummarizerPage';
import SettingsPage from './pages/SettingsPage';
import SuggestionsPage from './pages/SuggestionsPage';
import ProfilePage from './pages/ProfilePage';
import QuizPlayerPage from './pages/QuizPlayerPage';
import EssayGraderPage from './pages/EssayGraderPage';
import CalendarPage from './pages/CalendarPage';
import FAB from './components/FAB';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import { NotificationProvider } from './contexts/NotificationContext';
import { Notification } from './components/Notification';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotification } from './hooks/useNotification';
import SetupPage from './pages/SetupPage';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import ApiKeyError from './components/ApiKeyError';
import IdleScreen from './components/IdleScreen';


const AppContent: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('Home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
  
  const [stats, setStats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
  const [activeTime, setActiveTime] = useLocalStorage<number>('activeTime', 0);
  const { showNotification } = useNotification();
  
  const [hasCompletedSetup, setHasCompletedSetup] = useLocalStorage('hasCompletedSetup', false);
  const [, setStudyField] = useLocalStorage<string | null>('studyField', null);

  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) {
        clearTimeout(idleTimer.current);
    }
    setIsIdle(false);
    idleTimer.current = setTimeout(() => {
        setIsIdle(true);
    }, 5 * 60 * 1000); // 5 minutes to idle
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        if (idleTimer.current) {
            clearTimeout(idleTimer.current);
        }
    };
  }, [resetIdleTimer]);
  
  // Migrate old stats objects for existing users
  useEffect(() => {
    if (stats && stats.stars === undefined) {
      setStats((prev: UserStats) => ({ ...prev, stars: 1 }));
    }
  }, [stats, setStats]);

  // Star Award Logic
  useEffect(() => {
    if (stats?.stars === undefined) return;
    
    const TEN_HOURS_IN_SECONDS = 10 * 60 * 60;
    const expectedStars = 1 + Math.floor(activeTime / TEN_HOURS_IN_SECONDS);

    if (stats.stars < expectedStars) {
      const starsEarned = expectedStars - stats.stars;
      setStats((prevStats: UserStats) => ({ ...prevStats, stars: expectedStars }));
      const starEmoji = '⭐'.repeat(starsEarned);
      showNotification(`You've earned ${starsEarned > 1 ? starsEarned + ' Study Stars' : 'a Study Star'}! ${starEmoji}`, 'success');
    }
  }, [activeTime, stats, setStats, showNotification]);

  // Active Time Tracker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (interval) return;
      interval = setInterval(() => {
        setActiveTime((prevTime: number) => prevTime + 1);
      }, 1000);
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setActiveTime]);


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
      case 'AI Tutor':
        return <AiTutorPage />;
      case 'Practice':
        return <PracticePage />;
      case 'Notes':
        return <NotesPage navigate={navigate} />;
      case 'YouTube Summarizer':
        return <YouTubeSummarizerPage />;
      case 'Essay Grader':
        return <EssayGraderPage />;
      case 'Calendar':
        return <CalendarPage />;
      case 'Settings':
        return <SettingsPage theme={theme} setTheme={setTheme} />;
      case 'Suggestions':
        return <SuggestionsPage />;
      case 'Profile':
        return <ProfilePage />;
      case 'Quiz':
        return <QuizPlayerPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  useEffect(() => {
    document.body.className = `${theme} bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300`;
  }, [theme]);
  
  if (!hasCompletedSetup) {
    return <SetupPage onComplete={(field: string | null) => {
        if (field) {
            setStudyField(field);
        }
        setHasCompletedSetup(true);
    }} />;
  }

  return (
    <>
      <div className={`flex h-screen w-full antialiased transition-filter duration-500 ${isIdle ? 'blur-sm' : ''}`}>
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
      {isIdle && <IdleScreen />}
    </>
  );
};

// New component to handle routing based on auth state
const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // If authenticated, render the main app content which includes the setup check
  return <AppContent />;
}


export default function App() {
  if (!process.env.API_KEY) {
    return <ApiKeyError />;
  }

  return (
    <NotificationProvider>
      <AppRouter />
      <Notification />
    </NotificationProvider>
  )
}

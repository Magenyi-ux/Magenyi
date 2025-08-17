
import React from 'react';
import { Theme } from '../types';

interface SettingsPageProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<SettingsPageProps> = ({ theme, setTheme }) => {
    const isDark = theme === 'dark';
    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    return (
        <button 
            onClick={toggleTheme}
            className="w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center p-1 transition-colors duration-300"
        >
            <span className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-8' : 'translate-x-0'}`}>
                {isDark ? '🌙' : '☀️'}
            </span>
        </button>
    );
}

const SettingsPage: React.FC<SettingsPageProps> = ({ theme, setTheme }) => {
    
    const clearAllData = () => {
        if (window.confirm('Are you sure you want to delete all your notes and practice stats? This action cannot be undone.')) {
            localStorage.removeItem('notes');
            localStorage.removeItem('practiceStats');
            alert('All data has been cleared.');
            window.location.reload();
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Settings</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Theme</h3>
                        <p className="text-sm text-slate-500">Switch between light and dark mode.</p>
                    </div>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                <div>
                    <h3 className="text-lg font-semibold">Manage Data</h3>
                    <p className="text-sm text-slate-500 mb-4">Clear all saved notes and practice history.</p>
                    <button
                        onClick={clearAllData}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Clear All Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

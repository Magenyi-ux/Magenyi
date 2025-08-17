import React from 'react';
import { Theme } from '../types';
import { useSpeech } from '../hooks/useSpeech';

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
    const { availableVoices, saveSelectedVoice, speak, getSelectedVoiceName } = useSpeech();
    const selectedVoiceName = getSelectedVoiceName();
    
    const clearAppData = () => {
        if (window.confirm('Are you sure you want to delete all your notes and practice stats? This action cannot be undone.')) {
            localStorage.removeItem('notes');
            localStorage.removeItem('practiceStats');
            alert('Your notes and practice stats have been cleared.');
            window.location.reload();
        }
    };

    const handleTestVoice = () => {
        const currentMappedVoice = availableVoices.find(v => v.name === selectedVoiceName);
        if (currentMappedVoice) {
            speak(`This is the voice of ${currentMappedVoice.name}.`, currentMappedVoice.voice);
        } else {
            speak('This is the default voice.');
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
                    <h3 className="text-lg font-semibold">Voice Assistant</h3>
                    <p className="text-sm text-slate-500 mb-4">Choose the voice for the AI Math Tutor.</p>
                    {availableVoices.length > 0 ? (
                        <div className="flex items-center gap-4">
                           <div className="flex rounded-md shadow-sm" role="radiogroup" aria-label="Select AI Voice">
                             {availableVoices.map(({ name, voice }) => (
                                <button
                                  key={name}
                                  role="radio"
                                  aria-checked={selectedVoiceName === name}
                                  onClick={() => saveSelectedVoice(voice)}
                                  className={`relative px-4 py-2 text-sm font-medium transition-colors border
                                    ${selectedVoiceName === name
                                      ? 'bg-indigo-600 border-indigo-600 text-white z-10'
                                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }
                                    first:rounded-l-md last:rounded-r-md -ml-px first:ml-0
                                  `}
                                >
                                  {name}
                                </button>
                              ))}
                           </div>
                           <button 
                             onClick={handleTestVoice} 
                             className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-md font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                             aria-label="Test selected voice"
                           >
                            Test
                           </button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Loading voices or none available. The system default will be used.</p>
                    )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                <div>
                    <h3 className="text-lg font-semibold">Manage Data</h3>
                    <p className="text-sm text-slate-500 mb-4">Clear all saved notes and practice history. Your settings will be preserved.</p>
                    <button
                        onClick={clearAppData}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Clear App Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

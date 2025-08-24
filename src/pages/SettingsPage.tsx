


import React, { useState, useEffect } from 'react';
import { Theme, UserStats } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotification } from '../hooks/useNotification';
import { INITIAL_STATS } from '../constants';

interface SettingsPageProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ theme, setTheme }) => {
    const { availableVoices, saveSelectedVoice, speak, getSelectedVoiceName } = useSpeech();
    const [stats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
    const { showNotification } = useNotification();
    
    // --- Local state for pending settings ---
    const [pendingVoiceName, setPendingVoiceName] = useState(getSelectedVoiceName());

    // --- Sync local state if props/persisted values change from elsewhere ---
    useEffect(() => { setPendingVoiceName(getSelectedVoiceName()); }, [availableVoices, getSelectedVoiceName]);

    const clearAppData = () => {
        if (window.confirm('Are you sure you want to delete all your notes and practice stats? This action cannot be undone.')) {
            localStorage.removeItem('notes');
            localStorage.removeItem('userStats');
            localStorage.removeItem('activeTime');
            showNotification('Your notes and practice stats have been cleared.', 'success');
        }
    };

    const handleTestVoice = () => {
        const currentMappedVoice = availableVoices.find(v => v.name === pendingVoiceName);
        if (currentMappedVoice) {
            speak(`This is the voice of ${currentMappedVoice.name}.`, currentMappedVoice.voice);
        } else {
            speak('This is the default voice.');
        }
    };
    
    const handleSave = () => {
        // Persist voice selection
        const voiceToSave = availableVoices.find(v => v.name === pendingVoiceName);
        if (voiceToSave) {
            saveSelectedVoice(voiceToSave.voice);
        }
        
        showNotification('Settings saved successfully!', 'success');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Settings</h2>

            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <h3 className="text-lg font-semibold">User Experience</h3>
                    <p className="text-sm text-slate-500">Your current total experience points.</p>
                    <p className="text-2xl font-bold mt-2 text-black">{stats.xp} XP</p>
                </div>

                <div className="border-t border-slate-200"></div>

                <div>
                    <h3 className="text-lg font-semibold">Voice Assistant</h3>
                    <p className="text-sm text-slate-500 mb-4">Choose the voice for the AI Math Tutor.</p>
                    {availableVoices.length > 0 ? (
                        <div className="flex items-center gap-4">
                           <div className="flex rounded-md shadow-sm" role="radiogroup" aria-label="Select AI Voice">
                             {availableVoices.map(({ name }) => (
                                <button
                                  key={name}
                                  role="radio"
                                  aria-checked={pendingVoiceName === name}
                                  onClick={() => setPendingVoiceName(name)}
                                  className={`relative px-4 py-2 text-sm font-medium transition-colors border
                                    ${pendingVoiceName === name
                                      ? 'bg-indigo-600 border-indigo-600 text-white z-10'
                                      : 'bg-white border-slate-300 hover:bg-slate-50'
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
                             className="bg-slate-200 px-4 py-2 rounded-md font-semibold text-sm hover:bg-slate-300 transition"
                             aria-label="Test selected voice"
                           >
                            Test
                           </button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Loading voices or none available. The system default will be used.</p>
                    )}
                </div>

                <div className="border-t border-slate-200"></div>

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
                
                <div className="border-t border-slate-200 pt-6">
                    <button
                        onClick={handleSave}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
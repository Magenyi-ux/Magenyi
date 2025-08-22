
import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserStats } from '../types';
import { INITIAL_STATS } from '../constants';

const ProgressTracker: React.FC = () => {
    const [stats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);

    const level = Math.floor(stats.xp / 100) + 1;
    const currentLevelXp = stats.xp % 100;
    const progressPercent = currentLevelXp;

    return (
        <div className="mt-12 max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-center">Your Progress</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1 font-semibold">
                            <span>Level {level}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{stats.xp} / {level * 100} XP</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                            <div 
                                className="bg-indigo-600 h-4 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center pt-2">
                        <div>
                            <p className="text-3xl font-bold">{stats.score}</p>
                            <p className="text-slate-500 dark:text-slate-400">Total Score</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{stats.streak} 🔥</p>
                            <p className="text-slate-500 dark:text-slate-400">Current Streak</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
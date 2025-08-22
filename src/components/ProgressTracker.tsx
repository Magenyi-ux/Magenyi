

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
        <div className="w-full">
            <h3 className="text-xl font-bold mb-2">Your Progress</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1 font-semibold">
                        <span>Level {level}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{stats.xp} XP</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div 
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center pt-2">
                    <div>
                        <p className="text-2xl font-bold">{stats.score}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Score</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.streak} 🔥</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;


import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserStats } from '../types';
import { INITIAL_STATS } from '../constants';

const MiniProgressTracker: React.FC = () => {
    const [stats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);

    const level = Math.floor(stats.xp / 100) + 1;
    const currentLevelXp = stats.xp % 100;
    const progressPercent = currentLevelXp;

    return (
        <div className="flex items-center gap-3 group relative cursor-pointer">
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Lvl {level}</span>
            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <p><strong>{stats.xp}</strong> total XP</p>
                <p>{100 - currentLevelXp} XP to next level</p>
            </div>
        </div>
    );
};

export default MiniProgressTracker;
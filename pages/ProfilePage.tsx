
import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, UserStats } from '../types';

const INITIAL_STATS: UserStats = {
  score: 0,
  streak: 0,
  questionsAttempted: 0,
  correctAnswers: 0,
  xp: 0,
};

const ProfilePage: React.FC = () => {
    const [notes] = useLocalStorage<Note[]>('notes', []);
    const [stats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
    const level = Math.floor(stats.xp / 100) + 1;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">My Profile</h2>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white dark:border-slate-700 shadow-md">
                    <span>U</span>
                </div>
                
                <div className="text-center">
                    <h3 className="text-2xl font-bold">User One</h3>
                    <p className="text-slate-500 dark:text-slate-400">user.one@example.com</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 w-full my-4"></div>

                <div className="w-full text-left">
                     <h4 className="text-xl font-semibold mb-4">My Stats</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Current Level</p>
                            <p className="text-2xl font-bold">{level}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total XP</p>
                            <p className="text-2xl font-bold">{stats.xp}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Notes Created</p>
                            <p className="text-2xl font-bold">{notes.length}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Practice Score</p>
                            <p className="text-2xl font-bold">{stats.score}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Questions Answered</p>
                            <p className="text-2xl font-bold">{stats.questionsAttempted}</p>
                        </div>
                         <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
                            <p className="text-2xl font-bold">{stats.streak} 🔥</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

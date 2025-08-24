


import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, UserStats } from '../types';
import { INITIAL_STATS } from '../constants';

const ProfilePage: React.FC = () => {
    const [notes] = useLocalStorage<Note[]>('notes', []);
    const [stats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
    const level = Math.floor(stats.xp / 100) + 1;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">My Profile</h2>

            <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-md">
                    <span>L</span>
                </div>
                
                <div className="text-center">
                    <h3 className="text-2xl font-bold">Learner</h3>
                    <p className="text-slate-500">Welcome to your learning journey!</p>
                </div>

                <div className="border-t border-slate-200 w-full my-4"></div>

                <div className="w-full text-left">
                     <h4 className="text-xl font-semibold mb-4">My Stats</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Current Level</p>
                            <p className="text-2xl font-bold">{level}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Total XP</p>
                            <p className="text-2xl font-bold">{stats.xp}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Total Notes Created</p>
                            <p className="text-2xl font-bold">{notes.length}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Total Practice Score</p>
                            <p className="text-2xl font-bold">{stats.score}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Questions Answered</p>
                            <p className="text-2xl font-bold">{stats.questionsAttempted}</p>
                        </div>
                         <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Current Streak</p>
                            <p className="text-2xl font-bold">{stats.streak} 🔥</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Study Stars</p>
                            <p className="text-2xl font-bold">{stats.stars} ⭐</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
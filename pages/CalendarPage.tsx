import React, { useState } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { useActivityLogger } from '../hooks/useActivityLogger';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

interface StudyDay {
    day: string;
    focus: string;
    tasks: string[];
}

const CalendarPage: React.FC = () => {
    const [goals, setGoals] = useState('');
    const [plan, setPlan] = useState<StudyDay[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { logActivity } = useActivityLogger();

    const handleGeneratePlan = async () => {
        if (!goals.trim()) return;
        setIsLoading(true);
        setPlan(null);
        const result = await generateStudyPlan(goals);
        if (result) {
            setPlan(result);
            logActivity('STUDY_PLAN_GENERATED');
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">AI Study Calendar</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                Tell the AI your goals (e.g., "prepare for my calculus final in one week"), and it will generate a personalized study schedule.
            </p>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                 <label htmlFor="study-goals" className="block text-lg font-semibold mb-2">My Study Goals</label>
                 <textarea
                    id="study-goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g., I have a biology exam on Friday covering cell division and genetics. I need to review my notes and do practice problems."
                    rows={3}
                    className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                 />
                 <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading || !goals.trim()}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                 >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Generating Plan...' : 'Generate My Study Plan'}
                 </button>
            </div>
            
            <div className="mt-8">
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md animate-pulse">
                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                            </div>
                        ))}
                    </div>
                )}
                {plan ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plan.map((day, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{day.day}</h3>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">{day.focus}</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-500 dark:text-slate-400 flex-grow">
                                    {day.tasks.map((task, i) => <li key={i}>{task}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="text-center py-16 text-slate-500">
                            <CalendarIcon />
                            <p className="mt-4">Your personalized study plan will appear here.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default CalendarPage;

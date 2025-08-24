

import React, { useState, useEffect } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useLocalStorage } from '../hooks/useLocalStorage';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

interface StudyTask {
    text: string;
    completed: boolean;
}

interface StudyDay {
    day: string;
    focus: string;
    tasks: StudyTask[];
}

const CalendarPage: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [subject, setSubject] = useState('');
    const [level, setLevel] = useState('College (First Year)');
    const [country, setCountry] = useState('United States');
    const [duration, setDuration] = useState('7');

    const [plan, setPlan] = useLocalStorage<StudyDay[] | null>('study-plan', null);
    const [isLoading, setIsLoading] = useState(false);
    const { logActivity } = useActivityLogger();
    const [progress, setProgress] = useState(0);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    useEffect(() => {
        if (plan) {
            const totalTasks = plan.reduce((acc, day) => acc + day.tasks.length, 0);
            if (totalTasks === 0) {
                setProgress(0);
                return;
            }
            const completedTasks = plan.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0);
            setProgress(Math.round((completedTasks / totalTasks) * 100));
        } else {
            setProgress(0);
        }
    }, [plan]);

    const handleGeneratePlan = async () => {
        if (!goal.trim() || !subject.trim()) return;
        setIsLoading(true);
        setPlan(null);
        const result = await generateStudyPlan({ goal, subject, level, country, duration: parseInt(duration) });
        if (result) {
            const newPlan = result.map((day: any) => ({
                ...day,
                tasks: day.tasks.map((taskText: string) => ({ text: taskText, completed: false }))
            }));
            setPlan(newPlan);
            setSelectedDayIndex(0);
            logActivity('STUDY_PLAN_GENERATED', { goal, subject, level, country, duration });
        }
        setIsLoading(false);
    };

    const handleToggleTask = (dayIndex: number, taskIndex: number) => {
        if (!plan) return;
        const newPlan = [...plan];
        newPlan[dayIndex].tasks[taskIndex].completed = !newPlan[dayIndex].tasks[taskIndex].completed;
        setPlan(newPlan);
    };

    const countries = ["United States", "United Kingdom", "Canada", "Australia", "India", "Other"];
    const educationLevels = [
        "High School (Freshman)", "High School (Sophomore)", "High School (Junior)", "High School (Senior)",
        "College (First Year)", "College (Second Year)", "College (Third Year)", "College (Final Year)",
        "Graduate Studies", "Other"
    ];

    const selectedDay = plan?.[selectedDayIndex];

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">AI Study Calendar</h2>
            <p className="text-center text-slate-600 mb-8">
                Tell the AI your goals, and it will generate a personalized, trackable study schedule.
            </p>

            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="study-goal" className="block text-sm font-semibold mb-1">Main Goal</label>
                        <input id="study-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Ace my final exam" className="w-full p-2 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="study-subject" className="block text-sm font-semibold mb-1">Focus Subject/Topic</label>
                        <input id="study-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Calculus II" className="w-full p-2 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="education-level" className="block text-sm font-semibold mb-1">Education Level</label>
                        <select id="education-level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-2 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500">
                            {educationLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="country" className="block text-sm font-semibold mb-1">Country</label>
                        <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-2 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500">
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="duration" className="block text-sm font-semibold mb-1">Plan Duration (Days)</label>
                        <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500">
                           <option value="3">3 Days</option>
                           <option value="7">7 Days</option>
                           <option value="14">14 Days</option>
                        </select>
                   </div>
                </div>
                 <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading || !goal.trim() || !subject.trim()}
                    className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                 >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Generating Plan...' : 'Generate My Study Plan'}
                 </button>
            </div>
            
            <div className="mt-8">
                {isLoading && (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-slate-500">Building your personalized plan...</p>
                    </div>
                )}
                {plan && selectedDay && (
                     <div className="animate-fade-in">
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-xl font-bold">Your Plan Progress</h3>
                                <span className="font-semibold">{progress}% Complete</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div 
                                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                            <h3 className="text-2xl font-bold text-black">{selectedDay.day}</h3>
                            <p className="font-semibold text-slate-600 mb-4">{selectedDay.focus}</p>
                            <div className="space-y-3 text-slate-700">
                                {selectedDay.tasks.map((task, taskIndex) => (
                                    <label key={taskIndex} className="flex items-start space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-100">
                                        <input 
                                            type="checkbox" 
                                            checked={task.completed} 
                                            onChange={() => handleToggleTask(selectedDayIndex, taskIndex)}
                                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 flex-shrink-0"
                                        />
                                        <span className={`flex-1 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                            {task.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4">Full Plan Overview</h3>
                            <div className="flex overflow-x-auto space-x-4 pb-4">
                                {plan.map((day, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedDayIndex(index)}
                                        className={`cursor-pointer p-4 rounded-lg shadow-md flex-shrink-0 w-64 transition-all duration-200
                                            ${index === selectedDayIndex
                                                ? 'bg-indigo-100 border-2 border-indigo-500'
                                                : 'bg-white hover:scale-105'
                                            }`
                                        }
                                    >
                                        <h4 className="font-bold text-slate-800">{day.day}</h4>
                                        <p className="text-sm text-slate-500 truncate">{day.focus}</p>
                                        <div className="text-xs text-slate-400 mt-2">
                                            {day.tasks.filter(t => t.completed).length} / {day.tasks.length} tasks done
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {!plan && !isLoading && (
                    <div className="text-center py-16 text-slate-500">
                        <CalendarIcon />
                        <p className="mt-4">Your personalized study plan will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarPage;

import React, { useState, useEffect } from 'react';
import { Page, Note, Activity, ActivityType } from '../types';
import ProgressTracker from '../components/ProgressTracker';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateDailyChallenge } from '../services/geminiService';

interface HomePageProps {
    navigate: (page: Page) => void;
}

const timeAgo = (timestamp: number) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const activityDisplayMap: Record<ActivityType, { icon: string; text: string }> = {
  SOLVED_PROBLEM_TEXT: { icon: '🧮', text: 'Solved a text problem' },
  SOLVED_PROBLEM_WHITEBOARD: { icon: '✍️', text: 'Solved a whiteboard problem' },
  VISUAL_QUESTION_ASKED: { icon: '🖼️', text: 'Asked a visual question' },
  PRACTICE_ANSWER: { icon: '🎯', text: 'Answered a practice question' },
  NOTE_CREATED_VOICE: { icon: '🎤', text: 'Created a voice note' },
  NOTE_CREATED_FILE: { icon: '📄', text: 'Created a note from a file' },
  NOTE_CREATED_MANUAL: { icon: '📝', text: 'Created a new note' },
  NOTE_CREATED_VIDEO: { icon: '▶️', text: 'Created a note from video' },
  NOTE_QUIZ_GENERATED: { icon: '❓', text: 'Generated a quiz from a note' },
  NOTE_FLASHCARDS_GENERATED: { icon: '🃏', text: 'Generated flashcards' },
  NOTE_EXPLAINED: { icon: '🧑‍🏫', text: 'Used the "Tutor Me" feature' },
  AUDIO_RECAP_GENERATED: { icon: '🎧', text: 'Generated an audio recap' },
  VIDEO_GENERATED: { icon: '🎬', text: 'Generated an explainer video' },
  YOUTUBE_SUMMARY_SAVED: { icon: '📺', text: 'Saved a YouTube summary' },
  CHAT_MESSAGE_SENT: { icon: '💬', text: 'Chatted with the AI Tutor' },
  SUGGESTION_SUBMITTED: { icon: '💡', text: 'Submitted feedback' },
  ESSAY_GRADED: { icon: '📜', text: 'Graded an essay' },
  STUDY_PLAN_GENERATED: { icon: '🗓️', text: 'Generated a study plan' },
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col ${className}`}>
        {children}
    </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; icon?: string }> = ({ children, icon }) => (
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span>{children}</span>
    </h3>
);

const DailyChallenge: React.FC = () => {
    const [studyField] = useLocalStorage<string | null>('studyField', 'General Knowledge');
    const [challenge, setChallenge] = useState<{ question: string; options: string[]; correctAnswer: string } | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `dailyChallenge_${today}`;
        const cached = sessionStorage.getItem(storageKey);

        const fetchNewChallenge = () => {
            generateDailyChallenge(studyField || 'General Knowledge').then(newChallenge => {
                setChallenge(newChallenge);
                sessionStorage.setItem(storageKey, JSON.stringify(newChallenge));
            }).catch(err => {
                console.error("Failed to fetch new challenge:", err);
            }).finally(() => {
                setIsLoading(false);
            });
        };

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.options && parsed.correctAnswer) {
                    setChallenge(parsed);
                    setIsLoading(false);
                } else {
                    sessionStorage.removeItem(storageKey);
                    fetchNewChallenge();
                }
            } catch (e) {
                sessionStorage.removeItem(storageKey);
                fetchNewChallenge();
            }
        } else {
            fetchNewChallenge();
        }
    }, [studyField]);

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
    };

    const getButtonClass = (option: string) => {
        if (!isAnswered) {
            return 'bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900';
        }
        if (option === challenge?.correctAnswer) {
            return 'bg-green-500 text-white';
        }
        if (option === selectedOption && option !== challenge?.correctAnswer) {
            return 'bg-red-500 text-white';
        }
        return 'bg-slate-100 dark:bg-slate-700 opacity-60';
    };

    return (
        <Card className="md:col-span-2">
            <CardTitle icon="🧠">Daily Challenge</CardTitle>
            {isLoading ? (
                <div className="space-y-3">
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            ) : challenge ? (
                <div className="flex-1 flex flex-col justify-between">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">{challenge.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {challenge.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                disabled={isAnswered}
                                className={`p-3 rounded-lg text-left font-medium transition ${getButtonClass(option)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <p>Could not load a challenge. Please try again later.</p>
            )}
        </Card>
    );
};

const ContinueLearning: React.FC<{ navigate: (page: Page) => void }> = ({ navigate }) => {
    const [notes] = useLocalStorage<Note[]>('notes', []);
    const lastNote = notes.length > 0 ? notes[0] : null;

    return (
        <Card>
            <CardTitle icon="📚">Continue Learning</CardTitle>
            {lastNote ? (
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold">{lastNote.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{lastNote.content.replace(/!\[.*?\]\(.*?\)/g, '')}</p>
                    </div>
                    <button 
                        onClick={() => navigate('Notes')}
                        className="mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start"
                    >
                        Jump Back In →
                    </button>
                </div>
            ) : (
                <p className="text-slate-500">Your most recent note will appear here once you create one.</p>
            )}
        </Card>
    );
};

const QuickActions: React.FC<{ navigate: (page: Page) => void }> = ({ navigate }) => (
    <Card>
        <CardTitle icon="⚡">Quick Actions</CardTitle>
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('Solver')} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                <span className="text-2xl">🧮</span>
                <p className="font-semibold text-sm mt-1">Solver</p>
            </button>
            <button onClick={() => navigate('Practice')} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                <span className="text-2xl">🎯</span>
                <p className="font-semibold text-sm mt-1">Practice</p>
            </button>
            <button onClick={() => navigate('AI Tutor')} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                <span className="text-2xl">💬</span>
                <p className="font-semibold text-sm mt-1">AI Tutor</p>
            </button>
            <button onClick={() => navigate('Notes')} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                <span className="text-2xl">📝</span>
                <p className="font-semibold text-sm mt-1">Notes</p>
            </button>
        </div>
    </Card>
);

const RecentActivity: React.FC = () => {
    const [activities] = useLocalStorage<Activity[]>('activities', []);
    const recentActivities = activities.slice(0, 4);

    return (
        <Card>
            <CardTitle icon="📈">Recent Activity</CardTitle>
            {recentActivities.length > 0 ? (
                <ul className="space-y-3">
                    {recentActivities.map(activity => (
                         <li key={activity.id} className="flex items-center gap-3 text-sm">
                            <span className="text-xl bg-slate-100 dark:bg-slate-700 p-2 rounded-full">{activityDisplayMap[activity.type]?.icon || '✨'}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{activityDisplayMap[activity.type]?.text || activity.type}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(activity.timestamp)}</p>
                            </div>
                         </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500">Your recent actions in the app will be shown here.</p>
            )}
        </Card>
    );
};

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">
                Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{currentUser?.username || 'Learner'}</span>!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Let's make today a productive study session.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DailyChallenge />
            
            <div className="space-y-8 lg:col-span-1">
                <Card>
                    <ProgressTracker />
                </Card>
                <ContinueLearning navigate={navigate} />
            </div>

            <QuickActions navigate={navigate} />
            <RecentActivity />
        </div>
    </div>
  );
};

export default HomePage;

import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateQuizQuestion } from '../services/geminiService';
import { QuizQuestion, PracticeStats } from '../types';

const INITIAL_STATS: PracticeStats = {
  score: 0,
  streak: 0,
  questionsAttempted: 0,
  correctAnswers: 0,
};

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
);


const PracticePage: React.FC = () => {
    const [stats, setStats] = useLocalStorage<PracticeStats>('practiceStats', INITIAL_STATS);
    const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    
    const fetchNewQuestion = useCallback(async () => {
        setIsLoading(true);
        setFeedback('');
        setQuiz(null);
        setSelectedOption(null);
        setIsAnswered(false);
        // For simplicity, we'll use a fixed subject and difficulty. This can be expanded with user controls.
        const newQuiz = await generateQuizQuestion('Algebra', 'Medium');
        setQuiz(newQuiz);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchNewQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        
        setSelectedOption(option);
        setIsAnswered(true);
        
        setStats(prevStats => {
            const newStats = { ...prevStats, questionsAttempted: prevStats.questionsAttempted + 1 };
            if (option === quiz?.correctAnswer) {
                setFeedback('Correct! Well done.');
                newStats.correctAnswers += 1;
                newStats.score += 10;
                newStats.streak += 1;
            } else {
                setFeedback(`Not quite. The correct answer was: ${quiz?.correctAnswer}`);
                newStats.streak = 0;
            }
            return newStats;
        });
    };

    const getButtonClass = (option: string) => {
        if (!isAnswered) {
            return 'bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900';
        }
        if (option === quiz?.correctAnswer) {
            return 'bg-green-500 text-white';
        }
        if (option === selectedOption && option !== quiz?.correctAnswer) {
            return 'bg-red-500 text-white';
        }
        return 'bg-slate-100 dark:bg-slate-700 opacity-60';
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Practice Mode</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Score" value={stats.score} icon="🏆" />
                <StatCard label="Current Streak" value={stats.streak} icon="🔥" />
                <StatCard label="Accuracy" value={stats.questionsAttempted > 0 ? `${Math.round((stats.correctAnswers / stats.questionsAttempted) * 100)}%` : 'N/A'} icon="📊" />
                <StatCard label="Attempted" value={stats.questionsAttempted} icon="✏️" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg min-h-[300px]">
                {isLoading && <div className="text-center p-8">Generating a new question...</div>}
                {quiz && !isLoading && (
                    <div>
                        <p className="text-lg font-semibold mb-6 text-center">{quiz.question}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quiz.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    disabled={isAnswered}
                                    className={`p-4 rounded-lg text-left font-medium transition ${getButtonClass(option)}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {!quiz && !isLoading && <div className="text-center p-8 text-red-500">Could not load a quiz question. Please try again.</div>}
            </div>

            {isAnswered && (
                <div className="text-center mt-6">
                    <p className={`text-lg font-semibold ${feedback.startsWith('Correct') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{feedback}</p>
                    <button
                        onClick={fetchNewQuestion}
                        className="mt-4 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Next Question
                    </button>
                </div>
            )}
        </div>
    );
};

export default PracticePage;

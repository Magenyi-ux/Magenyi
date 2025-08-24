
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateQuizQuestion } from '../services/geminiService';
import { Note, QuizQuestion, UserStats } from '../types';
import XpGainToast from '../components/XpGainToast';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { INITIAL_STATS } from '../constants';
import { useNotification } from '../hooks/useNotification';

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
);


const PracticePage: React.FC = () => {
    const [stats, setStats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showXpToast, setShowXpToast] = useState(false);
    const [isCurrentQuestionSaved, setIsCurrentQuestionSaved] = useState(false);
    const { logActivity } = useActivityLogger();
    const { showNotification } = useNotification();
    
    const fetchNewQuestion = useCallback(async () => {
        setIsLoading(true);
        setFeedback('');
        setQuiz(null);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCurrentQuestionSaved(false);
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
        const isCorrect = option === quiz?.correctAnswer;
        
        logActivity('PRACTICE_ANSWER', { correct: isCorrect, question: quiz?.question.substring(0, 50) });

        setStats(prevStats => {
            const newStats: UserStats = { ...prevStats, questionsAttempted: prevStats.questionsAttempted + 1 };
            if (isCorrect) {
                setFeedback('Correct! Well done.');
                newStats.correctAnswers += 1;
                newStats.score += 10;
                newStats.streak += 1;
                newStats.xp += 10; // Award XP
                setShowXpToast(true);
            } else {
                setFeedback(`Not quite. The correct answer was: ${quiz?.correctAnswer}`);
                newStats.streak = 0;
            }
            return newStats;
        });
    };

    const handleSaveQuestion = () => {
        if (!quiz || isCurrentQuestionSaved) return;

        const noteContent = `
### Practice Question

**Question:**
${quiz.question}

---

**Options:**
${quiz.options.map(opt => `- ${opt}`).join('\n')}

---

**Correct Answer:**
\`${quiz.correctAnswer}\`

**Your Answer:**
\`${selectedOption}\`
        `.trim();

        const newNote: Note = {
            id: `practice_${Date.now()}`,
            title: `Practice: ${quiz.question.substring(0, 30)}...`,
            subject: 'Practice',
            content: noteContent,
            timestamp: Date.now(),
        };

        setNotes(prevNotes => [newNote, ...prevNotes]);
        showNotification('Question saved to Notes!', 'success');
        setIsCurrentQuestionSaved(true);
    };

    const getButtonClass = (option: string) => {
        if (!isAnswered) {
            return 'bg-slate-100 hover:bg-indigo-100';
        }
        if (option === quiz?.correctAnswer) {
            return 'bg-green-500 text-white';
        }
        if (option === selectedOption && option !== quiz?.correctAnswer) {
            return 'bg-red-500 text-white';
        }
        return 'bg-slate-100 opacity-60';
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

            <div className="bg-white p-6 rounded-lg shadow-lg min-h-[300px]">
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
                <div className="text-center mt-6 space-y-4">
                    <p className={`text-lg font-semibold ${feedback.startsWith('Correct') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</p>
                    <div className="flex justify-center items-center gap-4">
                         <button
                            onClick={handleSaveQuestion}
                            disabled={isCurrentQuestionSaved}
                            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            {isCurrentQuestionSaved ? 'Saved ✔' : 'Save Question'}
                        </button>
                        <button
                            onClick={fetchNewQuestion}
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Next Question
                        </button>
                    </div>
                </div>
            )}
            <XpGainToast show={showXpToast} xp={10} onClose={() => setShowXpToast(false)} />
        </div>
    );
};

export default PracticePage;

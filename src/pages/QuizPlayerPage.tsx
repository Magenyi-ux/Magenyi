
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { QuizQuestion, UserStats, Page } from '../types';
import XpGainToast from '../components/XpGainToast';
import { INITIAL_STATS } from '../constants';

interface QuizPlayerPageProps {
  navigate: (page: Page) => void;
}

const QuizPlayerPage: React.FC<QuizPlayerPageProps> = ({ navigate }) => {
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useLocalStorage<UserStats>('userStats', INITIAL_STATS);
  const [showXpToast, setShowXpToast] = useState(false);

  useEffect(() => {
    try {
      const storedQuiz = sessionStorage.getItem('activeQuiz');
      if (storedQuiz) {
        const parsedQuiz = JSON.parse(storedQuiz);
        if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
          setQuiz(parsedQuiz);
        } else {
          throw new Error('Invalid quiz data found.');
        }
        sessionStorage.removeItem('activeQuiz');
      } else {
        throw new Error('No active quiz found.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load quiz.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleAnswer = (option: string) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedAnswer(option);

    if (option === quiz![currentIndex].correctAnswer) {
      setScore(s => s + 1);
      setStats(prev => ({
        ...prev,
        xp: prev.xp + 10,
        score: prev.score + 10,
        questionsAttempted: prev.questionsAttempted + 1,
        correctAnswers: prev.correctAnswers + 1,
        streak: prev.streak + 1,
      }));
      setShowXpToast(true);
    } else {
        setStats(prev => ({
            ...prev,
            questionsAttempted: prev.questionsAttempted + 1,
            streak: 0,
        }));
    }
  };
  
  const handleNext = () => {
    if (currentIndex < quiz!.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setShowSummary(true);
    }
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-white dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900';
    }
    const isCorrect = option === quiz![currentIndex].correctAnswer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) return 'bg-green-500 text-white border-green-500';
    if (isSelected && !isCorrect) return 'bg-red-500 text-white border-red-500';
    return 'bg-slate-100 dark:bg-slate-700 opacity-60 border-transparent';
  };
  
  if (isLoading) {
      return <div className="text-center p-10">Loading Quiz...</div>;
  }
  
  if (error) {
      return (
        <div className="text-center p-10 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="mb-6">{error}</p>
            <button onClick={() => navigate('Notes')} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">Back to Notes</button>
        </div>
      );
  }
  
  if (showSummary) {
      return (
        <div className="max-w-lg mx-auto text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-xl animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Quiz Complete!</h2>
            <p className="text-2xl mb-2">You scored:</p>
            <p className="text-6xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-8">{score} / {quiz!.length}</p>
            <button onClick={() => navigate('Notes')} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105">Finish</button>
        </div>
      );
  }
  
  if (!quiz) return null;

  const currentQuestion = quiz[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Question {currentIndex + 1} of {quiz.length}</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-8">{currentQuestion.question}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              className={`p-4 rounded-lg text-left font-semibold transition border-2 ${getButtonClass(option)}`}
            >
              {option}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="text-center mt-8 animate-fade-in">
            <button onClick={handleNext} className="bg-indigo-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-indigo-700 transition">
              {currentIndex < quiz.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          </div>
        )}
      </div>
      <XpGainToast show={showXpToast} xp={10} onClose={() => setShowXpToast(false)} />
    </div>
  );
};

export default QuizPlayerPage;
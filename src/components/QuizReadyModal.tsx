
import React from 'react';

interface QuizReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBeginQuiz: () => void;
}

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 3.5c1.402-0.123 2.853-0.22 4.342 0M4.5 9.5c-0.123 1.402-0.22 2.853 0 4.342M14.5 3.5c1.402 0.123 2.853 0.22 4.342 0M19.5 9.5c0.123 1.402 0.22 2.853 0 4.342" />
        <path d="M12 21a9 9 0 1 0-9-9" />
        <path d="M12 21a9 9 0 1 1 9-9" />
        <path d="M12 21v-4.5" />
        <path d="M12 3v4.5" />
        <path d="M3 12h4.5" />
        <path d="M21 12h-4.5" />
        <path d="M12 12a4.5 4.5 0 1 1-4.5-4.5" />
    </svg>
);


const QuizReadyModal: React.FC<QuizReadyModalProps> = ({ isOpen, onClose, onBeginQuiz }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
        onClick={onClose}
    >
        <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all animate-fade-in"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="animate-bounce mb-6">
                <BrainIcon />
            </div>

            <h2 className="text-3xl font-bold mb-4">Quiz is Ready!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Test your knowledge on the concepts from your note.
            </p>

            <div className="flex flex-col space-y-4">
                <button
                    onClick={onBeginQuiz}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                >
                    Begin Quiz
                </button>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                    Maybe Later
                </button>
            </div>
        </div>
    </div>
  );
};

export default QuizReadyModal;
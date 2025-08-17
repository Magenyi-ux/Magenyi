import React, { useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../hooks/useTheme';
import { solveMathProblem, solveMathProblemFromImage } from '../services/geminiService';
import { Note, Subject } from '../types';
import SolverTabs from '../components/SolverTabs';
import Whiteboard from '../components/Whiteboard';
import SolutionDisplay from '../components/SolutionDisplay';

type SolverMode = 'text' | 'whiteboard';

const SolverPage: React.FC = () => {
  const [theme] = useTheme();
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [mode, setMode] = useState<SolverMode>('text');
  const [inputValue, setInputValue] = useState('');
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTextSolve = async () => {
    if (!inputValue.trim()) {
      setError('Please enter a question.');
      return;
    }
    setError('');
    setIsLoading(true);
    setSolution('');
    const result = await solveMathProblem(inputValue);
    setSolution(result);
    setIsLoading(false);
  };

  const handleWhiteboardSolve = async () => {
    setError('');
    setIsLoading(true);
    setSolution('');
    const imageData = (window as any).getWhiteboardData();
    if (!imageData) {
        setError('Could not get image from whiteboard. Please draw something.');
        setIsLoading(false);
        return;
    }
    const result = await solveMathProblemFromImage(imageData, 'image/png');
    setSolution(result);
    setIsLoading(false);
  };

  const clearWhiteboard = () => {
    (window as any).clearWhiteboard();
  };
  
  const saveNote = () => {
    if (!solution) return;
    const newNote: Note = {
        id: new Date().toISOString(),
        subject: 'General', // A more sophisticated version could ask the user or use AI to categorize
        title: mode === 'text' ? inputValue : "From Whiteboard",
        content: solution,
        timestamp: Date.now(),
    };
    setNotes([newNote, ...notes]);
    alert("Solution saved to Notes!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SolverTabs activeTab={mode} onTabChange={(newMode) => setMode(newMode)} />

      {mode === 'text' && (
        <div>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question here... e.g., 'who was the first president of the USA?' or 'what is the integral of x^2?'"
            className="w-full p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-40"
          />
          <button
            onClick={handleTextSolve}
            disabled={isLoading}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Get Answer'}
          </button>
        </div>
      )}

      {mode === 'whiteboard' && (
        <div className="flex flex-col items-center">
            <div className="w-full h-80 bg-white dark:bg-slate-800 rounded-lg shadow-inner mb-4">
                 <Whiteboard isDarkMode={theme === 'dark'} />
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={clearWhiteboard}
                    disabled={isLoading}
                    className="bg-slate-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition disabled:bg-slate-400"
                >
                    Clear
                </button>
                <button
                    onClick={handleWhiteboardSolve}
                    disabled={isLoading}
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Thinking...' : 'Solve from Whiteboard'}
                </button>
            </div>
        </div>
      )}
      
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      
      <SolutionDisplay solution={solution} isLoading={isLoading} />
      
      {solution && !isLoading && (
        <div className="mt-4 text-center">
            <button
                onClick={saveNote}
                className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition"
            >
                Save to Notes
            </button>
        </div>
      )}
    </div>
  );
};

export default SolverPage;
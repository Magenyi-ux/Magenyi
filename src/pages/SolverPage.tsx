

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../hooks/useTheme';
import { solveMathProblemStream, askQuestionAboutImageStream } from '../services/geminiService';
import { Note } from '../types';
import SolverTabs from '../components/SolverTabs';
import Whiteboard, { WhiteboardRef } from '../components/Whiteboard';
import SolutionDisplay from '../components/SolutionDisplay';
import WhiteboardToolbar from '../components/WhiteboardToolbar';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useNotification } from '../hooks/useNotification';

type SolverMode = 'text' | 'whiteboard' | 'visual';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16v-4a4 4 0 00-4-4H8" /></svg>;

const SolverPage: React.FC = () => {
  const [theme] = useTheme();
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [mode, setMode] = useState<SolverMode>('text');
  const [inputValue, setInputValue] = useState('');
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const whiteboardRef = useRef<WhiteboardRef>(null);
  const [solvedImage, setSolvedImage] = useState<string | null>(null);
  const { logActivity } = useActivityLogger();
  const { showNotification } = useNotification();

  // Visual Q&A state
  const [visualImage, setVisualImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [visualQuestion, setVisualQuestion] = useState('');

  // Whiteboard states
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(3);
  const [isWhiteboardFullscreen, setIsWhiteboardFullscreen] = useState(false);
  const [resizeTrigger, setResizeTrigger] = useState(0);
  const [isErasing, setIsErasing] = useState(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const handleSetStrokeColor = useCallback((color: string) => {
    setStrokeColor(color);
    setIsErasing(false);
  }, []);

  const toggleFullscreen = () => setIsWhiteboardFullscreen(prev => !prev);
  
  useEffect(() => {
    setTimeout(() => setResizeTrigger(c => c + 1), 100);
  }, [isWhiteboardFullscreen]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isWhiteboardFullscreen) setIsWhiteboardFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWhiteboardFullscreen]);

  const handleTextSolve = async () => {
    if (!inputValue.trim()) { setError('Please enter a question.'); return; }
    setError(''); setIsLoading(true); setSolution(''); setSolvedImage(null);
    
    try {
        const stream = solveMathProblemStream(inputValue);
        for await (const chunk of stream) {
            setSolution(prev => prev + chunk);
        }
    } catch (e: any) {
        setError(e.message || "An error occurred.");
    } finally {
        setIsLoading(false);
    }
    
    logActivity('SOLVED_PROBLEM_TEXT', { title: inputValue.substring(0, 50) });
  };

  const handleWhiteboardSolve = async () => {
    setError(''); setIsLoading(true); setSolution('');
    const imageDataURL = whiteboardRef.current?.getImageDataURL();
    if (!imageDataURL || imageDataURL.length < 200) {
        setError('Could not get image from whiteboard. Please draw something.'); setIsLoading(false); return;
    }
    const imageData = imageDataURL.split(',')[1];
    if (!imageData) {
        setError('Could not process image data.'); setIsLoading(false); return;
    }
    setSolvedImage(imageDataURL);

    try {
        const stream = askQuestionAboutImageStream(imageData, 'image/png', "First, transcribe the handwritten text or describe the diagram in this image. Then, provide a detailed explanation or solution based on the content.");
        for await (const chunk of stream) {
            setSolution(prev => prev + chunk);
        }
    } catch (e: any) {
        setError(e.message || "An error occurred.");
    } finally {
        setIsLoading(false);
    }

    logActivity('SOLVED_PROBLEM_WHITEBOARD');
  };

  const handleVisualSolve = async () => {
    if (!visualImage || !visualQuestion.trim()) {
        setError('Please upload an image and ask a question.'); return;
    }
    setError(''); setIsLoading(true); setSolution('');
    const base64Image = visualImage.dataUrl.split(',')[1];
    if (!base64Image) {
        setError('Could not process the uploaded image.'); setIsLoading(false); return;
    }
    setSolvedImage(visualImage.dataUrl);
    
    try {
        const stream = askQuestionAboutImageStream(base64Image, visualImage.file.type, visualQuestion);
        for await (const chunk of stream) {
            setSolution(prev => prev + chunk);
        }
    } catch (e: any) {
        setError(e.message || "An error occurred.");
    } finally {
        setIsLoading(false);
    }

    logActivity('VISUAL_QUESTION_ASKED', { question: visualQuestion.substring(0, 50) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setVisualImage({ file, dataUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    } else {
        setError('Please select a valid image file.');
    }
  };

  const clearWhiteboard = () => whiteboardRef.current?.clear();
  
  const saveNote = () => {
    if (!solution) return;
    let contentToSave = solution;
    if (solvedImage) {
        contentToSave = `![User Upload/Drawing](${solvedImage})\n\n---\n\n${solution}`;
    }
    let title = "Solution from " + mode;
    if (mode === 'text') title = inputValue;
    if (mode === 'visual') title = visualQuestion;

    const newNote: Note = {
        id: new Date().toISOString(), subject: 'General', title,
        content: contentToSave, timestamp: Date.now(),
    };
    setNotes([newNote, ...notes]);
    showNotification("Solution saved to Notes!", 'success');
  };

  const whiteboardContainerClasses = isWhiteboardFullscreen
    ? "fixed inset-0 bg-white z-50 p-4"
    : "relative w-full h-80 bg-white rounded-lg shadow-inner mb-4";

  return (
    <div className="max-w-4xl mx-auto">
      <SolverTabs activeTab={mode} onTabChange={(newMode) => { setMode(newMode); setSolution(''); setSolvedImage(null); }} />

      {mode === 'text' && (
        <div>
          <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type your question here..."
            className="w-full p-4 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-40"
          />
          <button onClick={handleTextSolve} disabled={isLoading} className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed">
            {isLoading ? 'Thinking...' : 'Get Answer'}
          </button>
        </div>
      )}

      {mode === 'whiteboard' && (
        <div className="flex flex-col items-center">
            <div className={whiteboardContainerClasses}>
                 <Whiteboard ref={whiteboardRef} isDarkMode={theme === 'dark'} strokeColor={strokeColor} lineWidth={lineWidth} resizeTrigger={resizeTrigger} isErasing={isErasing} onHistoryChange={setHistoryState} />
                 <WhiteboardToolbar strokeColor={strokeColor} setStrokeColor={handleSetStrokeColor} lineWidth={lineWidth} setLineWidth={setLineWidth} isFullscreen={isWhiteboardFullscreen} toggleFullscreen={toggleFullscreen} isErasing={isErasing} setIsErasing={setIsErasing} undo={() => whiteboardRef.current?.undo()} redo={() => whiteboardRef.current?.redo()} download={() => whiteboardRef.current?.downloadImage()} canUndo={historyState.canUndo} canRedo={historyState.canRedo} />
            </div>
            {!isWhiteboardFullscreen && (
              <div className="flex space-x-4">
                  <button onClick={clearWhiteboard} disabled={isLoading} className="bg-slate-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition disabled:bg-slate-400">Clear</button>
                  <button onClick={handleWhiteboardSolve} disabled={isLoading} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed">
                      {isLoading ? 'Thinking...' : 'Solve from Whiteboard'}
                  </button>
              </div>
            )}
        </div>
      )}

      {mode === 'visual' && (
        <div>
            <div className="w-full h-64 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center bg-slate-50 mb-4 relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {visualImage ? (
                    <img src={visualImage.dataUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                ) : (
                    <div className="text-center">
                        <UploadIcon />
                        <p className="mt-2 text-slate-500">Click to upload an image</p>
                    </div>
                )}
            </div>
            <textarea value={visualQuestion} onChange={e => setVisualQuestion(e.target.value)} placeholder="Ask a question about the image..." className="w-full p-4 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-24" />
            <button onClick={handleVisualSolve} disabled={isLoading || !visualImage || !visualQuestion.trim()} className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {isLoading ? 'Thinking...' : 'Get Answer'}
            </button>
        </div>
      )}
      
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      
      {!isWhiteboardFullscreen && (
          <>
            <SolutionDisplay solution={solution} isLoading={isLoading} image={solvedImage} />
            {solution && !isLoading && (
              <div className="mt-4 text-center">
                  <button onClick={saveNote} className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition">
                      Save to Notes
                  </button>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default SolverPage;
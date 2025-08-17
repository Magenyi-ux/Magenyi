
import React, { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, QuizQuestion, Flashcard } from '../types';
import { optimizeNote, generateQuizFromNote, generateFlashcardsFromNote } from '../services/geminiService';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

// Flashcard Viewer Component
const FlashcardViewer: React.FC<{ flashcards: Flashcard[]; onClose: () => void }> = ({ flashcards, onClose }) => {
    const [flippedStates, setFlippedStates] = useState<Record<number, boolean>>({});
    const toggleFlip = (index: number) => {
        setFlippedStates(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg">Generated Flashcards</h4>
                <button onClick={onClose} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((card, index) => (
                    <div key={index} className="perspective-1000 h-40" onClick={() => toggleFlip(index)}>
                        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${flippedStates[index] ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-white dark:bg-slate-700 rounded-lg shadow-md cursor-pointer">
                                <p className="text-center font-semibold">{card.front}</p>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-800 rounded-lg shadow-md cursor-pointer rotate-y-180">
                                <p className="text-center">{card.back}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Quiz Display Component
const QuizDisplay: React.FC<{ questions: QuizQuestion[]; onClose: () => void }> = ({ questions, onClose }) => {
    return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg">Generated Quiz</h4>
                <button onClick={onClose} className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">Close</button>
            </div>
            {questions.map((q, index) => (
                <div key={index} className="mb-4">
                    <p className="font-semibold">{index + 1}. {q.question}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                            <li key={i} className={opt === q.correctAnswer ? 'text-green-700 dark:text-green-400 font-bold' : ''}>
                                {opt} {opt === q.correctAnswer && '(Correct)'}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};


// Note Item Component
interface NoteItemProps {
    note: Note;
    onDelete: (id: string) => void;
    onGenerateQuiz: (note: Note) => void;
    onGenerateFlashcards: (note: Note) => void;
}
const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onGenerateQuiz, onGenerateFlashcards }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatContent = (text: string) => {
        const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`|\*\*.*?\*\*|!\[.*?\]\(.*?\))/g);
        return parts.map((part, index) => {
          if (!part) return null;
          if (part.startsWith('```') && part.endsWith('```')) {
            return <pre key={index} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-md my-1 text-base font-semibold text-green-600 dark:text-green-400 whitespace-pre-wrap">{part.slice(3, -3).trim()}</pre>;
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
          }
          const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
          if (imageMatch) {
              return <img key={index} src={imageMatch[2]} alt={imageMatch[1]} className="my-4 rounded-lg shadow-md max-w-full mx-auto" />;
          }
          return part.split('\n').map((line, i) => <span key={`${index}-${i}`}>{line}<br/></span>);
        });
      };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-4 overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <div>
                    <p className="font-bold text-lg">{note.title}</p>
                    <p className="text-sm text-slate-500">{new Date(note.timestamp).toLocaleString()}</p>
                </div>
                <svg className={`h-6 w-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-2 mb-4">
                      {formatContent(note.content)}
                    </div>
                    <div className="flex items-center justify-between">
                         <div className="flex gap-2">
                             <button onClick={() => onGenerateQuiz(note)} className="text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md transition">Create Quiz</button>
                             <button onClick={() => onGenerateFlashcards(note)} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1 px-3 rounded-md transition">Create Flashcards</button>
                         </div>
                        <button onClick={() => onDelete(note.id)} className="text-sm text-red-500 hover:text-red-700">Delete Note</button>
                    </div>
                </div>
            )}
        </div>
    );
};


// Main Notes Page
const NotesPage: React.FC = () => {
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeQuizNoteId, setActiveQuizNoteId] = useState<string | null>(null);
    const [activeFlashcardsNoteId, setActiveFlashcardsNoteId] = useState<string | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);
    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[] | null>(null);
    const [isAiFeatureLoading, setIsAiFeatureLoading] = useState(false);

    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [videoFileForDescription, setVideoFileForDescription] = useState<File | null>(null);
    const [videoDescription, setVideoDescription] = useState('');
    const [isLoadingVideoNote, setIsLoadingVideoNote] = useState(false);

    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleStartListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition API is not supported in this browser.");
            return;
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(prev => prev + finalTranscript + interimTranscript.substring(prev.length));
        };
        
        recognitionRef.current.start();
        setIsListening(true);
    };

    const handleFinishListening = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        setIsLoading(true);

        const optimizedContent = await optimizeNote(transcript);
        
        const newNote: Note = {
            id: new Date().toISOString(),
            title: `Voice Note - ${new Date().toLocaleDateString()}`,
            content: optimizedContent,
            rawContent: transcript,
            subject: 'General',
            timestamp: Date.now(),
        };

        setNotes(prevNotes => [newNote, ...prevNotes]);
        setTranscript('');
        setIsLoading(false);
    };

    const deleteNote = (id: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            setNotes(notes.filter(note => note.id !== id));
        }
    };

    const handleGenerateQuiz = async (note: Note) => {
        if (activeQuizNoteId === note.id) {
            setActiveQuizNoteId(null);
            setGeneratedQuiz(null);
            return;
        }
        setIsAiFeatureLoading(true);
        setActiveFlashcardsNoteId(null);
        setGeneratedFlashcards(null);
        const quiz = await generateQuizFromNote(note.content);
        setGeneratedQuiz(quiz);
        setActiveQuizNoteId(note.id);
        setIsAiFeatureLoading(false);
    };

    const handleGenerateFlashcards = async (note: Note) => {
        if (activeFlashcardsNoteId === note.id) {
            setActiveFlashcardsNoteId(null);
            setGeneratedFlashcards(null);
            return;
        }
        setIsAiFeatureLoading(true);
        setActiveQuizNoteId(null);
        setGeneratedQuiz(null);
        const flashcards = await generateFlashcardsFromNote(note.content);
        setGeneratedFlashcards(flashcards);
        setActiveFlashcardsNoteId(note.id);
        setIsAiFeatureLoading(false);
    };

    const handleImportFileClick = () => fileInputRef.current?.click();
    const handleImportVideoClick = () => videoInputRef.current?.click();

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoadingFile(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            if (content) {
                const optimizedContent = await optimizeNote(content);
                const newNote: Note = {
                    id: new Date().toISOString(),
                    title: `Imported Note: ${file.name}`,
                    content: optimizedContent,
                    rawContent: content,
                    subject: 'General',
                    timestamp: Date.now(),
                };
                setNotes(prev => [newNote, ...prev]);
            }
            setIsLoadingFile(false);
        };
        reader.onerror = () => {
            console.error("Failed to read file");
            alert("Failed to read the selected file.");
            setIsLoadingFile(false);
        }
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleVideoImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setVideoFileForDescription(file);
        event.target.value = '';
    };
    
    const handleCreateVideoNote = async () => {
        if (!videoDescription.trim() || !videoFileForDescription) return;
        setIsLoadingVideoNote(true);
        const optimizedContent = await optimizeNote(videoDescription);

        const newNote: Note = {
            id: new Date().toISOString(),
            title: `Video Note: ${videoFileForDescription.name}`,
            content: optimizedContent,
            rawContent: videoDescription,
            subject: 'General',
            timestamp: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
        handleCancelVideoNote();
        setIsLoadingVideoNote(false);
    };

    const handleCancelVideoNote = () => {
        setVideoFileForDescription(null);
        setVideoDescription('');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">My Study Notes</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold mb-2">AI Note Taker</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">Dictate your notes, import a text file, or add a note for a video.</p>
                {isListening && (
                    <textarea value={transcript} readOnly className="w-full h-32 p-2 border rounded-md bg-slate-100 dark:bg-slate-700 mb-4" placeholder="Listening..." />
                )}
                <div className="flex flex-wrap gap-4">
                    {!isListening ? (
                        <button onClick={handleStartListening} disabled={isLoadingFile || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-indigo-400">Start Listening</button>
                    ) : (
                        <button onClick={handleFinishListening} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:bg-red-400">
                           {isLoading && <LoadingSpinner />}
                           {isLoading ? 'Optimizing...' : 'Finish & Optimize Note'}
                        </button>
                    )}
                     <button onClick={handleImportFileClick} disabled={isLoadingFile || isListening || isLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:bg-teal-400">
                        {isLoadingFile && <LoadingSpinner />}
                        {isLoadingFile ? 'Importing...' : 'Import Text File'}
                     </button>
                     <button onClick={handleImportVideoClick} disabled={isLoadingFile || isListening || isLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-sky-400">
                         Add Video Note
                     </button>
                </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".txt,.md" />
                <input type="file" ref={videoInputRef} onChange={handleVideoImport} style={{ display: 'none' }} accept="video/*" />
            </div>

            {videoFileForDescription && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 transition-all animate-fade-in">
                    <h3 className="text-xl font-bold mb-2">Create Note for "{videoFileForDescription.name}"</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Describe the key points or summary of the video. The AI will structure it into a clean note.</p>
                    <textarea
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        className="w-full h-32 p-2 border rounded-md bg-slate-100 dark:bg-slate-700 mb-4 focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., 'This video explains the quadratic formula, how to derive it, and provides two examples...'"
                    />
                    <div className="flex gap-4">
                        <button onClick={handleCreateVideoNote} disabled={isLoadingVideoNote || !videoDescription.trim()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:bg-green-400">
                            {isLoadingVideoNote && <LoadingSpinner />}
                            {isLoadingVideoNote ? 'Creating...' : 'Create Note'}
                        </button>
                        <button onClick={handleCancelVideoNote} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {notes.length > 0 ? (
                <div>
                    {notes.map(note => (
                        <React.Fragment key={note.id}>
                            <NoteItem note={note} onDelete={deleteNote} onGenerateQuiz={handleGenerateQuiz} onGenerateFlashcards={handleGenerateFlashcards} />
                            {isAiFeatureLoading && (activeQuizNoteId === note.id || activeFlashcardsNoteId === note.id) && <p className="text-center my-2">AI is generating content...</p>}
                            {activeQuizNoteId === note.id && generatedQuiz && <QuizDisplay questions={generatedQuiz} onClose={() => setActiveQuizNoteId(null)} />}
                            {activeFlashcardsNoteId === note.id && generatedFlashcards && <FlashcardViewer flashcards={generatedFlashcards} onClose={() => setActiveFlashcardsNoteId(null)} />}
                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-lg shadow-md">
                    <p className="text-2xl mb-4">📚</p>
                    <h3 className="text-xl font-semibold mb-2">Your notebook is empty.</h3>
                    <p className="text-slate-500">Use the AI Note Taker or save a solution from the 'Solver' tab to get started.</p>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
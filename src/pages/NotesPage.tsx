
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, QuizQuestion, Flashcard, Page } from '../types';
import { optimizeNote, generateQuizFromNote, generateFlashcardsFromNote, generateExplanation, generateAudioRecapScript, generateExplainerVideo } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';
import QuizReadyModal from '../components/QuizReadyModal';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useNotification } from '../hooks/useNotification';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface NotesPageProps { navigate: (page: Page) => void; }
type ModalType = 'explanation' | 'audio' | 'video' | 'flashcards' | null;

const NotesPage: React.FC<NotesPageProps> = ({ navigate }) => {
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { speak, availableVoices } = useSpeech();
    const { logActivity } = useActivityLogger();
    const { showNotification } = useNotification();

    const [modalOpen, setModalOpen] = useState<ModalType>(null);
    const [modalNote, setModalNote] = useState<Note | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [explanationData, setExplanationData] = useState<{ script: string, imageUrl: string | null } | null>(null);
    const [audioRecapData, setAudioRecapData] = useState<{ script: string }>({ script: '' });
    const [videoData, setVideoData] = useState<{ url: string | null, progress: string }>({ url: null, progress: '' });
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isQuizReady, setIsQuizReady] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualContent, setManualContent] = useState('');

    const handleCreateNote = (content: string, type: 'voice' | 'file' | 'video', rawContent?: string) => {
        const title = content.substring(0, 40).split('\n')[0] + '...';
        const newNote: Note = { id: new Date().toISOString(), subject: 'General', title, content, timestamp: Date.now(), rawContent };
        setNotes([newNote, ...notes]);
        if (type === 'voice') logActivity('NOTE_CREATED_VOICE', { title: newNote.title });
        else if (type === 'file') logActivity('NOTE_CREATED_FILE', { title: newNote.title });
        else if (type === 'video') logActivity('NOTE_CREATED_VIDEO', { title: newNote.title });
        setViewMode('list');
    };
    
    const handleSaveManualNote = () => {
        if (!manualTitle.trim() || !manualContent.trim()) {
            showNotification("Title and content cannot be empty.", 'error');
            return;
        }
        const newNote: Note = {
            id: new Date().toISOString(),
            subject: 'General',
            title: manualTitle,
            content: manualContent,
            timestamp: Date.now(),
        };
        setNotes([newNote, ...notes]);
        logActivity('NOTE_CREATED_MANUAL', { title: newNote.title });
        showNotification("Note saved successfully!", 'success');
        setManualTitle('');
        setManualContent('');
        setViewMode('list');
    };

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { showNotification("Speech Recognition API is not supported in this browser.", 'error'); return; }
        const recognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-US';
        recognitionRef.current = recognition;
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = async (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
                setIsLoading(true);
                const optimized = await optimizeNote(transcript);
                handleCreateNote(optimized, 'voice', transcript);
                setIsLoading(false);
            }
        };
        recognition.start();
    };

    const stopRecording = () => recognitionRef.current?.stop();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = async (event) => {
                setIsLoading(true);
                const optimized = await optimizeNote(event.target?.result as string);
                handleCreateNote(optimized, 'file');
                setIsLoading(false);
            };
            reader.readAsText(file);
        }
    };

    const generateAndShowQuiz = async (note: Note) => {
        setIsLoading(true);
        const questions = await generateQuizFromNote(note.content);
        if (questions) {
            sessionStorage.setItem('activeQuiz', JSON.stringify(questions));
            logActivity('NOTE_QUIZ_GENERATED', { noteId: note.id });
            setIsQuizReady(true);
        } else showNotification("Failed to generate quiz.", 'error');
        setIsLoading(false);
    };

    const beginQuiz = () => { setIsQuizReady(false); navigate('Quiz'); };
    const generateAndShowFlashcards = async (note: Note) => { setIsLoading(true); setModalNote(note); const cards = await generateFlashcardsFromNote(note.content); if (cards) { setFlashcards(cards); logActivity('NOTE_FLASHCARDS_GENERATED', { noteId: note.id }); setModalOpen('flashcards'); } else showNotification("Failed to generate flashcards.", 'error'); setIsLoading(false); };
    const handleExplain = async (note: Note) => { setIsLoading(true); setModalNote(note); try { const data = await generateExplanation(note.content); setExplanationData(data); logActivity('NOTE_EXPLAINED', { noteId: note.id }); setModalOpen('explanation'); } catch (e: any) { showNotification(e.message, 'error'); } setIsLoading(false); };
    const handleAudioRecap = async (note: Note) => { setIsLoading(true); setModalNote(note); try { const script = await generateAudioRecapScript(note.content); setAudioRecapData({ script }); logActivity('AUDIO_RECAP_GENERATED', { noteId: note.id }); setModalOpen('audio'); } catch (e) { showNotification("Failed to generate audio recap.", 'error'); } setIsLoading(false); };
    const handleExplainerVideo = async (note: Note) => { setIsLoading(true); setModalNote(note); setModalOpen('video'); try { const url = await generateExplainerVideo(note.content, (progress) => setVideoData({ url: null, progress })); setVideoData({ url, progress: 'Video ready!' }); logActivity('VIDEO_GENERATED', { noteId: note.id }); } catch (e: any) { setVideoData({ url: null, progress: e.message }); } setIsLoading(false); };

    const closeModal = () => {
        window.speechSynthesis.cancel();
        if (videoData.url && videoData.url.startsWith('blob:')) {
            URL.revokeObjectURL(videoData.url);
        }
        setModalOpen(null); setModalNote(null); setExplanationData(null); setFlashcards([]); setAudioRecapData({ script: '' }); setVideoData({ url: null, progress: '' }); setIsSpeaking(false);
    };

    useEffect(() => {
        return () => {
            if (videoData.url && videoData.url.startsWith('blob:')) {
                URL.revokeObjectURL(videoData.url);
            }
        };
    }, [videoData.url]);
    
    const handlePlayStop = (script: string) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = speak(script);
            if (utterance) {
                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
            }
        }
    };

    const renderNoteContent = (content: string) => <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;

    return (
        <div className="max-w-4xl mx-auto">
            {viewMode === 'list' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">My Notes</h2>
                        <button onClick={() => setViewMode('create')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">Create Note</button>
                    </div>
                    {notes.length > 0 ? (
                        <div className="space-y-4">
                            {notes.map(note => (
                                <div key={note.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md transition hover:shadow-lg">
                                    <div className="cursor-pointer" onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}>
                                        <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{note.title}</h3>
                                        <p className="text-sm text-slate-500">{new Date(note.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    {selectedNote?.id === note.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            {renderNoteContent(note.content)}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button onClick={() => generateAndShowQuiz(note)} className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-full transition">Create Quiz</button>
                                                <button onClick={() => generateAndShowFlashcards(note)} className="text-xs bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-3 rounded-full transition">Create Flashcards</button>
                                                <button onClick={() => handleExplain(note)} className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition">Tutor Me</button>
                                                <button onClick={() => handleAudioRecap(note)} className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-3 rounded-full transition">Audio Recap</button>
                                                <button onClick={() => handleExplainerVideo(note)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-full transition">Explainer Video</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-500"><p>No notes yet. Click 'Create Note' to get started!</p></div>
                    )}
                </div>
            )}
            {viewMode === 'create' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Create a New Note</h2>
                        <button onClick={() => setViewMode('list')} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">← Back to Notes</button>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="note-title" className="block text-lg font-semibold mb-2">Note Title</label>
                                <input
                                    id="note-title"
                                    type="text"
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                    placeholder="e.g., Photosynthesis Key Concepts"
                                    className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="note-content" className="block text-lg font-semibold mb-2">Note Content</label>
                                <textarea
                                    id="note-content"
                                    value={manualContent}
                                    onChange={(e) => setManualContent(e.target.value)}
                                    placeholder="Start typing your notes here... You can use Markdown for formatting."
                                    rows={10}
                                    className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveManualNote} className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">
                            Save Note
                        </button>
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-center text-slate-700 dark:text-slate-300">Or use AI Note Tools</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-bold mb-4">Record Live Lecture</h3>
                                <p className="text-slate-500 mb-4">Record audio and our AI will transcribe and organize it into a structured note.</p>
                                <button onClick={isRecording ? stopRecording : startRecording} disabled={isLoading || (isRecording && !availableVoices)} className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-slate-400`}>
                                    {isLoading ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 10v4M5 11v3a7 7 0 0014 0v-3m-7-5a3 3 0 013 3v2a3 3 0 01-6 0v-2a3 3 0 013-3z" /></svg>}
                                </button>
                                {isRecording && <p className="mt-4 text-red-500 animate-pulse">Recording... Click to stop.</p>}
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-bold mb-4">Upload a File</h3>
                                <p className="text-slate-500 mb-4">Upload a .txt file and we'll convert it into an optimized note.</p>
                                <label className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition cursor-pointer">
                                    {isLoading ? 'Processing...' : 'Choose File'}
                                    <input type="file" accept=".txt" onChange={handleFileUpload} disabled={isLoading} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <QuizReadyModal isOpen={isQuizReady} onClose={() => setIsQuizReady(false)} onBeginQuiz={beginQuiz} />
            {modalOpen === 'explanation' && explanationData && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={closeModal}>
                    <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full relative animate-fade-in" onClick={e => e.stopPropagation()}>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white"><CloseIcon /></button>
                        <h3 className="text-2xl font-bold mb-4">Tutor Me: {modalNote?.title}</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/2 h-64 bg-slate-900 rounded-lg flex items-center justify-center">{explanationData.imageUrl ? <img src={explanationData.imageUrl} alt="Visual Aid" className="max-h-full max-w-full rounded" /> : <p>Visual aid not available.</p>}</div>
                            <div className="w-full md:w-1/2">
                                <p className="text-slate-300 mb-4">{explanationData.script}</p>
                                <button onClick={() => handlePlayStop(explanationData.script)} className="text-indigo-400 hover:text-white transition">{isSpeaking ? <PauseIcon /> : <PlayIcon />}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {modalOpen === 'audio' && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={closeModal}>
                    <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white"><CloseIcon /></button>
                        <h3 className="text-2xl font-bold mb-4">Audio Recap</h3>
                        <p className="text-slate-400 mb-6">Listen to a podcast-style summary of your note.</p>
                        <button onClick={() => handlePlayStop(audioRecapData.script)} className="text-indigo-400 hover:text-white transition">{isSpeaking ? <PauseIcon /> : <PlayIcon />}</button>
                    </div>
                </div>
            )}
            {modalOpen === 'video' && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={closeModal}>
                     <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white"><CloseIcon /></button>
                        <h3 className="text-2xl font-bold mb-4">Explainer Video</h3>
                        {videoData.url ? (
                            <div>
                                <p className="text-slate-300 mb-4">{videoData.progress}</p>
                                <video src={videoData.url} controls autoPlay className="w-full rounded-lg">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-center my-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div></div>
                                <p className="text-slate-300">{videoData.progress || 'Initializing...'}</p>
                                <p className="text-xs text-slate-500 mt-2">Video generation can take a few minutes.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {modalOpen === 'flashcards' && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={closeModal}>
                     <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full relative animate-fade-in" onClick={e => e.stopPropagation()}>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white"><CloseIcon /></button>
                        <h3 className="text-2xl font-bold mb-4 text-center">Flashcards</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[60vh] overflow-y-auto p-2">
                           {flashcards.map((card, i) => <div key={i} className="bg-slate-700 p-4 rounded-lg flex flex-col justify-between"><div className="font-bold mb-2">{card.front}</div><div className="text-sm text-slate-300 pt-2 border-t border-slate-600">{card.back}</div></div>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
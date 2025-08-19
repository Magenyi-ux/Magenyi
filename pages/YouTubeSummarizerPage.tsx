
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note } from '../types';
import { summarizeYouTubeURL } from '../services/geminiService';
import { useActivityLogger } from '../hooks/useActivityLogger';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

const YouTubeSummarizerPage: React.FC = () => {
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [url, setUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultTitle, setResultTitle] = useState('');
    const { logActivity } = useActivityLogger();

    const handleSummarize = async () => {
        if (!url.trim() || !(url.includes('youtube.com') || url.includes('youtu.be'))) {
            setError('Please paste a valid YouTube URL.');
            return;
        }
        setError('');
        setIsLoading(true);
        setSummary('');

        try {
            const result = await summarizeYouTubeURL(url);
            if (!result) {
                throw new Error("Failed to get a summary from the AI.");
            }
            setSummary(result);
            setResultTitle(`Summary of ${url}`);
        } catch (e) {
            console.error(e);
            setError("Sorry, an error occurred while summarizing. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveNote = () => {
        if (!summary) return;
        
        const newNote: Note = {
            id: new Date().toISOString(),
            title: resultTitle,
            subject: 'YouTube',
            content: summary,
            timestamp: Date.now(),
        };

        setNotes([newNote, ...notes]);
        logActivity('YOUTUBE_SUMMARY_SAVED', { title: newNote.title.substring(0, 50) });
        alert("Summary saved to your notes!");
    };
    
    const renderMarkdown = (text: string) => {
      const lines = text.split('\n');
      const elements = [];
      let listItems = [];
    
      const flushList = () => {
        if (listItems.length > 0) {
          elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">{listItems}</ul>);
          listItems = [];
        }
      };
    
      lines.forEach((line, i) => {
        if (line.startsWith('### ')) {
          flushList();
          elements.push(<h3 key={i} className="font-bold text-lg mt-4 mb-2">{line.substring(4)}</h3>);
          return;
        }
        if (line.startsWith('## ')) {
          flushList();
          elements.push(<h2 key={i} className="font-bold text-xl mt-4 mb-2">{line.substring(3)}</h2>);
          return;
        }
        if (line.startsWith('# ')) {
          flushList();
          elements.push(<h1 key={i} className="font-bold text-2xl mt-4 mb-2">{line.substring(2)}</h1>);
          return;
        }
        if (line.startsWith('* ')) {
          const content = line.substring(2)
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-500 hover:underline">$1</a>');
          listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: content }}></li>);
          return;
        }
    
        flushList();
        if (line.trim() !== '') {
           const content = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
           elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: content }}></p>);
        }
      });
    
      flushList();
      return elements;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">YouTube Video Summarizer</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 space-y-4">
                <div>
                    <label htmlFor="youtube-url" className="block text-lg font-semibold mb-2">YouTube Video URL</label>
                    <input
                        id="youtube-url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 <div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-md text-sm text-yellow-800 dark:text-yellow-200 animate-fade-in">
                    <strong>Note:</strong> Summaries are generated using Google Search and may not reflect the full video content. This works best for popular or well-documented videos.
                </div>
                <button
                    onClick={handleSummarize}
                    disabled={isLoading || !url.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Summarizing...' : 'Summarize from URL'}
                </button>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            {(isLoading || summary) && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
                    <h3 className="text-2xl font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Summary</h3>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                        {summary ? (
                            renderMarkdown(summary)
                        ) : (
                           <div className="space-y-3">
                                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                           </div>
                        )}
                    </div>

                    {!isLoading && summary && (
                        <div className="text-center mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <button
                                onClick={handleSaveNote}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition"
                            >
                                Save to Notes
                            </button>
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

export default YouTubeSummarizerPage;

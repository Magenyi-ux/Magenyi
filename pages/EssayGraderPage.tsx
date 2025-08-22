import React, { useState } from 'react';
import { gradeEssayStream } from '../services/geminiService';
import { useActivityLogger } from '../hooks/useActivityLogger';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
const BlinkingCursor: React.FC = () => <span className="inline-block w-2 h-4 bg-slate-700 dark:bg-slate-300 animate-pulse ml-1 align-bottom"></span>;

const MarkdownRenderer: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
    // A simple markdown renderer to handle headings, bold text, and lists.
    const sections = content.split(/(?=###\s)/g);
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none text-left">
            {sections.map((section, index) => {
                if (!section.trim()) return null;
                const lines = section.trim().split('\n');
                const title = lines[0].replace('###', '').trim();
                const items = lines.slice(1).map((line, i) => {
                     const formattedLine = line.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    if (line.trim().startsWith('- ')) {
                        return <li key={i} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
                    }
                    return <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                });
                const listItems = items.filter(item => item.type === 'li');
                const otherItems = items.filter(item => item.type !== 'li');

                return (
                    <div key={index} className="mb-4">
                        <h3 className="font-bold text-lg mb-2">{title}</h3>
                        {otherItems}
                        {listItems.length > 0 && <ul className="list-disc pl-5 space-y-1">{listItems}</ul>}
                    </div>
                );
            })}
            {isStreaming && <BlinkingCursor />}
        </div>
    );
};


const EssayGraderPage: React.FC = () => {
    const [essay, setEssay] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { logActivity } = useActivityLogger();

    const handleGradeEssay = async () => {
        if (!essay.trim()) return;
        setIsLoading(true);
        setFeedback('');
        
        try {
            const stream = gradeEssayStream(essay);
            let fullFeedback = '';
            for await (const chunk of stream) {
                fullFeedback += chunk;
                setFeedback(fullFeedback);
            }
            logActivity('ESSAY_GRADED');
        } catch(e) {
            console.error(e);
            setFeedback("Sorry, an error occurred while grading your essay.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">AI Essay Grader</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                Paste your essay below to get instant, personalized feedback on your writing.
            </p>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Your Essay</h3>
                    <textarea
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Paste your essay here..."
                        className="w-full h-96 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <button
                        onClick={handleGradeEssay}
                        disabled={isLoading || !essay.trim()}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                    >
                        {isLoading && <LoadingSpinner />}
                        {isLoading ? 'Grading...' : 'Grade My Essay'}
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Feedback</h3>
                    {isLoading && !feedback ? (
                         <div className="space-y-4 pt-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mt-6 animate-pulse"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                         </div>
                    ) : feedback ? (
                        <MarkdownRenderer content={feedback} isStreaming={isLoading} />
                    ) : (
                        <p className="text-slate-500 pt-4 text-center">Your feedback will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EssayGraderPage;

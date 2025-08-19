

import React, { useState } from 'react';
import { submitSuggestion } from '../services/geminiService';
import { useActivityLogger } from '../hooks/useActivityLogger';

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

const SuggestionsPage: React.FC = () => {
    const [category, setCategory] = useState('Feature Request');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const { logActivity } = useActivityLogger();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            setError('Please enter your feedback before submitting.');
            return;
        }
        setError('');
        setConfirmation('');
        setIsLoading(true);

        try {
            const aiResponse = await submitSuggestion(category, message);
            setConfirmation(aiResponse);
            logActivity('SUGGESTION_SUBMITTED', { category });
            setMessage(''); // Clear the form on success
            setCategory('Feature Request');
        } catch (e) {
            console.error(e);
            setError("Sorry, we couldn't submit your feedback at this time. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Suggestion Box</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                Have an idea for a new feature? Found a bug? Let us know! We value your feedback.
            </p>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <label htmlFor="category" className="block text-lg font-semibold mb-2">Category</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option>Feature Request</option>
                        <option>Bug Report</option>
                        <option>General Feedback</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="message" className="block text-lg font-semibold mb-2">Your Feedback</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what you're thinking..."
                        rows={6}
                        className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Submitting...' : 'Send Feedback'}
                </button>
            </form>

            {error && <p className="text-red-500 text-center mt-4 animate-fade-in">{error}</p>}
            
            {confirmation && (
                <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/50 rounded-lg text-green-800 dark:text-green-200 animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Thank You!</h3>
                    <p>{confirmation}</p>
                </div>
            )}
        </div>
    );
};

export default SuggestionsPage;

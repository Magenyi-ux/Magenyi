
import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChatMessage } from '../types';
import { getGeneralChatResponse } from '../services/geminiService';

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const UserIcon = () => <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center font-bold text-white flex-shrink-0">U</div>;
const AiIcon = () => <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0">AI</div>;

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderContent = () => {
    return content.split('\n').map((line, index) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Code blocks (simple)
      line = line.replace(/`(.*?)`/g, '<code class="bg-slate-200 dark:bg-slate-600 px-1 rounded-sm">$1</code>');
      
      // Basic list items
      if (line.trim().startsWith('* ')) {
        return <li key={index} className="ml-5" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
      }
      
      return <p key={index} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return <div className="prose prose-slate dark:prose-invert max-w-none">{renderContent()}</div>;
};


const GeneralAiPage: React.FC = () => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('general-chat-history', []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForApi = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const aiResponseContent = await getGeneralChatResponse(input, historyForApi as any);
    const aiMessage: ChatMessage = { role: 'model', content: aiResponseContent };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the entire chat history?')) {
        setMessages([]);
    }
  };


  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">General AI Chat</h2>
        <button 
            onClick={handleClearChat}
            className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition disabled:opacity-50"
            disabled={messages.length === 0 || isLoading}
        >
            Clear Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'model' && <AiIcon />}
            <div className={`max-w-xl p-3 rounded-lg shadow ${message.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <MarkdownRenderer content={message.content} />
            </div>
            {message.role === 'user' && <UserIcon />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
             <AiIcon />
             <div className="max-w-xl p-3 rounded-lg shadow bg-slate-100 dark:bg-slate-700 flex items-center space-x-2">
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            rows={1}
            style={{ maxHeight: '150px' }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneralAiPage;

import React from 'react';

interface SolutionDisplayProps {
  solution: string;
  isLoading: boolean;
  image?: string | null;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
  </div>
);

const BlinkingCursor: React.FC = () => (
    <span className="inline-block w-2.5 h-5 bg-slate-700 dark:bg-slate-300 animate-pulse ml-1 align-bottom"></span>
);

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, isLoading, image }) => {
  const formatSolution = (text: string) => {
    // This regex now also handles markdown for lists, which Gemini often uses.
    const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`|\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        return (
          <pre key={index} className="bg-slate-200 dark:bg-slate-700 p-4 rounded-md my-2 text-lg font-semibold text-green-600 dark:text-green-400 whitespace-pre-wrap">
            {part.slice(3, -3).trim()}
          </pre>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
       return part.split('\n').map((line, i) => {
          if (line.trim().startsWith('* ')) {
            return <li key={`${index}-${i}`} className="ml-5 list-disc">{line.substring(2)}</li>;
          }
          return <p key={`${index}-${i}`}>{line}</p>;
       });
    });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 min-h-[200px] mt-6">
      <h3 className="text-xl font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Solution</h3>
      
      {image && (
        <div className="mb-4 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Your Drawing:</p>
            <img src={image} alt="User's drawing from whiteboard" className="w-full h-auto rounded-md" style={{ background: 'white' }} />
        </div>
      )}

      {isLoading && !solution ? (
        <LoadingSpinner />
      ) : solution ? (
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-2">
            {formatSolution(solution)}
            {isLoading && <BlinkingCursor />}
        </div>
      ) : (
        <div className="text-center text-slate-500 pt-8">
          <p>Your step-by-step solution will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;

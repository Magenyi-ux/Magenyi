
import React, { useState } from 'react';

interface SetupPageProps {
  onComplete: (field: string | null) => void;
}

const STUDY_FIELDS = [
  { name: 'Mathematics', icon: '🔢' },
  { name: 'Computer Science', icon: '💻' },
  { name: 'Physics', icon: '⚛️' },
  { name: 'Biology', icon: '🧬' },
  { name: 'History', icon: '📜' },
  { name: 'Literature', icon: '📚' },
];

const SetupPage: React.FC<SetupPageProps> = ({ onComplete }) => {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-fade-in text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Personalize Your Learning Journey
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Select your primary field of study to get tailored hints and facts on your home page.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {STUDY_FIELDS.map((field) => (
            <button
              key={field.name}
              onClick={() => setSelectedField(field.name)}
              className={`p-4 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2
                ${selectedField === field.name
                  ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500'
                  : 'bg-white dark:bg-slate-700 border-transparent'
                }`
              }
            >
              <div className="text-4xl mb-2">{field.icon}</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{field.name}</h3>
            </button>
          ))}
        </div>

        <div className="pt-4">
          <button
            onClick={() => onComplete(selectedField)}
            disabled={!selectedField}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            Continue
          </button>
          <button
            onClick={() => onComplete(null)}
            className="mt-4 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Skip for now
          </button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
          *Skipping means you won't see helpful hints and fun facts related to your studies.
        </p>
      </div>
    </div>
  );
};

export default SetupPage;

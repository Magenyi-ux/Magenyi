import React, { useState } from 'react';

interface SetupPageProps {
  onComplete: (studyField: string | null) => void;
}

const SetupPage: React.FC<SetupPageProps> = ({ onComplete }) => {
  const [studyField, setStudyField] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(studyField || null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl text-center animate-fade-in">
        <h1 className="text-3xl font-extrabold text-black">Welcome to LearnSphere AI!</h1>
        <p className="text-lg text-slate-600">
          To personalize your experience, please tell us your primary field of study.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="studyField" className="sr-only">Field of Study</label>
            <input
              id="studyField"
              name="studyField"
              type="text"
              value={studyField}
              onChange={(e) => setStudyField(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="e.g., Computer Science, History, Biology"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400"
          >
            Get Started
          </button>
        </form>
        <button
          onClick={() => onComplete(null)}
          className="text-sm text-slate-500 hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default SetupPage;
import React from 'react';

const ApiKeyError: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-6">
          Configuration Error
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          The application is missing the required API key for Google's Gemini API.
        </p>
        <div className="mt-6 text-left bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
          <p className="font-semibold text-slate-800 dark:text-slate-200">To fix this issue:</p>
          <ul className="list-disc list-inside mt-2 space-y-2 text-slate-700 dark:text-slate-300">
            <li>If you are the developer, you need to set up an environment variable.</li>
            <li>In your Vercel project settings, add a new Environment Variable named <code className="bg-slate-200 dark:bg-slate-700 font-mono p-1 rounded">VITE_API_KEY</code>.</li>
            <li>The value should be your Gemini API key from Google AI Studio.</li>
            <li>After adding the variable, you must redeploy your project for the change to take effect.</li>
          </ul>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Once the API key is configured correctly, the application will load.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyError;

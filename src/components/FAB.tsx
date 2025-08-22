
import React from 'react';

interface FABProps {
  onClick: () => void;
}

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 10v4M5 11v3a7 7 0 0014 0v-3m-7-5a3 3 0 013 3v2a3 3 0 01-6 0v-2a3 3 0 013-3z" />
    </svg>
);

const FAB: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-10"
      aria-label="Open Voice Assistant"
    >
      <MicrophoneIcon />
    </button>
  );
};

export default FAB;
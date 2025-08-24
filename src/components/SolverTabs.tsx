


import React from 'react';

type SolverMode = 'text' | 'whiteboard' | 'visual';

interface SolverTabsProps {
  activeTab: SolverMode;
  onTabChange: (tab: SolverMode) => void;
}

const SolverTabs: React.FC<SolverTabsProps> = ({ activeTab, onTabChange }) => {
  const tabStyles = "flex-1 py-3 text-center font-semibold cursor-pointer transition-colors duration-200";
  const activeStyles = "text-black border-b-2 border-black";
  const inactiveStyles = "text-slate-500 hover:text-slate-700";

  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        onClick={() => onTabChange('text')}
        className={`${tabStyles} ${activeTab === 'text' ? activeStyles : inactiveStyles}`}
      >
        Text Input
      </button>
      <button
        onClick={() => onTabChange('whiteboard')}
        className={`${tabStyles} ${activeTab === 'whiteboard' ? activeStyles : inactiveStyles}`}
      >
        Whiteboard
      </button>
      <button
        onClick={() => onTabChange('visual')}
        className={`${tabStyles} ${activeTab === 'visual' ? activeStyles : inactiveStyles}`}
      >
        Visual Q&A
      </button>
    </div>
  );
};

export default SolverTabs;
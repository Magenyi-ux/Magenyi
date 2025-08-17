
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  currentPage: Page;
}

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ onMenuClick, currentPage }) => {
  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md h-16 flex items-center px-4 z-10">
      <button onClick={onMenuClick} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        <MenuIcon/>
      </button>
      <h1 className="text-xl font-bold ml-4">{currentPage}</h1>
    </header>
  );
};

export default Header;

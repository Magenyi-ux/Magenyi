
import React from 'react';
import { NavItem, Page } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPage: Page;
  navigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, navItems, currentPage, navigate }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-xl z-30 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">LearnSphere AI</h2>
        </div>
        <nav className="mt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="px-2">
                <button
                  onClick={() => navigate(item.name)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.name
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.icon}
                  <span className="ml-4 font-semibold">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

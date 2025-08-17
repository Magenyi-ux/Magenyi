import React from 'react';
import { Page } from '../types';

interface HomePageProps {
    navigate: (page: Page) => void;
}

const FeatureCard: React.FC<{ title: string; description: string; icon: string; onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
    >
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="text-center">
        <header className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Welcome to <span className="text-indigo-600 dark:text-indigo-400">LearnSphere AI</span></h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Your personal AI-powered tutor for any subject. Get answers, practice with quizzes, and keep your study notes all in one place.</p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <FeatureCard 
                title="Problem Solver"
                description="Get step-by-step solutions for any question, from history and science to advanced calculus. Type it or draw it!"
                icon="🧮"
                onClick={() => navigate('Solver')}
            />
            <FeatureCard 
                title="Practice Mode"
                description="Sharpen your skills with an endless supply of practice questions. Track your progress and build a streak."
                icon="🎯"
                onClick={() => navigate('Practice')}
            />
            <FeatureCard 
                title="Study Notes"
                description="Save important answers to your personal notebook. Organize by subject for easy revision."
                icon="📚"
                onClick={() => navigate('Notes')}
            />
        </div>
        
        <div className="mt-16">
            <button
                onClick={() => navigate('Solver')}
                className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg"
            >
                Ask a Question Now
            </button>
        </div>
    </div>
  );
};

export default HomePage;
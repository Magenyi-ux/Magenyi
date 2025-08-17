
export type Theme = 'light' | 'dark';

export type Page = 'Home' | 'Solver' | 'Practice' | 'Notes' | 'Settings';

export interface NavItem {
  name: Page;
  icon: React.ReactNode;
}

export interface Note {
  id: string;
  subject: string;
  title: string;
  content: string;
  timestamp: number;
  rawContent?: string; // For voice notes, this holds the original transcript
}

export type Subject = 'Algebra' | 'Calculus' | 'Geometry' | 'General';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface PracticeStats {
  score: number;
  streak: number;
  questionsAttempted: number;
  correctAnswers: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

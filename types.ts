
export type Theme = 'light' | 'dark';

export type Page = 'Home' | 'Solver' | 'AI Tutor' | 'Practice' | 'Notes' | 'Settings' | 'YouTube Summarizer' | 'Suggestions' | 'Profile' | 'Quiz' | 'Essay Grader' | 'Calendar';

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

export interface UserStats {
  score: number;
  streak: number;
  questionsAttempted: number;
  correctAnswers: number;
  xp: number;
  stars: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
}

// New types for activity logging
export type ActivityType =
  | 'SOLVED_PROBLEM_TEXT'
  | 'SOLVED_PROBLEM_WHITEBOARD'
  | 'VISUAL_QUESTION_ASKED'
  | 'PRACTICE_ANSWER'
  | 'NOTE_CREATED_VOICE'
  | 'NOTE_CREATED_FILE'
  | 'NOTE_CREATED_MANUAL'
  | 'NOTE_CREATED_VIDEO'
  | 'NOTE_QUIZ_GENERATED'
  | 'NOTE_FLASHCARDS_GENERATED'
  | 'NOTE_EXPLAINED'
  | 'AUDIO_RECAP_GENERATED'
  | 'VIDEO_GENERATED'
  | 'YOUTUBE_SUMMARY_SAVED'
  | 'CHAT_MESSAGE_SENT'
  | 'SUGGESTION_SUBMITTED'
  | 'ESSAY_GRADED'
  | 'STUDY_PLAN_GENERATED';


export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number;
  details: Record<string, any>;
}

// Types for the new notification system
export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationMessage {
  message: string;
  type: NotificationType;
}
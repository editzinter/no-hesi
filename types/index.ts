// Core data types for CognifAI

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  questionCount: number;
  completedQuestions: number;
}

export interface Question {
  id: string;
  topicId: string;
  userId: string;
  question: string;
  answer: string;
  options?: string[]; // For multiple choice questions
  type: 'open' | 'multiple_choice' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  generatedByAI: boolean;
  source?: string; // If manually added
}

export interface Progress {
  id: string;
  userId: string;
  questionId: string;
  topicId: string;
  correctAnswers: number;
  totalAttempts: number;
  consecutiveCorrect?: number;
  lastAnsweredAt: Date;
  nextReviewAt: Date;
  reviewInterval: number; // in hours
  masteryLevel: number; // 0-100
  isCompleted: boolean;
  lastPerformance?: 'easy' | 'good' | 'hard' | 'again';
  averageResponseTime?: number; // in seconds
}

export interface ReviewSession {
  id: string;
  userId: string;
  topicId?: string;
  scheduledAt: Date;
  completedAt?: Date;
  questionsReviewed: number;
  correctAnswers: number;
  sessionType: 'immediate' | 'spaced' | 'manual';
  duration: number; // in seconds
}

export interface NotificationSettings {
  id: string;
  userId: string;
  enableReviewReminders: boolean;
  enableDailyGoals: boolean;
  enableStreakReminders: boolean;
  reminderTime: string; // HH:MM format
  timezone: string;
}

export interface UserStats {
  userId: string;
  totalTopics: number;
  totalQuestions: number;
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalStudyTime: number; // in minutes
  lastStudyDate: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gemini AI types
export interface GeminiQuestion {
  question: string;
  answer: string;
  options?: string[];
  type: Question['type'];
  difficulty: Question['difficulty'];
}

export interface GeminiResponse {
  questions: GeminiQuestion[];
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  TopicDetail: { topicId: string };
  QuestionDetail: { questionId: string };
  ReviewSession: { topicId?: string; sessionType: ReviewSession['sessionType'] };
  Settings: undefined;
  Profile: undefined;
};

export type TabParamList = {
  index: undefined;
  topics: undefined;
  progress: undefined;
  profile: undefined;
};

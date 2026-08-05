export type ReviewRating = 1 | 2 | 3 | 4; // 1: Again (Fail), 2: Hard, 3: Good, 4: Easy

export type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  hint?: string;
  topicTag: string; // e.g. "Feudalism", "Cell Structure", "Algorithms"
  
  // SRS SM-2 Parameters
  interval: number; // in days
  repetition: number; // total successful review count
  easeFactor: number; // default 2.5
  dueDate: string; // ISO date string (YYYY-MM-DD)
  lastReviewedAt?: string;
  
  // Analytics
  reviewHistory: {
    date: string;
    rating: ReviewRating;
  }[];
  failCount: number;
  successCount: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  color: string; // Tailwind color class or hex
  cards: Flashcard[];
}

export interface ExamQuestion {
  id: string;
  cardId: string;
  question: string;
  correctAnswer: string;
  options?: string[]; // for multiple choice
  type: 'multiple-choice' | 'written';
  topicTag: string;
}

export interface ExamResult {
  date: string;
  deckId: string;
  deckTitle: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  topicBreakdown: Record<string, { total: number; correct: number }>;
}

export interface StudyStats {
  streakDays: number;
  lastStudyDate: string;
  totalCardsReviewed: number;
  retentionRate: number; // 0 - 100%
  studyTimeMinutes: number;
}

export interface WeakTopic {
  topicTag: string;
  totalCards: number;
  failCount: number;
  successCount: number;
  accuracy: number; // percentage 0-100
  urgency: 'high' | 'medium' | 'low';
}

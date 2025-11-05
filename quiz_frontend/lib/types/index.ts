// API Types based on backend schemas

export interface URLRequest {
  url: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface FlashcardRequest {
  url: string;
  num_cards?: number;
}

export interface EssayQARequest {
  url: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  right_option: number | string; // Can be number (0, 1, 2) or string ("a", "b", "c", "0", "1", "2")
}

export interface QuizData {
  topic: string;
  category: string;
  subcategory: string;
  questions: QuizQuestion[];
}

export interface FlashcardCard {
  front: string;
  back: string;
  importance?: string;
}

export interface FlashcardData {
  topic: string;
  category: string;
  subcategory: string;
  cards: FlashcardCard[];
}

export interface EssayQAQuestion {
  question: string;
  full_answer: string;
  key_info: string[];
}

export interface EssayQAData {
  topic: string;
  category: string;
  subcategory: string;
  questions: EssayQAQuestion[];
}

export interface Topic {
  id: number;
  topic: string;
  category: string;
  subcategory: string;
  difficulty?: string;
  creation_timestamp?: string;
}

export interface QuizAttemptRequest {
  topic_id: number;
  user_id?: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  user_answers: number[];
  correct_answers: number[];
  difficulty_level?: string;
  source_type?: string;
  source_info?: string;
  question_performance?: Array<{
    question_index: number;
    is_correct: boolean;
    time_spent: number;
  }>;
}

export interface QuizAttempt {
  id: number;
  user_id?: string;
  topic_id: number;
  timestamp: string;
  score: number;
  total_questions: number;
  percentage_score: number;
  time_taken_seconds: number;
  difficulty_level?: string;
  source_type?: string;
  source_info?: string;
  topic_name?: string;
  category?: string;
  subcategory?: string;
}

export interface UserQuizHistory {
  user_id: string;
  attempts: QuizAttempt[];
  total_attempts: number;
  average_score: number;
  best_score: number;
  total_time_spent: number;
}

export interface UserAnalytics {
  user_id: string;
  total_quizzes: number;
  average_score: number;
  best_score: number;
  total_time_spent: number;
  category_attempts: Record<string, number>;
  category_accuracy: Record<string, number>;
  scores: number[];
  recent_history: QuizAttempt[];
  improvement_trend: string;
  strengths: string[];
  weaknesses: string[];
}


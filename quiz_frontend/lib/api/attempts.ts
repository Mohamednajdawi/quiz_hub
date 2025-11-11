import apiClient from './client';
import { QuizAttemptRequest, QuizAttempt, UserQuizHistory, UserAnalytics } from '../types';

export const attemptApi = {
  recordAttempt: async (request: QuizAttemptRequest): Promise<{
    message: string;
    attempt_id: number;
    timestamp: string;
    score: number;
    percentage: number;
    ai_feedback?: string;
  }> => {
    const response = await apiClient.post('/record-quiz-result', request);
    return response.data;
  },

  getUserHistory: async (userId: string): Promise<UserQuizHistory> => {
    const response = await apiClient.get(`/user-quiz-history/${userId}`);
    return response.data;
  },

  getUserAnalytics: async (userId: string): Promise<UserAnalytics> => {
    const response = await apiClient.get(`/user-analytics/${userId}`);
    return response.data;
  },

  getQuizStatistics: async (topicId: number): Promise<{
    topic: string;
    category: string;
    subcategory: string;
    total_attempts: number;
    average_score: number;
    best_score: number;
    average_time: number;
    total_time_spent: number;
  }> => {
    const response = await apiClient.get(`/quiz-statistics/${topicId}`);
    return response.data;
  },

  getAttemptDetails: async (attemptId: number): Promise<QuizAttempt & {
    topic_name: string;
    category: string;
    subcategory: string;
    user_answers: number[];
    correct_answers: number[];
    question_performance?: Array<{
      question_index: number;
      is_correct: boolean;
      time_spent: number;
    }>;
    ai_feedback?: string;
  }> => {
    const response = await apiClient.get(`/quiz-attempt/${attemptId}`);
    return response.data;
  },
};


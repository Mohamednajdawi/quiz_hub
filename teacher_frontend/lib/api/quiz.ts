import apiClient, { publicApiClient } from './client';

export interface QuizAttempt {
  id: number;
  participant_name?: string;
  timestamp: string;
  score: number;
  total_questions: number;
  percentage_score: number;
  time_taken_seconds: number;
  ai_feedback?: string;
  user_answers?: number[];
  correct_answers?: number[];
  question_performance?: Array<{
    question_id: number;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
  }>;
}

export interface QuizResults {
  quiz_id: number;
  quiz_topic: string;
  share_code?: string;
  total_attempts: number;
  attempts: QuizAttempt[];
}

export interface QuizStatistics {
  total_attempts: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  total_time_spent: number;
}

export const quizApi = {
  getSharedResults: async (topicId: number): Promise<QuizResults> => {
    const response = await apiClient.get(`/quiz/${topicId}/shared-results`);
    return response.data;
  },

  getStatistics: async (topicId: number): Promise<QuizStatistics> => {
    const response = await apiClient.get(`/quiz-statistics/${topicId}`);
    return response.data;
  },

  getDetailedAttempts: async (topicId: number): Promise<{ attempts: QuizAttempt[] }> => {
    const response = await apiClient.get(`/quiz-attempts/${topicId}/detailed`);
    return response.data;
  },

  getMyQuizzes: async (): Promise<{ topics: Array<{ id: number; topic: string; category: string }> }> => {
    const response = await apiClient.get('/quiz-topics/my');
    return response.data;
  },

  // Export quiz to PDF or DOCX
  exportQuiz: async (topicId: number, format: 'pdf' | 'docx'): Promise<Blob> => {
    const response = await apiClient.get(`/quiz/${topicId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get share code for quiz
  getShareCode: async (topicId: number): Promise<{ quiz_id: number; share_code: string | null; topic: string }> => {
    const response = await apiClient.get(`/quiz/${topicId}/share-code`);
    return response.data;
  },

  // Generate share code for quiz
  generateShareCode: async (topicId: number): Promise<{ quiz_id: number; share_code: string; topic: string }> => {
    const response = await apiClient.post(`/quiz/${topicId}/generate-share-code`);
    return response.data;
  },

  // Get quiz by share code (public, no auth)
  getQuizByShareCode: async (shareCode: string): Promise<{
    quiz_id: number;
    topic: string;
    category: string;
    subcategory: string;
    difficulty: string;
    questions: Array<{
      question: string;
      options: string[];
      right_option: number | string;
    }>;
  }> => {
    const response = await publicApiClient.get(`/quiz/share/${shareCode}`);
    return response.data;
  },

  // Submit shared quiz (public, no auth)
  submitSharedQuiz: async (
    shareCode: string,
    participantName: string,
    participantLastName: string,
    participantEmail: string,
    userAnswers: number[],
    timeTakenSeconds: number
  ): Promise<{
    message: string;
    attempt_id: number;
    score: number;
    total_questions: number;
    percentage_score: number;
    timestamp: string;
    ai_feedback?: string;
  }> => {
    // Combine name and lastname, include email in name for now (backend doesn't have separate email field yet)
    const fullName = `${participantName} ${participantLastName}${participantEmail ? ` (${participantEmail})` : ''}`;
    const response = await publicApiClient.post(`/quiz/share/${shareCode}/submit`, {
      participant_name: fullName,
      user_answers: userAnswers,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data;
  },
};


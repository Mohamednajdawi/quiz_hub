import apiClient, { publicApiClient } from './client';

export interface QuizAttempt {
  id: number;
  participant_name?: string;  // Keep for backward compatibility
  participant_first_name?: string;
  participant_last_name?: string;
  participant_email?: string;
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

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  right_option: number | string;
}

export interface QuizDetail {
  topic: string;
  category: string;
  subcategory: string;
  creation_timestamp?: string;
  questions: QuizQuestion[];
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

  getQuiz: async (topicId: number): Promise<QuizDetail> => {
    const response = await apiClient.get(`/quiz/${topicId}`);
    return response.data;
  },

  getMyQuizzes: async (): Promise<{ topics: Array<{ id: number; topic: string; category: string }> }> => {
    const response = await apiClient.get('/quiz-topics/my');
    return response.data;
  },

  updateQuestion: async (
    topicId: number,
    questionId: number,
    question: string,
    options: string[],
    rightOption: number | string
  ): Promise<QuizQuestion> => {
    const response = await apiClient.put(`/quiz/${topicId}/question/${questionId}`, {
      question,
      options,
      right_option: rightOption,
    });
    return response.data;
  },

  addQuestion: async (
    topicId: number,
    question: string,
    options: string[],
    rightOption: number | string
  ): Promise<QuizQuestion> => {
    const response = await apiClient.post(`/quiz/${topicId}/question`, {
      question,
      options,
      right_option: rightOption,
    });
    return response.data;
  },

  deleteQuestion: async (topicId: number, questionId: number): Promise<void> => {
    await apiClient.delete(`/quiz/${topicId}/question/${questionId}`);
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
    try {
      console.log('[quizApi.getShareCode] Requesting share code for topic:', topicId);
      const url = `/quiz/${topicId}/share-code`;
      console.log('[quizApi.getShareCode] Full URL:', `${apiClient.defaults.baseURL}${url}`);
      const response = await apiClient.get(url);
      console.log('[quizApi.getShareCode] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[quizApi.getShareCode] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: apiClient.defaults.baseURL,
      });
      throw error;
    }
  },

  // Generate share code for quiz
  generateShareCode: async (topicId: number): Promise<{ quiz_id: number; share_code: string; topic: string }> => {
    try {
      console.log('[quizApi.generateShareCode] Generating share code for topic:', topicId);
      const url = `/quiz/${topicId}/generate-share-code`;
      console.log('[quizApi.generateShareCode] Full URL:', `${apiClient.defaults.baseURL}${url}`);
      const response = await apiClient.post(url);
      console.log('[quizApi.generateShareCode] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[quizApi.generateShareCode] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: apiClient.defaults.baseURL,
      });
      throw error;
    }
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
    // Combine name for backward compatibility, but also send separate fields
    const fullName = `${participantName} ${participantLastName}`;
    const response = await publicApiClient.post(`/quiz/share/${shareCode}/submit`, {
      participant_name: fullName,  // Keep for backward compatibility
      participant_first_name: participantName,
      participant_last_name: participantLastName,
      participant_email: participantEmail,
      user_answers: userAnswers,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data;
  },
};


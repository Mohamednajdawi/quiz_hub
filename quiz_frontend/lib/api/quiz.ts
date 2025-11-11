import apiClient from './client';
import { URLRequest, QuizData, Topic } from '../types';

export const quizApi = {
  generateFromURL: async (request: URLRequest): Promise<QuizData> => {
    const response = await apiClient.post('/generate-quiz', request);
    return response.data;
  },

  generateFromPDF: async (
    file: File,
    numQuestions: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    projectId?: number,
    contentId?: number
  ): Promise<QuizData> => {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('num_questions', numQuestions.toString());
    formData.append('difficulty', difficulty);
    if (projectId !== undefined) {
      formData.append('project_id', projectId.toString());
    }
    if (contentId !== undefined) {
      formData.append('content_id', contentId.toString());
    }

    const response = await apiClient.post('/generate-quiz-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTopics: async (): Promise<{ topics: Topic[] }> => {
    const response = await apiClient.get('/quiz-topics');
    return response.data;
  },

  getMyTopics: async (): Promise<{ topics: Topic[] }> => {
    const response = await apiClient.get('/quiz-topics/my');
    return response.data;
  },

  getQuiz: async (topicId: number): Promise<QuizData> => {
    const response = await apiClient.get(`/quiz/${topicId}`);
    return response.data;
  },

  getShareCode: async (topicId: number): Promise<{ quiz_id: number; share_code: string | null; topic: string }> => {
    const response = await apiClient.get(`/quiz/${topicId}/share-code`);
    return response.data;
  },

  generateShareCode: async (topicId: number): Promise<{ quiz_id: number; share_code: string; topic: string }> => {
    const response = await apiClient.post(`/quiz/${topicId}/generate-share-code`);
    return response.data;
  },

  getQuizByShareCode: async (shareCode: string): Promise<QuizData & { quiz_id: number }> => {
    const response = await apiClient.get(`/quiz/share/${shareCode}`);
    return response.data;
  },

  submitSharedQuiz: async (
    shareCode: string,
    participantName: string,
    userAnswers: number[],
    timeTakenSeconds: number
  ): Promise<{
    message: string;
    attempt_id: number;
    score: number;
    total_questions: number;
    percentage_score: number;
    timestamp: string;
  }> => {
    const response = await apiClient.post(`/quiz/share/${shareCode}/submit`, {
      participant_name: participantName,
      user_answers: userAnswers,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data;
  },

  getSharedQuizResults: async (topicId: number): Promise<{
    quiz_id: number;
    quiz_topic: string;
    share_code: string | null;
    total_attempts: number;
    attempts: Array<{
      id: number;
      participant_name: string;
      timestamp: string;
      score: number;
      total_questions: number;
      percentage_score: number;
      time_taken_seconds: number;
      ai_feedback?: string;
    }>;
  }> => {
    const response = await apiClient.get(`/quiz/${topicId}/shared-results`);
    return response.data;
  },

  updateQuestion: async (
    topicId: number,
    questionId: number,
    question: string,
    options: string[],
    rightOption: number | string
  ): Promise<{ id: number; question: string; options: string[]; right_option: number | string }> => {
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
  ): Promise<{ id: number; question: string; options: string[]; right_option: number | string }> => {
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
};


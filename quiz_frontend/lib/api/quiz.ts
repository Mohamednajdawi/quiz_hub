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
};


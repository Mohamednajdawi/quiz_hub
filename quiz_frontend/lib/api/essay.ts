import apiClient from './client';
import { EssayQARequest, EssayQAData, Topic } from '../types';

export const essayApi = {
  generateFromURL: async (request: EssayQARequest): Promise<EssayQAData> => {
    const response = await apiClient.post('/generate-essay-qa', request);
    return response.data;
  },

  generateFromPDF: async (
    file: File,
    numQuestions: number = 3,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    projectId?: number,
    contentId?: number
  ): Promise<EssayQAData> => {
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

    const response = await apiClient.post('/generate-essay-qa-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTopics: async (): Promise<{ topics: Topic[] }> => {
    const response = await apiClient.get('/essay-qa-topics');
    return response.data;
  },

  getMyTopics: async (): Promise<{ topics: Topic[] }> => {
    const response = await apiClient.get('/essay-qa-topics/my');
    return response.data;
  },

  getEssayQA: async (topicId: number): Promise<EssayQAData & { id: number }> => {
    const response = await apiClient.get(`/essay-qa/${topicId}`);
    return response.data;
  },

  storeAnswer: async (
    essayId: number,
    userId: string,
    questionIndex: number,
    userAnswer: string,
    timestamp: string
  ): Promise<{ message: string; answer_id: number; ai_feedback?: string; score?: number }> => {
    const response = await apiClient.post('/store-essay-answer', {
      essay_id: essayId,
      user_id: userId,
      question_index: questionIndex,
      user_answer: userAnswer,
      timestamp,
    });
    return response.data;
  },

  storeAllAnswers: async (
    essayId: number,
    userId: string,
    answers: Array<{ question_index: number; user_answer: string }>,
    timestamp: string
  ): Promise<{ message: string; total_answers: number; ai_feedback?: string; score?: number }> => {
    const response = await apiClient.post('/store-essay-answers', {
      essay_id: essayId,
      user_id: userId,
      answers,
      timestamp,
    });
    return response.data;
  },

  getUserAnswers: async (userId: string): Promise<{
    user_id: string;
    answers: Array<{
      id: number;
      essay_topic_id: number;
      topic: string;
      category: string;
      subcategory: string;
      question_index: number;
      question: string;
      user_answer: string;
      timestamp: string;
      ai_feedback?: string;
      score?: number;
    }>;
    total_answers: number;
  }> => {
    const response = await apiClient.get(`/essay-answers/${userId}`);
    return response.data;
  },
};


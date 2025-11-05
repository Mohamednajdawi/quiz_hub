import apiClient from './client';
import { FlashcardRequest, FlashcardData, Topic } from '../types';

export const flashcardApi = {
  generateFromURL: async (request: FlashcardRequest): Promise<FlashcardData> => {
    const response = await apiClient.post('/generate-flashcards', request);
    return response.data;
  },

  generateFromPDF: async (
    file: File,
    numCards: number = 10,
    projectId?: number,
    contentId?: number
  ): Promise<FlashcardData> => {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('num_cards', numCards.toString());
    if (projectId !== undefined) {
      formData.append('project_id', projectId.toString());
    }
    if (contentId !== undefined) {
      formData.append('content_id', contentId.toString());
    }

    const response = await apiClient.post('/generate-flashcards-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTopics: async (): Promise<Topic[]> => {
    const response = await apiClient.get('/flashcard-topics');
    return response.data;
  },

  getMyTopics: async (): Promise<Topic[]> => {
    const response = await apiClient.get('/flashcard-topics/my');
    return response.data;
  },

  getFlashcards: async (topicId: number): Promise<FlashcardData> => {
    const response = await apiClient.get(`/flashcards/${topicId}`);
    return response.data;
  },
};


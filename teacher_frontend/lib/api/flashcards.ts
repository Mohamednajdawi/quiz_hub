import apiClient, { publicApiClient } from './client';

export interface Flashcard {
  front: string;
  back: string;
  importance: string;
}

export interface FlashcardTopicResponse {
  topic: string;
  category: string | null;
  subcategory: string | null;
  creation_timestamp: string | null;
  cards: Flashcard[];
}

export const flashcardsApi = {
  getByTopic: async (topicId: number): Promise<FlashcardTopicResponse> => {
    const response = await publicApiClient.get(`/flashcards/${topicId}`);
    return response.data;
  },
};



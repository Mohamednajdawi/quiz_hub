import apiClient, { publicApiClient } from './client';
import { GenerationJobStatus } from './mindmaps';

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

export interface FlashcardSummary {
  id: number;
  topic: string;
  category?: string;
  subcategory?: string;
  card_count: number;
  created_at?: string;
}

export const flashcardsApi = {
  getByTopic: async (topicId: number): Promise<FlashcardTopicResponse> => {
    const response = await publicApiClient.get(`/flashcards/${topicId}`);
    return response.data;
  },

  /**
   * Start asynchronous flashcard generation for a specific PDF in a project.
   */
  startFlashcardGenerationJob: async (
    projectId: number,
    contentId: number,
    payload: { num_cards?: number } = {}
  ): Promise<{
    job_id: number;
    status: string;
    job_type: string;
    message?: string;
  }> => {
    const { data } = await apiClient.post(
      `/student-projects/${projectId}/content/${contentId}/flashcard-generation`,
      payload
    );
    return data;
  },

  /**
   * Get the status of any generation job (quiz, essay, mind map, flashcard).
   */
  getGenerationJob: async (jobId: number): Promise<GenerationJobStatus> => {
    const { data } = await apiClient.get(`/generation-jobs/${jobId}`);
    return data;
  },

  /**
   * List flashcards that were generated from a specific PDF in a project.
   * Uses the content-scoped generated content endpoint and extracts flashcards.
   */
  getFlashcardsForContent: async (
    projectId: number,
    contentId: number
  ): Promise<FlashcardSummary[]> => {
    const { data } = await apiClient.get(
      `/student-projects/${projectId}/content/${contentId}/generated-content`
    );
    const rawFlashcards = (data?.flashcards ?? []) as Array<{
      id: number;
      topic: string;
      category?: string;
      subcategory?: string;
      card_count?: number;
      created_at?: string;
    }>;

    return rawFlashcards.map((f) => ({
      id: f.id,
      topic: f.topic,
      category: f.category,
      subcategory: f.subcategory,
      card_count: f.card_count ?? 0,
      created_at: f.created_at,
    }));
  },
};



import apiClient from './client';

export interface GenerationJob {
  id: number;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  project_id?: number;
  content_id?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  result_data?: any;
  error_message?: string;
}

export interface QuizGenerationRequest {
  num_questions?: number;
  difficulty: string;
  project_id: number;
  content_id?: number;
}

export interface FlashcardGenerationRequest {
  num_cards: number;
  project_id: number;
  content_id?: number;
}

export interface EssayGenerationRequest {
  num_questions: number;
  difficulty: string;
  project_id: number;
  content_id?: number;
}

export const generationApi = {
  generateQuiz: async (request: QuizGenerationRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('difficulty', request.difficulty);
    if (request.project_id) {
      formData.append('project_id', request.project_id.toString());
    }
    if (request.num_questions) {
      formData.append('num_questions', request.num_questions.toString());
    }
    if (request.content_id) {
      formData.append('content_id', request.content_id.toString());
    }

    const response = await apiClient.post('/generate-quiz-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateFlashcards: async (request: FlashcardGenerationRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('num_cards', request.num_cards.toString());
    if (request.project_id) {
      formData.append('project_id', request.project_id.toString());
    }
    if (request.content_id) {
      formData.append('content_id', request.content_id.toString());
    }

    const response = await apiClient.post('/generate-flashcards-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateEssays: async (request: EssayGenerationRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('num_questions', request.num_questions.toString());
    formData.append('difficulty', request.difficulty);
    if (request.project_id) {
      formData.append('project_id', request.project_id.toString());
    }
    if (request.content_id) {
      formData.append('content_id', request.content_id.toString());
    }

    const response = await apiClient.post('/generate-essay-qa-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getJobStatus: async (jobId: number): Promise<GenerationJob> => {
    const response = await apiClient.get(`/generation-jobs/${jobId}/status`);
    return response.data;
  },
};


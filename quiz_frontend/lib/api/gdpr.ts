import apiClient from './client';

export interface DataAccessResponse {
  message: string;
  requested_at: string;
  data: {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
    gender: string | null;
    is_active: boolean;
    free_tokens: number;
    referral_code: string | null;
    referred_by_code: string | null;
    created_at: string | null;
    updated_at: string | null;
    subscriptions: Array<{
      id: number;
      plan_type: string;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
      created_at: string | null;
    }>;
    payment_methods: Array<{
      id: number;
      type: string;
      last4: string;
      brand: string;
      exp_month: number;
      exp_year: number;
      created_at: string | null;
    }>;
    transactions: Array<{
      id: number;
      amount: number;
      currency: string;
      status: string;
      description: string;
      created_at: string | null;
    }>;
    quiz_attempts: Array<{
      id: number;
      topic_id: number;
      score: number;
      total_questions: number;
      percentage_score: number;
      time_taken_seconds: number;
      timestamp: string | null;
      difficulty_level: string | null;
    }>;
    quiz_topics_created: Array<{
      id: number;
      topic: string;
      category: string;
      subcategory: string;
      difficulty: string;
      creation_timestamp: string | null;
    }>;
    flashcard_topics: Array<{
      id: number;
      topic: string;
      category: string;
      subcategory: string;
      created_at: string | null;
    }>;
    essay_topics: Array<{
      id: number;
      topic: string;
      category: string;
      subcategory: string;
      created_at: string | null;
    }>;
    student_projects: Array<{
      id: number;
      name: string;
      description: string;
      created_at: string | null;
      updated_at: string | null;
    }>;
    mind_maps: Array<{
      id: number;
      title: string;
      category: string;
      subcategory: string;
      created_at: string | null;
    }>;
    token_usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    generation_jobs: Array<{
      id: number;
      job_type: string;
      status: string;
      created_at: string | null;
      completed_at: string | null;
    }>;
    referrals_sent: Array<{
      id: number;
      referred_id: string;
      status: string;
      created_at: string | null;
    }>;
  };
}

export interface DataRectificationRequest {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  email?: string;
}

export interface DataRectificationResponse {
  message: string;
  updated_fields: string[];
  updated_at: string;
}

export interface DataErasureResponse {
  message: string;
  erased_at: string;
  note: string;
}

export interface ProcessingRestrictionRequest {
  restriction_reason: string;
}

export interface ProcessingRestrictionResponse {
  message: string;
  restricted_at: string;
  reason: string;
}

export interface ObjectToProcessingRequest {
  objection_reason: string;
  processing_purpose?: string;
}

export interface ObjectToProcessingResponse {
  message: string;
  objected_at: string;
  reason: string;
  processing_purpose: string | null;
}

export const gdprApi = {
  /**
   * Article 15: Right of access
   * Get all personal data held about the user
   */
  getDataAccess: async (): Promise<DataAccessResponse> => {
    const response = await apiClient.get<DataAccessResponse>('/gdpr/data-access');
    return response.data;
  },

  /**
   * Article 16: Right to rectification
   * Update inaccurate personal data
   */
  updateDataRectification: async (
    data: DataRectificationRequest
  ): Promise<DataRectificationResponse> => {
    const response = await apiClient.put<DataRectificationResponse>(
      '/gdpr/data-rectification',
      data
    );
    return response.data;
  },

  /**
   * Article 20: Right to data portability
   * Export user data in machine-readable format
   */
  exportData: async (format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    const response = await apiClient.post(
      `/gdpr/data-export?format=${format}`,
      {},
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Article 17: Right to erasure ("right to be forgotten")
   * Delete all user data (irreversible)
   */
  deleteDataErasure: async (): Promise<DataErasureResponse> => {
    const response = await apiClient.delete<DataErasureResponse>('/gdpr/data-erasure');
    return response.data;
  },

  /**
   * Article 18: Right to restriction of processing
   * Temporarily restrict processing of user data
   */
  restrictProcessing: async (
    reason: string
  ): Promise<ProcessingRestrictionResponse> => {
    const response = await apiClient.post<ProcessingRestrictionResponse>(
      '/gdpr/processing-restriction',
      { restriction_reason: reason }
    );
    return response.data;
  },

  /**
   * Article 21: Right to object
   * Object to processing of personal data
   */
  objectToProcessing: async (
    reason: string,
    purpose?: string
  ): Promise<ObjectToProcessingResponse> => {
    const response = await apiClient.post<ObjectToProcessingResponse>(
      '/gdpr/object-processing',
      {
        objection_reason: reason,
        processing_purpose: purpose,
      }
    );
    return response.data;
  },
};


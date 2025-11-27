import apiClient from './client';

export interface AdminUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  account_type: 'free' | 'pro';
  quiz_count: number;
  flashcard_count: number;
  essay_count: number;
  mind_map_count: number;
  is_active: boolean;
  created_at?: string | null;
  free_tokens?: number | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export interface AdminStats {
  total_users: number;
  free_users: number;
  pro_users: number;
  active_users: number;
  total_quizzes: number;
  total_flashcards: number;
  total_essays: number;
  total_mind_maps: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
}

export interface AdminCheckResponse {
  is_admin: boolean;
}

export const adminApi = {
  checkAdminStatus: async (): Promise<AdminCheckResponse> => {
    const response = await apiClient.get('/admin/check');
    return response.data;
  },

  getAllUsers: async (): Promise<AdminUsersResponse> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
};


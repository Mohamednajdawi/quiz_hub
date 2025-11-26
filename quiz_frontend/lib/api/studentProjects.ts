import apiClient from './client';

export interface StudentProject {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  contents?: ProjectContent[];
  quiz_references?: number[];
  flashcard_references?: number[];
  essay_references?: number[];
  mind_map_references?: number[];
}

export interface ProjectContent {
  id: number;
  content_type: 'pdf' | 'url' | 'text';
  name: string;
  content_url?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface GenerationJobStatus {
  job_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  job_type: string;
  requested_questions?: number | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  result?: {
    quiz_id?: number;
    essay_id?: number;
    mind_map_id?: number;
    topic: string;
  } | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
}

export interface MindMapSummary {
  id: number;
  title: string;
  central_idea: string;
  category?: string;
  subcategory?: string;
  node_count: number;
  created_at?: string;
}

export interface MindMapDetail extends MindMapSummary {
  project_id: number;
  content_id?: number;
  summary?: string | null;
  key_concepts: Array<Record<string, unknown>>;
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  connections: Array<Record<string, unknown>>;
  callouts: Array<Record<string, unknown>>;
  recommended_next_steps: string[];
  metadata?: Record<string, unknown>;
}

export const studentProjectsApi = {
  listProjects: async (): Promise<StudentProject[]> => {
    const { data } = await apiClient.get('/student-projects');
    return data.projects ?? data;
  },

  createProject: async (payload: { name: string; description?: string }): Promise<StudentProject> => {
    const { data } = await apiClient.post('/student-projects', payload);
    return data.project ?? data;
  },

  getProject: async (projectId: number): Promise<StudentProject> => {
    const { data } = await apiClient.get(`/student-projects/${projectId}`);
    return data;
  },

  listContents: async (projectId: number): Promise<ProjectContent[]> => {
    const { data } = await apiClient.get(`/student-projects/${projectId}`);
    return data.contents ?? [];
  },

  uploadPdf: async (projectId: number, file: File): Promise<{ content: ProjectContent[]; errors?: string[]; partial_success?: boolean }> => {
    const form = new FormData();
    form.append('pdf_files', file);

    // For file uploads, we need to remove the default Content-Type header
    // and let the browser/axios set it automatically with the boundary
    const { data } = await apiClient.post(`/student-projects/${projectId}/content`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    // Ensure content is always an array
    if (Array.isArray(data.content)) {
      return data;
    }
    return { content: [data.content ?? data] };
  },

  uploadPdfs: async (projectId: number, files: File[]): Promise<{ content: ProjectContent[]; errors?: string[]; partial_success?: boolean }> => {
    const form = new FormData();
    files.forEach((file) => {
      form.append('pdf_files', file);
    });

    // For file uploads, we need to remove the default Content-Type header
    // and let the browser/axios set it automatically with the boundary
    const { data } = await apiClient.post(`/student-projects/${projectId}/content`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data;
  },

  generateQuizFromContent: async (
    projectId: number,
    contentId: number,
    numQuestions: number | undefined,
    difficulty: 'easy' | 'medium' | 'hard'
  ) => {
    // When using content_id, we don't need to send a file
    const form = new FormData();
    if (typeof numQuestions === 'number') {
      form.append('num_questions', String(numQuestions));
    }
    form.append('difficulty', difficulty);
    form.append('project_id', String(projectId));
    form.append('content_id', String(contentId));

    const { data } = await apiClient.post(`/generate-quiz-from-pdf`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data;
  },

  startQuizGenerationJob: async (
    projectId: number,
    contentId: number,
    payload: { num_questions?: number; difficulty: 'easy' | 'medium' | 'hard' }
  ): Promise<{
    job_id: number;
    status: string;
    job_type: string;
    requested_questions?: number | null;
    difficulty?: string | null;
    message?: string;
  }> => {
    const { data } = await apiClient.post(
      `/student-projects/${projectId}/content/${contentId}/quiz-generation`,
      payload
    );
    return data;
  },

  getGenerationJob: async (jobId: number): Promise<GenerationJobStatus> => {
    const { data } = await apiClient.get(`/generation-jobs/${jobId}`);
    return data;
  },

  generateFlashcardsFromContent: async (
    projectId: number,
    contentId: number,
    numCards: number
  ) => {
    const form = new FormData();
    form.append('num_cards', String(numCards));
    form.append('project_id', String(projectId));
    form.append('content_id', String(contentId));

    const { data } = await apiClient.post(`/generate-flashcards-from-pdf`, form, {
      headers: {
        // Browser sets correct boundary for multipart/form-data
      },
    });
    return data;
  },

  generateEssaysFromContent: async (
    projectId: number,
    contentId: number,
    numQuestions: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ) => {
    // When using content_id, we don't need to send a file
    const form = new FormData();
    form.append('num_questions', String(numQuestions));
    form.append('difficulty', difficulty);
    form.append('project_id', String(projectId));
    form.append('content_id', String(contentId));

    const { data } = await apiClient.post(`/generate-essay-qa-from-pdf`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data;
  },

  startEssayGenerationJob: async (
    projectId: number,
    contentId: number,
    payload: { num_questions?: number; difficulty: 'easy' | 'medium' | 'hard' }
  ): Promise<{
    job_id: number;
    status: string;
    job_type: string;
    requested_questions?: number | null;
    difficulty?: string | null;
    message?: string;
  }> => {
    const { data } = await apiClient.post(
      `/student-projects/${projectId}/content/${contentId}/essay-generation`,
      payload
    );
    return data;
  },

  startMindMapGenerationJob: async (
    projectId: number,
    contentId: number,
    payload: { focus?: string; include_examples?: boolean }
  ): Promise<{
    job_id: number;
    status: string;
    job_type: string;
    message?: string;
  }> => {
    const { data } = await apiClient.post(
      `/student-projects/${projectId}/content/${contentId}/mind-map-generation`,
      payload
    );
    return data;
  },

  getContentGeneratedContent: async (projectId: number, contentId: number) => {
    const { data } = await apiClient.get(`/student-projects/${projectId}/content/${contentId}/generated-content`);
    return data;
  },

  chatWithPDFs: async (projectId: number, message: string, contentId?: number) => {
    const form = new FormData();
    form.append('message', message);
    if (contentId !== undefined) {
      form.append('content_id', String(contentId));
    }
    const { data } = await apiClient.post(`/student-projects/${projectId}/chat`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data;
  },

  deleteProject: async (projectId: number) => {
    const { data } = await apiClient.delete(`/student-projects/${projectId}`);
    return data;
  },

  deleteContent: async (projectId: number, contentId: number) => {
    const { data } = await apiClient.delete(`/student-projects/${projectId}/content/${contentId}`);
    return data;
  },

  getMindMap: async (mindMapId: number): Promise<MindMapDetail> => {
    const { data } = await apiClient.get(`/mind-maps/${mindMapId}`);
    return data;
  },
};

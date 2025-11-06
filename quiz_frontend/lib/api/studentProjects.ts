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
}

export interface ProjectContent {
  id: number;
  content_type: 'pdf' | 'url' | 'text';
  name: string;
  content_url?: string;
  file_size?: number;
  uploaded_at: string;
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

  uploadPdf: async (projectId: number, file: File): Promise<ProjectContent> => {
    const form = new FormData();
    form.append('pdf_file', file);

    // For file uploads, we need to remove the default Content-Type header
    // and let the browser/axios set it automatically with the boundary
    const { data } = await apiClient.post(`/student-projects/${projectId}/content`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data.content ?? data;
  },

  generateQuizFromContent: async (
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

    const { data } = await apiClient.post(`/generate-quiz-from-pdf`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
      },
    });
    return data;
  },

  generateFlashcardsFromContent: async (
    projectId: number,
    contentId: number,
    numCards: number
  ) => {
    // When using content_id, we don't need to send a file
    const form = new FormData();
    form.append('num_cards', String(numCards));
    form.append('project_id', String(projectId));
    form.append('content_id', String(contentId));

    const { data } = await apiClient.post(`/generate-flashcards-from-pdf`, form, {
      headers: {
        // Don't set Content-Type - let axios/browser set it with boundary for multipart/form-data
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
};

import apiClient from './client';

export interface Course {
  id: number;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  contents: CourseContent[];
  quiz_references: number[];
  flashcard_references: number[];
  essay_references: number[];
  mind_map_references: number[];
}

export interface CourseContent {
  id: number;
  content_type: string;
  name: string;
  content_url: string;
  content_text?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface CourseCreate {
  name: string;
  description: string;
}

export const coursesApi = {
  getAll: async (): Promise<{ projects: Course[]; total_count: number }> => {
    const response = await apiClient.get('/student-projects');
    return response.data;
  },

  getById: async (id: number): Promise<Course> => {
    const response = await apiClient.get(`/student-projects/${id}`);
    return response.data;
  },

  create: async (data: CourseCreate): Promise<Course> => {
    const response = await apiClient.post('/student-projects', data);
    return response.data;
  },

  update: async (id: number, data: CourseCreate): Promise<Course> => {
    const response = await apiClient.put(`/student-projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/student-projects/${id}`);
  },

  uploadPdf: async (courseId: number, files: File[]): Promise<{ content: CourseContent[]; message: string }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('pdf_files', file);
    });
    
    const response = await apiClient.post(`/student-projects/${courseId}/content`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteContent: async (courseId: number, contentId: number): Promise<void> => {
    await apiClient.delete(`/student-projects/${courseId}/content/${contentId}`);
  },

  viewPdf: (courseId: number, contentId: number): string => {
    return `${apiClient.defaults.baseURL}student-projects/${courseId}/content/${contentId}/view`;
  },

  chatWithPdfs: async (
    courseId: number,
    message: string,
    contentId?: number
  ): Promise<{ response: string; pdfs_used: string[] }> => {
    const formData = new FormData();
    formData.append('message', message);
    if (contentId !== undefined && contentId !== null) {
      formData.append('content_id', contentId.toString());
    }

    const response = await apiClient.post(
      `/student-projects/${courseId}/chat`,
      formData
      // Note: Don't set Content-Type header - let browser set it with boundary for FormData
    );
    return response.data;
  },

  getGeneratedContent: async (courseId: number): Promise<{
    project_id: number;
    project_name: string;
    quizzes: Array<{
      id: number;
      topic: string;
      content_id: number | null;
      creation_timestamp: string | null;
      reference_created_at: string | null;
    }>;
    flashcards: Array<{
      id: number;
      topic: string;
      content_id: number | null;
      creation_timestamp: string | null;
      reference_created_at: string | null;
    }>;
    essays: Array<{
      id: number;
      topic: string;
      content_id: number | null;
      creation_timestamp: string | null;
      reference_created_at: string | null;
    }>;
  }> => {
    const response = await apiClient.get(`/student-projects/${courseId}/generated-content`);
    console.log('[coursesApi.getGeneratedContent] Raw response:', {
      status: response.status,
      data: response.data,
      quizzes: response.data?.quizzes?.map((q: any) => ({
        id: q.id,
        topic: q.topic,
        content_id: q.content_id,
        hasContentId: 'content_id' in q
      })),
      flashcards: response.data?.flashcards?.map((f: any) => ({
        id: f.id,
        topic: f.topic,
        content_id: f.content_id,
        hasContentId: 'content_id' in f
      })),
    });
    // Backend returns JSONResponse with 'content' field, axios unwraps it
    return response.data;
  },
};


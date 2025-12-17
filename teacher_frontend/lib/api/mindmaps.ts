import apiClient from './client';

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

export interface MindMapEdge {
  id?: string | number;
  source: string | number;
  target: string | number;
  label?: string;
  kind?: string;
}

export interface MindMapDetail extends MindMapSummary {
  project_id: number;
  content_id?: number;
  summary?: string | null;
  key_concepts: Array<Record<string, unknown>>;
  nodes: Array<Record<string, unknown>>;
  edges: MindMapEdge[];
  connections: Array<Record<string, unknown>>;
  callouts: Array<Record<string, unknown>>;
  recommended_next_steps: string[];
  metadata?: Record<string, unknown>;
}

export const mindMapsApi = {
  /**
   * Start asynchronous mind map generation for a specific PDF in a project.
   */
  startMindMapGenerationJob: async (
    projectId: number,
    contentId: number,
    payload: { focus?: string; include_examples?: boolean } = {}
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

  /**
   * Get the status of any generation job (quiz, essay, mind map).
   */
  getGenerationJob: async (jobId: number): Promise<GenerationJobStatus> => {
    const { data } = await apiClient.get(`/generation-jobs/${jobId}`);
    return data;
  },

  /**
   * Fetch full details for a specific mind map (nodes, edges, metadata).
   */
  getMindMap: async (mindMapId: number): Promise<MindMapDetail> => {
    const { data } = await apiClient.get(`/mind-maps/${mindMapId}`);
    return data;
  },

  /**
   * List mind maps that were generated from a specific PDF in a project.
   * Uses the content-scoped generated content endpoint and extracts mind maps.
   */
  getMindMapsForContent: async (
    projectId: number,
    contentId: number
  ): Promise<MindMapSummary[]> => {
    const { data } = await apiClient.get(
      `/student-projects/${projectId}/content/${contentId}/generated-content`
    );
    const rawMindMaps = (data?.mind_maps ?? []) as Array<{
      id: number;
      title: string;
      central_idea: string;
      category?: string;
      subcategory?: string;
      node_count?: number;
      created_at?: string;
    }>;

    return rawMindMaps.map((m) => ({
      id: m.id,
      title: m.title,
      central_idea: m.central_idea,
      category: m.category,
      subcategory: m.subcategory,
      node_count: m.node_count ?? 0,
      created_at: m.created_at,
    }));
  },
};



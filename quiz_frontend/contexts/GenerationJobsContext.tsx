'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { studentProjectsApi, type GenerationJobStatus } from '@/lib/api/studentProjects';

type TrackedJobType = 'quiz' | 'essay' | 'mind_map';

interface FlashcardTaskInput {
  projectId: number;
  contentId: number;
  contentName: string;
  numCards: number;
}

interface TrackedJob {
  jobId: number;
  projectId: number;
  contentId: number;
  contentName: string;
  jobType: TrackedJobType;
  createdAt: string;
}

interface GenerationJobsContextValue {
  registerJob: (job: Omit<TrackedJob, 'createdAt'>) => void;
  startFlashcardGeneration: (task: FlashcardTaskInput) => Promise<string>;
}

const GenerationJobsContext = createContext<GenerationJobsContextValue | undefined>(undefined);

const MAX_JOB_HISTORY = 25;
const FLASHCARD_CACHE_PREFIX = 'quizhub_flashcard_payload_';
const FLASHCARD_CACHE_INDEX_PREFIX = 'quizhub_flashcard_payload_index_';

const generateCacheId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `flashcard-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function GenerationJobsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const jobsRef = useRef<TrackedJob[]>([]);
  const flashcardTasksRef = useRef<Record<string, FlashcardTaskInput>>({});

  const storageKey = useMemo(
    () => (user?.id ? `quizhub_generation_jobs_${user.id}` : null),
    [user?.id]
  );

  useEffect(() => {
    jobsRef.current = trackedJobs;
  }, [trackedJobs]);

  // Hydrate active jobs from storage when user changes
  useEffect(() => {
    if (!storageKey) {
      setTrackedJobs([]);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as TrackedJob[];
        setTrackedJobs(parsed);
      } else {
        setTrackedJobs([]);
      }
    } catch (error) {
      console.warn('Failed to parse stored generation jobs', error);
      setTrackedJobs([]);
    }
  }, [storageKey]);

  // Persist tracked jobs
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(trackedJobs));
    } catch (error) {
      console.warn('Failed to persist generation jobs', error);
    }
  }, [trackedJobs, storageKey]);

  const registerJob = useCallback(
    (job: Omit<TrackedJob, 'createdAt'>) => {
      setTrackedJobs((prev) => {
        const next: TrackedJob[] = [
          { ...job, createdAt: new Date().toISOString() },
          ...prev.filter((existing) => existing.jobId !== job.jobId),
        ].slice(0, MAX_JOB_HISTORY);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!trackedJobs.length) {
      return;
    }

    const pollJobs = async () => {
      const snapshot = [...jobsRef.current];
      if (!snapshot.length) {
        return;
      }

      try {
        const results = await Promise.all(
          snapshot.map((job) => studentProjectsApi.getGenerationJob(job.jobId))
        );

        const completedJobs: Array<{ job: TrackedJob; status: GenerationJobStatus }> = [];
        const failedJobs: Array<{ job: TrackedJob; status: GenerationJobStatus }> = [];

        results.forEach((status, index) => {
          const jobMeta = snapshot[index];
          if (status.status === 'completed') {
            completedJobs.push({ job: jobMeta, status });
          } else if (status.status === 'failed') {
            failedJobs.push({ job: jobMeta, status });
          }
        });

        if (completedJobs.length || failedJobs.length) {
          const jobsToRemove = new Set<number>([
            ...completedJobs.map(({ job }) => job.jobId),
            ...failedJobs.map(({ job }) => job.jobId),
          ]);

          setTrackedJobs((prev) => prev.filter((job) => !jobsToRemove.has(job.jobId)));

          completedJobs.forEach(({ job, status }) => {
            if (status.result?.quiz_id && job.jobType === 'quiz') {
              addNotification({
                type: 'quiz',
                title: 'Quiz generation completed',
                description: `"${status.result.topic}" from ${job.contentName} is ready.`,
                href: `/quizzes/${status.result.quiz_id}`,
                meta: { jobId: job.jobId, contentId: job.contentId, projectId: job.projectId },
              });
            } else if (status.result?.essay_id && job.jobType === 'essay') {
              addNotification({
                type: 'essay',
                title: 'Essay Q&A generation completed',
                description: `"${status.result.topic}" from ${job.contentName} is ready.`,
                href: `/essays/${status.result.essay_id}`,
                meta: { jobId: job.jobId, contentId: job.contentId, projectId: job.projectId },
              });
            } else if (status.result?.mind_map_id && job.jobType === 'mind_map') {
              addNotification({
                type: 'mind_map',
                title: 'Mind map generation completed',
                description: `"${status.result.topic}" from ${job.contentName} is ready.`,
                href: `/mind-maps/${status.result.mind_map_id}?projectId=${job.projectId}`,
                meta: { jobId: job.jobId, contentId: job.contentId, projectId: job.projectId },
              });
            }

            // Refresh related caches so pages show latest content
            queryClient.invalidateQueries({ queryKey: ['generated-content', job.projectId, job.contentId] });
            queryClient.invalidateQueries({ queryKey: ['student-project', job.projectId] });
            queryClient.invalidateQueries({ queryKey: ['student-project-contents', job.projectId] });
          });
        }
      } catch (error) {
        console.warn('Failed to poll generation jobs', error);
      }
    };

    const interval = setInterval(pollJobs, 4000);
    return () => clearInterval(interval);
  }, [trackedJobs.length, addNotification, queryClient]);

  const userCachePrefix = useMemo(
    () => (user?.id ? `${FLASHCARD_CACHE_PREFIX}${user.id}_` : null),
    [user?.id]
  );

  const userCacheIndexKey = useMemo(
    () => (user?.id ? `${FLASHCARD_CACHE_INDEX_PREFIX}${user.id}` : null),
    [user?.id]
  );

  const persistFlashcardPayload = useCallback(
    (cacheId: string, payload: unknown) => {
      if (!userCachePrefix || !userCacheIndexKey) return;
      try {
        const key = `${userCachePrefix}${cacheId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            storedAt: new Date().toISOString(),
            payload,
          })
        );

        const indexRaw = localStorage.getItem(userCacheIndexKey);
        const previous = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
        const merged = [cacheId, ...previous.filter((existing) => existing !== cacheId)];
        const next = merged.slice(0, 5);
        localStorage.setItem(userCacheIndexKey, JSON.stringify(next));

        const stale = merged.slice(5);
        stale.forEach((staleId) => {
          const staleKey = `${userCachePrefix}${staleId}`;
          localStorage.removeItem(staleKey);
        });
      } catch (error) {
        console.warn('Failed to persist flashcard payload', error);
      }
    },
    [userCacheIndexKey, userCachePrefix]
  );

  const startFlashcardGeneration = useCallback(
    async ({ projectId, contentId, contentName, numCards }: FlashcardTaskInput) => {
      if (!user?.id) {
        throw new Error('You must be signed in to generate flashcards.');
      }
      const cacheId = generateCacheId();
      flashcardTasksRef.current[cacheId] = { projectId, contentId, contentName, numCards };

      const run = async () => {
        try {
          const data = await studentProjectsApi.generateFlashcardsFromContent(
            projectId,
            contentId,
            numCards
          );
          persistFlashcardPayload(cacheId, {
            data,
            projectId,
            contentId,
            contentName,
            numCards,
          });
          addNotification({
            type: 'flashcards',
            title: 'Flashcards ready',
            description: `"${contentName}" flashcards are ready.`,
            href: `/flashcards/view?cacheId=${encodeURIComponent(cacheId)}&projectId=${projectId}`,
            meta: { cacheId, projectId, contentId },
          });
        } catch (error: unknown) {
          console.warn('Flashcard generation failed', error);
          const message =
            (error as any)?.response?.data?.detail ??
            (error instanceof Error ? error.message : 'Failed to generate flashcards');
          addNotification({
            type: 'info',
            title: 'Flashcard generation failed',
            description: message,
            meta: { cacheId, projectId, contentId },
          });
        } finally {
          delete flashcardTasksRef.current[cacheId];
        }
      };

      run();
      return cacheId;
    },
    [addNotification, persistFlashcardPayload, user?.id]
  );

  const value: GenerationJobsContextValue = {
    registerJob,
    startFlashcardGeneration,
  };

  return (
    <GenerationJobsContext.Provider value={value}>
      {children}
    </GenerationJobsContext.Provider>
  );
}

export function useGenerationJobs() {
  const context = useContext(GenerationJobsContext);
  if (!context) {
    throw new Error('useGenerationJobs must be used within a GenerationJobsProvider');
  }
  return context;
}


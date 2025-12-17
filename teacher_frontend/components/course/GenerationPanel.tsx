'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generationApi } from '@/lib/api/generation';
import { quizApi } from '@/lib/api/quiz';
import { coursesApi, CourseContent } from '@/lib/api/courses';
import { flashcardsApi } from '@/lib/api/flashcards';
import { FileQuestion, BookOpen, FileText, Download, Share2, Loader2, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface GenerationPanelProps {
  courseId: number;
  quizReferences: number[];
  flashcardReferences: number[];
  essayReferences: number[];
  selectedContentId?: number | null;
  contents?: CourseContent[];
}

export function GenerationPanel({
  courseId,
  quizReferences,
  flashcardReferences,
  essayReferences,
  selectedContentId,
  contents = [],
}: GenerationPanelProps) {
  const queryClient = useQueryClient();
  const [generationType, setGenerationType] = useState<'quiz' | 'flashcard' | 'essay' | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numCards, setNumCards] = useState(10);
  // Track active generations to keep loading indicators visible until job completes
  const [activeGenerations, setActiveGenerations] = useState<Set<'quiz' | 'flashcard' | 'essay'>>(new Set());
  // Track which content types are expanded (show all items)
  const [expandedTypes, setExpandedTypes] = useState<Set<'quiz' | 'flashcard' | 'essay'>>(new Set());
  // Track content_id for newly generated items (before generatedContent loads)
  const [pendingContentIds, setPendingContentIds] = useState<Record<string, number | null>>({});
  // Local copies of reference ids so we can react immediately to new generations
  const [localQuizReferences, setLocalQuizReferences] = useState<number[]>(quizReferences);
  const [localFlashcardReferences, setLocalFlashcardReferences] = useState<number[]>(flashcardReferences);
  const [localEssayReferences, setLocalEssayReferences] = useState<number[]>(essayReferences);

  // Keep local references in sync with props
  useEffect(() => {
    setLocalQuizReferences(quizReferences);
  }, [quizReferences]);

  useEffect(() => {
    setLocalFlashcardReferences(flashcardReferences);
  }, [flashcardReferences]);

  useEffect(() => {
    setLocalEssayReferences(essayReferences);
  }, [essayReferences]);

  const quizMutation = useMutation({
    mutationFn: (data: { num_questions?: number; difficulty: string; project_id: number; content_id?: number }) =>
      generationApi.generateQuiz({ ...data, project_id: courseId }),
    onMutate: (variables) => {
      // Mark quiz as actively generating immediately when mutation starts
      setActiveGenerations((prev) => new Set(prev).add('quiz'));
      // Store the content_id that will be used for this generation
      // We'll track it temporarily until we get the quiz_id from the response
      setPendingContentIds((prev) => ({
        ...prev,
        'quiz-pending': variables.content_id || null,
      }));
    },
    onSuccess: async (data, variables) => {
      // Ensure new quiz id is reflected locally immediately
      if (data?.quiz_id) {
        setLocalQuizReferences((prev) =>
          prev.includes(data.quiz_id) ? prev : [...prev, data.quiz_id]
        );
      }
      // Store the content_id for the newly generated quiz
      if (data?.quiz_id) {
        setPendingContentIds((prev) => {
          const { 'quiz-pending': pendingId, ...rest } = prev;
          return {
            ...rest,
            [`quiz-${data.quiz_id}`]: variables.content_id || null,
          };
        });
      }
      // Reset form values
      setNumQuestions(10);
      setDifficulty('medium');
      // Refresh course data to show new references
      await queryClient.invalidateQueries({
        queryKey: ['course', courseId],
        refetchType: 'active',
      });
      // Also refresh generated content to get content_id for new items
      await queryClient.invalidateQueries({
        queryKey: ['generated-content', courseId],
        refetchType: 'active',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate quiz';
      const isLimitError = error.response?.status === 402 || error.status === 402;
      if (isLimitError) {
        alert(errorMessage);
      }
      // Remove from active generations on error
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('quiz');
        return next;
      });
    },
  });

  const flashcardMutation = useMutation({
    mutationFn: (data: { num_cards: number; project_id: number; content_id?: number }) =>
      generationApi.generateFlashcards({ ...data, project_id: courseId }),
    onMutate: (variables) => {
      // Mark flashcard as actively generating immediately when mutation starts
      setActiveGenerations((prev) => new Set(prev).add('flashcard'));
      setPendingContentIds((prev) => ({
        ...prev,
        'flashcard-pending': variables.content_id || null,
      }));
    },
    onSuccess: async (_data, variables) => {
      // We don't get the new flashcard topic id directly, but generated-content
      // and course queries will include it after refetch; keep local references
      // in sync by relying on those queries.
      // Store the content_id for the newly generated flashcard
      setPendingContentIds((prev) => {
        const { 'flashcard-pending': _pendingId, ...rest } = prev;
        return rest;
      });
      // Reset form values
      setNumCards(10);
      // Refresh course data to show new references
      await queryClient.invalidateQueries({
        queryKey: ['course', courseId],
        refetchType: 'active',
      });
      // Also refresh generated content to get content_id for new items
      await queryClient.invalidateQueries({
        queryKey: ['generated-content', courseId],
        refetchType: 'active',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate flashcards';
      const isLimitError = error.response?.status === 402 || error.status === 402;
      if (isLimitError) {
        alert(errorMessage);
      }
      // Remove from active generations on error
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('flashcard');
        return next;
      });
    },
  });

  const essayMutation = useMutation({
    mutationFn: (data: { num_questions: number; difficulty: string; project_id: number; content_id?: number }) =>
      generationApi.generateEssays({ ...data, project_id: courseId }),
    onMutate: (variables) => {
      // Mark essay as actively generating immediately when mutation starts
      setActiveGenerations((prev) => new Set(prev).add('essay'));
      setPendingContentIds((prev) => ({
        ...prev,
        'essay-pending': variables.content_id || null,
      }));
    },
    onSuccess: async (data, variables) => {
      // Ensure new essay id is reflected locally immediately
      if (data?.essay_topic_id) {
        setLocalEssayReferences((prev) =>
          prev.includes(data.essay_topic_id) ? prev : [...prev, data.essay_topic_id]
        );
      }
      // Store the content_id for the newly generated essay
      if (data?.essay_topic_id) {
        setPendingContentIds((prev) => {
          const { 'essay-pending': pendingId, ...rest } = prev;
          return {
            ...rest,
            [`essay-${data.essay_topic_id}`]: variables.content_id || null,
          };
        });
      }
      // Reset form values
      setNumQuestions(10);
      setDifficulty('medium');
      // Refresh course data to show new references
      await queryClient.invalidateQueries({
        queryKey: ['course', courseId],
        refetchType: 'active',
      });
      // Also refresh generated content to get content_id for new items
      await queryClient.invalidateQueries({
        queryKey: ['generated-content', courseId],
        refetchType: 'active',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate essays';
      const isLimitError = error.response?.status === 402 || error.status === 402;
      if (isLimitError) {
        alert(errorMessage);
      }
      // Remove from active generations on error
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('essay');
        return next;
      });
    },
  });

  const handleGenerate = () => {
    const commonData = {
      project_id: courseId,
      content_id: selectedContentId || undefined,
    };

    if (generationType === 'quiz') {
      quizMutation.mutate({ 
        num_questions: numQuestions, 
        difficulty, 
        ...commonData 
      });
      // Reset to main view after mutation starts
      setGenerationType(null);
    } else if (generationType === 'flashcard') {
      flashcardMutation.mutate({ 
        num_cards: numCards, 
        ...commonData 
      });
      // Reset to main view after mutation starts
      setGenerationType(null);
    } else if (generationType === 'essay') {
      essayMutation.mutate({ 
        num_questions: numQuestions, 
        difficulty, 
        ...commonData 
      });
      // Reset to main view after mutation starts
      setGenerationType(null);
    }
  };

  const [copiedShareCode, setCopiedShareCode] = useState<string | null>(null);
  const [shareCodeMap, setShareCodeMap] = useState<Record<string, string>>({});
  const [shareModal, setShareModal] = useState<
    | {
        isOpen: boolean;
        type: 'Quiz' | 'Flashcards' | 'Essay';
        id: number;
        link?: string;
        content?: string;
      }
    | null
  >(null);

  // Fetch generated content details to get names and content_ids
  const { data: generatedContent, isLoading: isLoadingGeneratedContent, error: generatedContentError } = useQuery({
    queryKey: ['generated-content', courseId],
    queryFn: async () => {
      try {
        const result = await coursesApi.getGeneratedContent(courseId);
        console.log('[GenerationPanel] ✅ Fetched generated content:', {
          quizzes: result?.quizzes?.length || 0,
          flashcards: result?.flashcards?.length || 0,
          essays: result?.essays?.length || 0,
          fullData: result
        });
        return result;
      } catch (error) {
        console.error('[GenerationPanel] ❌ Error fetching generated content:', error);
        throw error;
      }
    },
    enabled: !!courseId,
    // While something is generating, poll so new items appear without manual refresh
    refetchInterval: activeGenerations.size > 0 ? 4000 : false,
    staleTime: 0,
  });

  // Debug: Log state changes
  useEffect(() => {
    console.log('[GenerationPanel] 🔍 State Debug:', {
      courseId,
      selectedContentId,
      isLoadingGeneratedContent,
      hasGeneratedContent: !!generatedContent,
      generatedContentError: generatedContentError?.message,
      quizReferences: localQuizReferences.length,
      flashcardReferences: localFlashcardReferences.length,
      essayReferences: localEssayReferences.length,
      quizzes: generatedContent?.quizzes?.map(q => {
        const qAny = q as any;
        return {
          id: q.id,
          topic: q.topic,
          content_id: qAny.content_id,
          hasContentId: 'content_id' in qAny,
          allKeys: Object.keys(qAny),
          fullObject: qAny
        };
      }) || [],
      flashcards: generatedContent?.flashcards?.map(f => {
        const fAny = f as any;
        return {
          id: f.id,
          topic: f.topic,
          content_id: fAny.content_id,
          hasContentId: 'content_id' in fAny,
          allKeys: Object.keys(fAny),
          fullObject: fAny
        };
      }) || [],
      essays: generatedContent?.essays?.map(e => {
        const eAny = e as any;
        return {
          id: e.id,
          topic: e.topic,
          content_id: eAny.content_id,
          hasContentId: 'content_id' in eAny,
          allKeys: Object.keys(eAny),
          fullObject: eAny
        };
      }) || [],
      pendingContentIds,
      activeGenerations: Array.from(activeGenerations),
      rawGeneratedContent: generatedContent,
    });
  }, [courseId, selectedContentId, isLoadingGeneratedContent, generatedContent, generatedContentError, localQuizReferences, localFlashcardReferences, localEssayReferences, pendingContentIds, activeGenerations]);

  // Helper function to format content name
  const formatContentName = (
    type: 'quiz' | 'flashcard' | 'essay',
    id: number,
    references: number[]
  ): string => {
    // Determine if latest by comparing timestamps (newest = latest)
    let isLatest = false;
    if (type === 'quiz' && generatedContent?.quizzes) {
      const currentQuiz = generatedContent.quizzes.find((q) => q.id === id);
      if (currentQuiz) {
        const currentTime = currentQuiz.creation_timestamp || currentQuiz.reference_created_at || '';
        const allTimes = generatedContent.quizzes
          .filter((q) => references.includes(q.id))
          .map((q) => q.creation_timestamp || q.reference_created_at || '')
          .filter((t) => t);
        isLatest = allTimes.length > 0 && currentTime === allTimes.sort().reverse()[0];
      }
    } else if (type === 'flashcard' && generatedContent?.flashcards) {
      const currentFlashcard = generatedContent.flashcards.find((f) => f.id === id);
      if (currentFlashcard) {
        const currentTime = currentFlashcard.creation_timestamp || currentFlashcard.reference_created_at || '';
        const allTimes = generatedContent.flashcards
          .filter((f) => references.includes(f.id))
          .map((f) => f.creation_timestamp || f.reference_created_at || '')
          .filter((t) => t);
        isLatest = allTimes.length > 0 && currentTime === allTimes.sort().reverse()[0];
      }
    } else if (type === 'essay' && generatedContent?.essays) {
      const currentEssay = generatedContent.essays.find((e) => e.id === id);
      if (currentEssay) {
        const currentTime = currentEssay.creation_timestamp || currentEssay.reference_created_at || '';
        const allTimes = generatedContent.essays
          .filter((e) => references.includes(e.id))
          .map((e) => e.creation_timestamp || e.reference_created_at || '')
          .filter((t) => t);
        isLatest = allTimes.length > 0 && currentTime === allTimes.sort().reverse()[0];
      }
    }
    // If data not loaded yet, use simple fallback
    if (!generatedContent) {
      const prefix = references.length > 0 && id === references[references.length - 1] ? '[latest]' : '[old]';
      return `${prefix} ${type} - ${id}`;
    }
    
    const prefix = isLatest ? '[latest]' : '[old]';
    
    // Get the PDF name - check pendingContentIds first, then generatedContent
    let pdfName = 'all_pdfs';
    let contentId: number | null | undefined = undefined;
    
    if (type === 'quiz') {
      const quiz = generatedContent?.quizzes?.find((q) => q.id === id);
      contentId = quiz?.content_id ?? pendingContentIds[`quiz-${id}`] ?? 
        (activeGenerations.has('quiz') ? pendingContentIds['quiz-pending'] : undefined);
    } else if (type === 'flashcard') {
      const flashcard = generatedContent?.flashcards?.find((f) => f.id === id);
      contentId = flashcard?.content_id ?? pendingContentIds[`flashcard-${id}`] ?? 
        (activeGenerations.has('flashcard') ? pendingContentIds['flashcard-pending'] : undefined);
    } else if (type === 'essay') {
      const essay = generatedContent?.essays?.find((e) => e.id === id);
      contentId = essay?.content_id ?? pendingContentIds[`essay-${id}`] ?? 
        (activeGenerations.has('essay') ? pendingContentIds['essay-pending'] : undefined);
    }
    
    // Get PDF name from contentId
    if (contentId && contents.length > 0) {
      const pdf = contents.find((c) => c.id === contentId);
      if (pdf) {
        pdfName = pdf.name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]/g, '_');
      }
    }
    
    // Get content name (topic)
    let contentName = '';
    if (type === 'quiz' && generatedContent?.quizzes) {
      const quiz = generatedContent.quizzes.find((q) => q.id === id);
      contentName = quiz?.topic || `quiz_${id}`;
    } else if (type === 'flashcard' && generatedContent?.flashcards) {
      const flashcard = generatedContent.flashcards.find((f) => f.id === id);
      contentName = flashcard?.topic || `flashcard_${id}`;
    } else if (type === 'essay' && generatedContent?.essays) {
      const essay = generatedContent.essays.find((e) => e.id === id);
      contentName = essay?.topic || `essay_${id}`;
    } else {
      // Fallback if data not loaded
      contentName = `${type}_${id}`;
    }
    
    const lastNumber = id;
    
    // Format: [latest/old] type - content_name - pdf_name - last_number
    return `${prefix} ${type} - ${contentName} - ${pdfName} - ${lastNumber}`;
  };

  // Track previous reference counts to detect new items
  const [prevFlashcardCount, setPrevFlashcardCount] = useState(flashcardReferences.length);
  const [prevQuizCount, setPrevQuizCount] = useState(quizReferences.length);
  const [prevEssayCount, setPrevEssayCount] = useState(essayReferences.length);

  // Clear active generations when new references appear (job completed)
  useEffect(() => {
    if (activeGenerations.has('flashcard') && localFlashcardReferences.length > prevFlashcardCount) {
      // New flashcard appeared, clear the loading indicator
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('flashcard');
        return next;
      });
    }
    setPrevFlashcardCount(localFlashcardReferences.length);
  }, [localFlashcardReferences.length, prevFlashcardCount, activeGenerations]);

  useEffect(() => {
    if (activeGenerations.has('quiz') && localQuizReferences.length > prevQuizCount) {
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('quiz');
        return next;
      });
    }
    setPrevQuizCount(localQuizReferences.length);
  }, [localQuizReferences.length, prevQuizCount, activeGenerations]);

  useEffect(() => {
    if (activeGenerations.has('essay') && localEssayReferences.length > prevEssayCount) {
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete('essay');
        return next;
      });
    }
    setPrevEssayCount(localEssayReferences.length);
  }, [localEssayReferences.length, prevEssayCount, activeGenerations]);

  // Get or generate share code
  const getShareCodeMutation = useMutation({
    mutationFn: async (topicId: number) => {
      try {
        // Try to get existing share code
        const data = await quizApi.getShareCode(topicId);
        if (data.share_code) {
          return data.share_code;
        }
        // Generate new share code if none exists
        const newData = await quizApi.generateShareCode(topicId);
        return newData.share_code;
      } catch (error: any) {
        console.error('[GenerationPanel] Error getting share code:', error);
        
        // If 403, try generating a new code
        if (error.response?.status === 403 || error.message?.includes('403') || error.message?.includes('Access denied')) {
          try {
            const newData = await quizApi.generateShareCode(topicId);
            return newData.share_code;
          } catch (genError: any) {
            console.error('[GenerationPanel] Error generating share code:', genError);
            throw new Error(genError.message || 'Failed to generate share code. Please try again.');
          }
        }
        
        // If network error, provide more helpful message
        if (error.message?.includes('Network error') || !error.response) {
          throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend is running.');
        }
        
        throw new Error(error.message || 'Failed to get share code. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('[GenerationPanel] Share code mutation error:', error);
      alert(error.message || 'Failed to get share code. Please try again.');
    },
  });

  const handleExport = async (type: 'quiz' | 'flashcard' | 'essay', id: number) => {
    try {
      if (type === 'quiz') {
        // Export quiz as PDF (can add format selector later)
        const blob = await quizApi.exportQuiz(id, 'pdf');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (type === 'flashcard') {
        // Export flashcards as a simple text file
        const data = await flashcardsApi.getByTopic(id);
        const safeTopic =
          data.topic.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'flashcards';

        const lines: string[] = [];
        lines.push(`Flashcards: ${data.topic}`);
        if (data.category || data.subcategory) {
          lines.push(
            `Category: ${data.category || 'N/A'}${data.subcategory ? ` / ${data.subcategory}` : ''}`
          );
        }
        lines.push('');

        data.cards.forEach((card, index) => {
          lines.push(`Card ${index + 1}`);
          lines.push(`Front: ${card.front}`);
          lines.push(`Back: ${card.back}`);
          lines.push(`Importance: ${card.importance || 'medium'}`);
          lines.push('');
        });

        const blob = new Blob([lines.join('\n')], {
          type: 'text/plain;charset=utf-8',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeTopic}_flashcards.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // TODO: Implement export for essays when backend endpoints are available
        alert(`Export for ${type} is not yet implemented`);
      }
    } catch (error: any) {
      console.error(`Failed to export ${type}`, error);
      alert(error?.response?.data?.detail || error?.message || `Failed to export ${type}. Please try again.`);
    }
  };

  const handleShare = async (type: 'quiz' | 'flashcard' | 'essay', id: number) => {
    try {
      if (type === 'quiz') {
        const shareCode = await getShareCodeMutation.mutateAsync(id);
        setShareCodeMap((prev) => ({ ...prev, [`quiz-${id}`]: shareCode }));
        
        // Create share link
        const shareLink = `${window.location.origin}/quiz/share/${shareCode}`;
        
        // Open share modal
        setShareModal({
          isOpen: true,
          type: 'Quiz',
          id,
          link: shareLink,
        });
      } else if (type === 'flashcard') {
        // Create share/view link for flashcards by topic ID
        const shareLink = `${window.location.origin}/flashcards/share/${id}`;
        setShareModal({
          isOpen: true,
          type: 'Flashcards',
          id,
          link: shareLink,
        });
      } else {
        // TODO: Implement share for essays when backend endpoints are available
        alert(`Share functionality for ${type} is not yet implemented`);
      }
    } catch (error: any) {
      console.error(`Failed to share ${type}`, error);
      alert(error?.response?.data?.detail || error?.message || `Failed to share ${type}. Please try again.`);
    }
  };

  const handleCopyLink = async () => {
    if (shareModal) {
      try {
        const textToCopy = shareModal.link || shareModal.content || '';
        if (!textToCopy) return;
        await navigator.clipboard.writeText(textToCopy);
        const key = `${shareModal.type.toLowerCase()}-${shareModal.id}`;
        setCopiedShareCode(key);
        setTimeout(() => setCopiedShareCode(null), 3000);
      } catch (error) {
        console.error('Failed to copy link', error);
      }
    }
  };

  return (
    <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 h-full flex flex-col">
      <div className="p-4 border-b border-[#38BDF8]/20">
        <h2 className="text-lg font-semibold text-white">Generate Content</h2>
        {selectedContentId ? (
          <div className="mt-2 p-2 bg-[#38BDF8]/10 rounded border border-[#38BDF8]/30">
            <p className="text-xs font-medium text-[#38BDF8] mb-1">Using Selected PDF:</p>
            <p className="text-xs text-white truncate font-semibold">
              {contents.find((c) => c.id === selectedContentId)?.name || 'Selected PDF'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8] mt-1">Using all PDFs in course</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Generation Options */}
        {!generationType ? (
          <div className="space-y-3">
            <button
              onClick={() => setGenerationType('quiz')}
              className="w-full p-4 bg-[#161F32] hover:bg-[#161F32]/80 border border-[#38BDF8]/20 rounded transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileQuestion className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Generate Quiz</div>
                  <div className="text-sm text-[#94A3B8]">Create quiz questions from PDFs</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setGenerationType('flashcard')}
              className="w-full p-4 bg-[#161F32] hover:bg-[#161F32]/80 border border-[#38BDF8]/20 rounded transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Generate Flashcards</div>
                  <div className="text-sm text-[#94A3B8]">Create flashcards from PDFs</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setGenerationType('essay')}
              className="w-full p-4 bg-[#161F32] hover:bg-[#161F32]/80 border border-[#38BDF8]/20 rounded transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Generate Essays</div>
                  <div className="text-sm text-[#94A3B8]">Create essay questions from PDFs</div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setGenerationType(null)}
              className="text-sm text-[#94A3B8] hover:text-white"
            >
              ← Back
            </button>

            {generationType === 'quiz' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={quizMutation.isPending}
                  className="w-full py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {quizMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Quiz'
                  )}
                </button>
              </div>
            )}

            {generationType === 'flashcard' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Number of Cards
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={numCards}
                    onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={flashcardMutation.isPending}
                  className="w-full py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {flashcardMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Flashcards'
                  )}
                </button>
              </div>
            )}

            {generationType === 'essay' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={essayMutation.isPending}
                  className="w-full py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {essayMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Essays'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generating Content Section */}
        {(quizMutation.isPending || flashcardMutation.isPending || essayMutation.isPending || activeGenerations.size > 0) && (
          <div className="mt-8 pt-4 border-t border-[#38BDF8]/20">
            <h3 className="text-sm font-semibold text-white mb-3">Generating Content</h3>
            <div className="space-y-2">
              {(quizMutation.isPending || activeGenerations.has('quiz')) && (
                <div className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
                  <span className="text-sm text-[#94A3B8]">Generating quiz...</span>
                </div>
              )}
              {(flashcardMutation.isPending || activeGenerations.has('flashcard')) && (
                <div className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
                  <span className="text-sm text-[#94A3B8]">Generating flashcards...</span>
                </div>
              )}
              {(essayMutation.isPending || activeGenerations.has('essay')) && (
                <div className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
                  <span className="text-sm text-[#94A3B8]">Generating essays...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Content List */}
        {(localQuizReferences.length > 0 || localFlashcardReferences.length > 0 || localEssayReferences.length > 0) && (
          <div className="mt-8 pt-4 border-t border-[#38BDF8]/20">
            <h3 className="text-sm font-semibold text-white mb-3">Generated Content</h3>
            <div className="space-y-2">
              {(() => {
                // Filter quizzes by selected PDF (content_id)
                const filteredQuizzes = localQuizReferences.filter((id) => {
                  const quiz = generatedContent?.quizzes?.find((q) => q.id === id);
                  
                  // If generatedContent is still loading OR not loaded yet, show all items
                  if (isLoadingGeneratedContent || !generatedContent) {
                    console.log(`[Filter] Quiz ${id}: Showing (loading or no data)`);
                    return true;
                  }
                  
                  // If quiz not found in generatedContent, show it temporarily (data might be stale)
                  if (!quiz) {
                    console.log(`[Filter] Quiz ${id}: Showing (not found in generatedContent)`);
                    return true;
                  }
                  
                  // Get content_id from quiz or pendingContentIds
                  const storedContentId = pendingContentIds[`quiz-${id}`] ?? 
                    (activeGenerations.has('quiz') ? pendingContentIds['quiz-pending'] : undefined);
                  
                  // Handle missing content_id: if field doesn't exist or is undefined, treat as null (all PDFs)
                  const quizAny = quiz as any;
                  const quizContentId = quizAny.content_id !== undefined ? quizAny.content_id : null;
                  const contentId = quizContentId ?? storedContentId;
                  
                  console.log(`[Filter] Quiz ${id}:`, {
                    quizFound: !!quiz,
                    quizData: quiz ? {
                      id: quiz.id,
                      topic: quiz.topic,
                      content_id: quizAny.content_id,
                      content_idType: typeof quizAny.content_id,
                      content_idIsNull: quizAny.content_id === null,
                      content_idIsUndefined: quizAny.content_id === undefined,
                      hasContentIdField: 'content_id' in quizAny,
                      allKeys: Object.keys(quizAny),
                      normalizedContentId: quizContentId,
                    } : null,
                    storedContentId,
                    finalContentId: contentId,
                    selectedContentId,
                    willShow: selectedContentId !== null && selectedContentId !== undefined 
                      ? contentId === selectedContentId 
                      : (contentId === null || contentId === undefined)
                  });
                  
                  // If selectedContentId is set, only show quizzes for that PDF
                  // If selectedContentId is null, show quizzes for all PDFs (content_id === null or undefined)
                  if (selectedContentId !== null && selectedContentId !== undefined) {
                    return contentId === selectedContentId;
                  } else {
                    // Show items with null/undefined content_id (generated from all PDFs)
                    return contentId === null || contentId === undefined;
                  }
                });
                
                console.log('[Filter] Quiz Results:', {
                  totalReferences: localQuizReferences.length,
                  filteredCount: filteredQuizzes.length,
                  filteredIds: filteredQuizzes
                });
                // Sort quizzes by creation timestamp (newest first)
                const sortedQuizzes = filteredQuizzes.sort((a, b) => {
                  const quizA = generatedContent?.quizzes?.find((q) => q.id === a);
                  const quizB = generatedContent?.quizzes?.find((q) => q.id === b);
                  const timeA = quizA?.creation_timestamp || quizA?.reference_created_at || '';
                  const timeB = quizB?.creation_timestamp || quizB?.reference_created_at || '';
                  return timeB.localeCompare(timeA); // Newest first (descending)
                });
                // Show only latest if not expanded
                const isExpanded = expandedTypes.has('quiz');
                const displayQuizzes = isExpanded ? sortedQuizzes : sortedQuizzes.slice(0, 1);
                return { quizzes: displayQuizzes, hasMore: sortedQuizzes.length > 1, allQuizzes: sortedQuizzes };
              })().quizzes.map((id) => (
                <div
                  key={`quiz-${id}`}
                  className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileQuestion className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                    <span className="text-sm text-white truncate" title={formatContentName('quiz', id, quizReferences)}>
                      {formatContentName('quiz', id, quizReferences)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('quiz', id)}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8] transition-colors"
                      title="Export as PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare('quiz', id)}
                      disabled={getShareCodeMutation.isPending}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8] transition-colors disabled:opacity-50"
                      title={shareCodeMap[`quiz-${id}`] ? 'Copy share link' : 'Generate share link'}
                    >
                      {copiedShareCode === `quiz-${id}` ? (
                        <Check className="w-4 h-4 text-[#38BDF8]" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {/* Show more/less button for quizzes */}
              {(() => {
                // Filter quizzes by selected PDF (content_id)
                const filteredQuizzes = localQuizReferences.filter((id) => {
                  const quiz = generatedContent?.quizzes?.find((q) => q.id === id);
                  // If generatedContent is still loading, show all items temporarily
                  if (isLoadingGeneratedContent && !quiz) {
                    return true;
                  }
                  
                  // If quiz not found in generatedContent yet, use pendingContentIds
                  const storedContentId = pendingContentIds[`quiz-${id}`] ?? 
                    (activeGenerations.has('quiz') ? pendingContentIds['quiz-pending'] : undefined);
                  const contentId = quiz?.content_id ?? storedContentId;
                  
                  // If we don't have content_id info yet and data is loaded, show it temporarily
                  if (contentId === undefined && !quiz && !isLoadingGeneratedContent) {
                    return true; // Show temporarily until data loads
                  }
                  
                  if (selectedContentId !== null && selectedContentId !== undefined) {
                    return contentId === selectedContentId;
                  } else {
                    return contentId === null || contentId === undefined;
                  }
                });
                const sortedQuizzes = filteredQuizzes.sort((a, b) => {
                  const quizA = generatedContent?.quizzes?.find((q) => q.id === a);
                  const quizB = generatedContent?.quizzes?.find((q) => q.id === b);
                  const timeA = quizA?.creation_timestamp || quizA?.reference_created_at || '';
                  const timeB = quizB?.creation_timestamp || quizB?.reference_created_at || '';
                  return timeB.localeCompare(timeA);
                });
                const isExpanded = expandedTypes.has('quiz');
                const hasMore = sortedQuizzes.length > 1;
                if (!hasMore) return null;
                return (
                  <button
                    onClick={() => {
                      setExpandedTypes((prev) => {
                        const next = new Set(prev);
                        if (isExpanded) {
                          next.delete('quiz');
                        } else {
                          next.add('quiz');
                        }
                        return next;
                      });
                    }}
                    className="w-full p-2 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 hover:bg-[#161F32] rounded border border-[#38BDF8]/20 transition-colors flex items-center justify-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show less ({sortedQuizzes.length - 1} older)
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show {sortedQuizzes.length - 1} older quiz{sortedQuizzes.length - 1 !== 1 ? 'zes' : ''}
                      </>
                    )}
                  </button>
                );
              })()}
              {(() => {
                // Filter flashcards by selected PDF (content_id)
                const filteredFlashcards = flashcardReferences.filter((id) => {
                  const flashcard = generatedContent?.flashcards?.find((f) => f.id === id);
                  
                  // If generatedContent is still loading OR not loaded yet, show all items
                  if (isLoadingGeneratedContent || !generatedContent) {
                    console.log(`[Filter] Flashcard ${id}: Showing (loading or no data)`);
                    return true;
                  }
                  
                  // If flashcard not found in generatedContent, show it temporarily (data might be stale)
                  if (!flashcard) {
                    console.log(`[Filter] Flashcard ${id}: Showing (not found in generatedContent)`);
                    return true;
                  }
                  
                  // Get content_id from flashcard or pendingContentIds
                  const storedContentId = pendingContentIds[`flashcard-${id}`] ?? 
                    (activeGenerations.has('flashcard') ? pendingContentIds['flashcard-pending'] : undefined);
                  
                  // Handle missing content_id: if field doesn't exist or is undefined, treat as null (all PDFs)
                  const flashcardAny = flashcard as any;
                  const flashcardContentId = flashcardAny.content_id !== undefined ? flashcardAny.content_id : null;
                  const contentId = flashcardContentId ?? storedContentId;
                  
                  console.log(`[Filter] Flashcard ${id}:`, {
                    flashcardFound: !!flashcard,
                    flashcardContentId: flashcard.content_id,
                    storedContentId,
                    finalContentId: contentId,
                    selectedContentId,
                    willShow: selectedContentId !== null && selectedContentId !== undefined 
                      ? contentId === selectedContentId 
                      : (contentId === null || contentId === undefined)
                  });
                  
                  if (selectedContentId !== null && selectedContentId !== undefined) {
                    return contentId === selectedContentId;
                  } else {
                    return contentId === null || contentId === undefined;
                  }
                });
                
            console.log('[Filter] Flashcard Results:', {
                  totalReferences: localFlashcardReferences.length,
                  filteredCount: filteredFlashcards.length,
                  filteredIds: filteredFlashcards
                });
                // Sort flashcards by creation timestamp (newest first)
                const sortedFlashcards = filteredFlashcards.sort((a, b) => {
                  const flashcardA = generatedContent?.flashcards?.find((f) => f.id === a);
                  const flashcardB = generatedContent?.flashcards?.find((f) => f.id === b);
                  const timeA = flashcardA?.creation_timestamp || flashcardA?.reference_created_at || '';
                  const timeB = flashcardB?.creation_timestamp || flashcardB?.reference_created_at || '';
                  return timeB.localeCompare(timeA); // Newest first (descending)
                });
                // Show only latest if not expanded
                const isExpanded = expandedTypes.has('flashcard');
                const displayFlashcards = isExpanded ? sortedFlashcards : sortedFlashcards.slice(0, 1);
                return { flashcards: displayFlashcards, hasMore: sortedFlashcards.length > 1, allFlashcards: sortedFlashcards };
              })().flashcards.map((id) => (
                <div
                  key={`flashcard-${id}`}
                  className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BookOpen className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                    <span className="text-sm text-white truncate" title={formatContentName('flashcard', id, flashcardReferences)}>
                      {formatContentName('flashcard', id, flashcardReferences)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('flashcard', id)}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare('flashcard', id)}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(() => {
                // Filter essays by selected PDF (content_id)
                const filteredEssays = localEssayReferences.filter((id) => {
                  const essay = generatedContent?.essays?.find((e) => e.id === id);
                  
                  // If generatedContent is still loading OR not loaded yet, show all items
                  if (isLoadingGeneratedContent || !generatedContent) {
                    console.log(`[Filter] Essay ${id}: Showing (loading or no data)`);
                    return true;
                  }
                  
                  // If essay not found in generatedContent, show it temporarily (data might be stale)
                  if (!essay) {
                    console.log(`[Filter] Essay ${id}: Showing (not found in generatedContent)`);
                    return true;
                  }
                  
                  // Get content_id from essay or pendingContentIds
                  const storedContentId = pendingContentIds[`essay-${id}`] ?? 
                    (activeGenerations.has('essay') ? pendingContentIds['essay-pending'] : undefined);
                  
                  // Handle missing content_id: if field doesn't exist or is undefined, treat as null (all PDFs)
                  const essayAny = essay as any;
                  const essayContentId = essayAny.content_id !== undefined ? essayAny.content_id : null;
                  const contentId = essayContentId ?? storedContentId;
                  
                  console.log(`[Filter] Essay ${id}:`, {
                    essayFound: !!essay,
                    essayContentId: essayAny.content_id,
                    normalizedContentId: essayContentId,
                    storedContentId,
                    finalContentId: contentId,
                    selectedContentId,
                    willShow: selectedContentId !== null && selectedContentId !== undefined 
                      ? contentId === selectedContentId 
                      : (contentId === null || contentId === undefined)
                  });
                  
                  if (selectedContentId !== null && selectedContentId !== undefined) {
                    return contentId === selectedContentId;
                  } else {
                    // Show items with null/undefined content_id (generated from all PDFs)
                    return contentId === null || contentId === undefined;
                  }
                });
                
                console.log('[Filter] Essay Results:', {
                  totalReferences: localEssayReferences.length,
                  filteredCount: filteredEssays.length,
                  filteredIds: filteredEssays
                });
                
                // Sort essays by creation timestamp (newest first)
                const sortedEssays = filteredEssays.sort((a, b) => {
                  const essayA = generatedContent?.essays?.find((e) => e.id === a);
                  const essayB = generatedContent?.essays?.find((e) => e.id === b);
                  const timeA = essayA?.creation_timestamp || essayA?.reference_created_at || '';
                  const timeB = essayB?.creation_timestamp || essayB?.reference_created_at || '';
                  return timeB.localeCompare(timeA); // Newest first (descending)
                });
                // Show only latest if not expanded
                const isExpanded = expandedTypes.has('essay');
                const displayEssays = isExpanded ? sortedEssays : sortedEssays.slice(0, 1);
                return { essays: displayEssays, hasMore: sortedEssays.length > 1, allEssays: sortedEssays };
              })().essays.map((id) => (
                <div
                  key={`essay-${id}`}
                  className="p-3 bg-[#161F32] rounded border border-[#38BDF8]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                    <span className="text-sm text-white truncate" title={formatContentName('essay', id, essayReferences)}>
                      {formatContentName('essay', id, essayReferences)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('essay', id)}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare('essay', id)}
                      className="p-1 text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {/* Show more/less button for essays */}
              {(() => {
                // Filter essays by selected PDF (content_id)
                const filteredEssays = essayReferences.filter((id) => {
                  const essay = generatedContent?.essays?.find((e) => e.id === id);
                  
                  // If generatedContent is still loading OR not loaded yet, show all items
                  if (isLoadingGeneratedContent || !generatedContent) {
                    return true;
                  }
                  
                  // If essay not found in generatedContent, show it temporarily (data might be stale)
                  if (!essay) {
                    return true;
                  }
                  
                  // Get content_id from essay or pendingContentIds
                  const storedContentId = pendingContentIds[`essay-${id}`] ?? 
                    (activeGenerations.has('essay') ? pendingContentIds['essay-pending'] : undefined);
                  const contentId = essay.content_id ?? storedContentId;
                  
                  if (selectedContentId !== null && selectedContentId !== undefined) {
                    return contentId === selectedContentId;
                  } else {
                    return contentId === null || contentId === undefined;
                  }
                });
                const sortedEssays = filteredEssays.sort((a, b) => {
                  const essayA = generatedContent?.essays?.find((e) => e.id === a);
                  const essayB = generatedContent?.essays?.find((e) => e.id === b);
                  const timeA = essayA?.creation_timestamp || essayA?.reference_created_at || '';
                  const timeB = essayB?.creation_timestamp || essayB?.reference_created_at || '';
                  return timeB.localeCompare(timeA);
                });
                const isExpanded = expandedTypes.has('essay');
                const hasMore = sortedEssays.length > 1;
                if (!hasMore) return null;
                return (
                  <button
                    onClick={() => {
                      setExpandedTypes((prev) => {
                        const next = new Set(prev);
                        if (isExpanded) {
                          next.delete('essay');
                        } else {
                          next.add('essay');
                        }
                        return next;
                      });
                    }}
                    className="w-full p-2 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 hover:bg-[#161F32] rounded border border-[#38BDF8]/20 transition-colors flex items-center justify-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show less ({sortedEssays.length - 1} older)
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show {sortedEssays.length - 1} older essay{sortedEssays.length - 1 !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal && shareModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Share {shareModal.type}</h3>
              <button
                onClick={() => setShareModal(null)}
                className="p-1 text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#94A3B8] mb-4">
              {shareModal.type === 'Quiz'
                ? `Share this link with students. They can take the quiz without signing in.`
                : `Share or view these ${shareModal.type.toLowerCase()}. You can copy them into your LMS, slides, or notes.`}
            </p>

            <div className="flex gap-2 mb-4">
              {shareModal.link ? (
                <input
                  type="text"
                  value={shareModal.link}
                  readOnly
                  className="flex-1 px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              ) : (
                <textarea
                  value={shareModal.content || ''}
                  readOnly
                  rows={8}
                  className="flex-1 px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white text-xs focus:outline-none focus:border-[#38BDF8] whitespace-pre-wrap"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              )}
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded font-semibold transition-colors flex items-center gap-2 ${
                  copiedShareCode === `${shareModal.type.toLowerCase()}-${shareModal.id}`
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221]'
                }`}
              >
                {copiedShareCode === `${shareModal.type.toLowerCase()}-${shareModal.id}` ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShareModal(null)}
                className="flex-1 px-4 py-2 bg-[#161F32] hover:bg-[#161F32]/80 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


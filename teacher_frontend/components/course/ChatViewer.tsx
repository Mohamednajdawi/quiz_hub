'use client';

import { useState, useEffect, memo } from 'react';
import { CourseContent, coursesApi } from '@/lib/api/courses';
import { MessageSquare, FileText, X, GitBranch, Loader2, BookOpen } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { mindMapsApi, type MindMapDetail } from '@/lib/api/mindmaps';
import { flashcardsApi, type FlashcardTopicResponse } from '@/lib/api/flashcards';
import MindMapCanvas from '@/components/mindmaps/MindMapCanvasFlow';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatViewerProps {
  courseId: number;
  contents: CourseContent[];
  selectedPdf?: CourseContent | null;
  onPdfDeselect?: () => void;
}

export const ChatViewer = memo(function ChatViewer({
  courseId,
  contents,
  selectedPdf,
  onPdfDeselect,
}: ChatViewerProps) {
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'viewer' | 'mindmap' | 'flashcard'>('chat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [mindMapData, setMindMapData] = useState<MindMapDetail | null>(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [mindMapError, setMindMapError] = useState<string | null>(null);
  const [mindMapJobId, setMindMapJobId] = useState<number | null>(null);

  const [flashcardData, setFlashcardData] = useState<FlashcardTopicResponse | null>(null);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [flashcardJobId, setFlashcardJobId] = useState<number | null>(null);
  const [flashcardCurrentIndex, setFlashcardCurrentIndex] = useState(0);
  const [flashcardFlippedCards, setFlashcardFlippedCards] = useState<Record<number, boolean>>({});

  // Handle external PDF selection from sidebar - open chat instead of viewer/mindmap/flashcard
  useEffect(() => {
    if (selectedPdf && selectedPdf.id !== selectedContent?.id) {
      setSelectedContent(selectedPdf);
      setViewMode('chat');
      // Reset mind map state when switching PDFs
      setMindMapData(null);
      setMindMapError(null);
      setMindMapJobId(null);
      setMindMapLoading(false);
      // Reset flashcard state when switching PDFs
      setFlashcardData(null);
      setFlashcardError(null);
      setFlashcardJobId(null);
      setFlashcardLoading(false);
      setFlashcardCurrentIndex(0);
      setFlashcardFlippedCards({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPdf]);

  // Auto-start flashcard generation when PDF is selected (background)
  useEffect(() => {
    if (!selectedContent || flashcardJobId || flashcardData) return;

    const autoStartFlashcardGeneration = async () => {
      try {
        setFlashcardError(null);
        setFlashcardLoading(true);

        // Check if flashcards already exist for this content
        const summaries = await flashcardsApi.getFlashcardsForContent(courseId, selectedContent.id);
        if (summaries.length > 0) {
          // Use the most recently created flashcard set
          const latest = summaries.reduce((latest, current) => {
            const latestTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
            const currentTime = current.created_at ? new Date(current.created_at).getTime() : 0;
            return currentTime > latestTime ? current : latest;
          });

          const full = await flashcardsApi.getByTopic(latest.id);
          setFlashcardData(full);
          setFlashcardLoading(false);
          return;
        }

        // Start generation in background
        const response = await flashcardsApi.startFlashcardGenerationJob(courseId, selectedContent.id, {
          num_cards: 10,
        });
        setFlashcardJobId(response.job_id);
      } catch (error: any) {
        console.error('Error auto-starting flashcard generation:', error);
        setFlashcardError(error.message || 'Failed to start flashcard generation');
        setFlashcardLoading(false);
        setFlashcardJobId(null);
      }
    };

    autoStartFlashcardGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContent?.id, courseId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Chat with all PDFs in the course, or specific PDF if selected
      const contentId = selectedContent?.id;
      const response = await coursesApi.chatWithPdfs(courseId, userMessage, contentId);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
        },
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get response. Please try again.';
      
      // Check if it's a generation limit error (402)
      const isLimitError = error.response?.status === 402 || error.status === 402 || errorMessage.includes('free generations') || errorMessage.includes('upgrade');
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isLimitError 
            ? `⚠️ ${errorMessage}`
            : `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPdf = async (content: CourseContent) => {
    setSelectedContent(content);
    setViewMode('viewer');
    setPdfError(null);
    
    // Clean up previous blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      // Fetch PDF with authentication
      const response = await apiClient.get(
        `/student-projects/${courseId}/content/${content.id}/view`,
        {
          responseType: 'blob',
        }
      );

      // Create blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      setPdfError(error.message || 'Failed to load PDF');
    }
  };

  const handleGenerateMindMap = async () => {
    if (!selectedContent) {
      setMindMapError('Select a PDF in the sidebar first to generate a mind map.');
      return;
    }

    try {
      setMindMapError(null);
      setMindMapLoading(true);
      setMindMapData(null);

      const response = await mindMapsApi.startMindMapGenerationJob(courseId, selectedContent.id, {
        include_examples: true,
      });
      setMindMapJobId(response.job_id);
      setViewMode('mindmap');
    } catch (error: any) {
      console.error('Error starting mind map generation:', error);
      setMindMapError(error.message || 'Failed to start mind map generation');
      setMindMapLoading(false);
      setMindMapJobId(null);
    }
  };

  const handleGenerateFlashcard = async () => {
    if (!selectedContent) {
      setFlashcardError('Select a PDF in the sidebar first to generate flashcards.');
      return;
    }

    try {
      setFlashcardError(null);
      setFlashcardLoading(true);
      setFlashcardData(null);

      const response = await flashcardsApi.startFlashcardGenerationJob(courseId, selectedContent.id, {
        num_cards: 10,
      });
      setFlashcardJobId(response.job_id);
      setViewMode('flashcard');
    } catch (error: any) {
      console.error('Error starting flashcard generation:', error);
      setFlashcardError(error.message || 'Failed to start flashcard generation');
      setFlashcardLoading(false);
      setFlashcardJobId(null);
    }
  };

  // When entering mind map view, try to load an existing mind map for this PDF before generating a new one
  useEffect(() => {
    const loadExistingMindMap = async () => {
      if (viewMode !== 'mindmap') return;
      if (!selectedContent) {
        setMindMapData(null);
        setMindMapError(null);
        setMindMapLoading(false);
        return;
      }
      if (mindMapJobId) {
        // Job already in progress; polling effect will handle updates
        return;
      }

      try {
        setMindMapLoading(true);
        setMindMapError(null);

        const summaries = await mindMapsApi.getMindMapsForContent(courseId, selectedContent.id);
        if (!summaries.length) {
          setMindMapLoading(false);
          return;
        }

        // Use the most recently created mind map
        const latest = summaries.reduce((latest, current) => {
          const latestTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
          const currentTime = current.created_at ? new Date(current.created_at).getTime() : 0;
          return currentTime > latestTime ? current : latest;
        });

        const full = await mindMapsApi.getMindMap(latest.id);
        setMindMapData(full);
        setMindMapLoading(false);
      } catch (error: any) {
        console.error('Error loading existing mind map:', error);
        setMindMapError(error.message || 'Failed to load existing mind map');
        setMindMapLoading(false);
      }
    };

    loadExistingMindMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedContent?.id, courseId]);

  // Poll generation job status when a job is active
  useEffect(() => {
    if (!mindMapJobId) return;

    let isCancelled = false;

    const poll = async () => {
      try {
        const status = await mindMapsApi.getGenerationJob(mindMapJobId);
        if (isCancelled) return;

        if (status.status === 'completed' && status.result?.mind_map_id) {
          const full = await mindMapsApi.getMindMap(status.result.mind_map_id);
          if (isCancelled) return;
          setMindMapData(full);
          setMindMapLoading(false);
          setMindMapJobId(null);
        } else if (status.status === 'failed') {
          setMindMapError(status.error_message || 'Mind map generation failed');
          setMindMapLoading(false);
          setMindMapJobId(null);
        } else {
          // Still pending/in_progress – poll again
          setTimeout(poll, 4000);
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('Error checking mind map job status:', error);
        setMindMapError(error.message || 'Failed to check mind map status');
        setMindMapLoading(false);
        setMindMapJobId(null);
      }
    };

    setMindMapLoading(true);
    poll();

    return () => {
      isCancelled = true;
    };
  }, [mindMapJobId]);

  // Poll flashcard generation job status when a job is active
  useEffect(() => {
    if (!flashcardJobId) return;

    let isCancelled = false;

    const poll = async () => {
      try {
        const status = await flashcardsApi.getGenerationJob(flashcardJobId);
        if (isCancelled) return;

        if (status.status === 'completed' && status.result?.flashcard_topic_id) {
          const full = await flashcardsApi.getByTopic(status.result.flashcard_topic_id);
          if (isCancelled) return;
          setFlashcardData(full);
          setFlashcardLoading(false);
          setFlashcardJobId(null);
        } else if (status.status === 'failed') {
          setFlashcardError(status.error_message || 'Flashcard generation failed');
          setFlashcardLoading(false);
          setFlashcardJobId(null);
        } else {
          // Still pending/in_progress – poll again
          setTimeout(poll, 4000);
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('Error checking flashcard job status:', error);
        setFlashcardError(error.message || 'Failed to check flashcard status');
        setFlashcardLoading(false);
        setFlashcardJobId(null);
      }
    };

    setFlashcardLoading(true);
    poll();

    return () => {
      isCancelled = true;
    };
  }, [flashcardJobId]);

  // When entering flashcard view, try to load an existing flashcard set for this PDF
  useEffect(() => {
    const loadExistingFlashcard = async () => {
      if (viewMode !== 'flashcard') return;
      if (!selectedContent) {
        setFlashcardData(null);
        setFlashcardError(null);
        setFlashcardLoading(false);
        return;
      }
      if (flashcardJobId) {
        // Job already in progress; polling effect will handle updates
        return;
      }

      try {
        setFlashcardLoading(true);
        setFlashcardError(null);

        const summaries = await flashcardsApi.getFlashcardsForContent(courseId, selectedContent.id);
        if (!summaries.length) {
          setFlashcardLoading(false);
          return;
        }

        // Use the most recently created flashcard set
        const latest = summaries.reduce((latest, current) => {
          const latestTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
          const currentTime = current.created_at ? new Date(current.created_at).getTime() : 0;
          return currentTime > latestTime ? current : latest;
        });

        const full = await flashcardsApi.getByTopic(latest.id);
        setFlashcardData(full);
        setFlashcardLoading(false);
      } catch (error: any) {
        console.error('Error loading existing flashcard:', error);
        setFlashcardError(error.message || 'Failed to load existing flashcard');
        setFlashcardLoading(false);
      }
    };

    loadExistingFlashcard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedContent?.id, courseId]);

  // Clean up blob URL on unmount or when content changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#38BDF8]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'chat'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (contents.length > 0 && !selectedContent) {
                setSelectedContent(contents[0]);
                setViewMode('viewer');
                handleViewPdf(contents[0]);
              } else if (selectedContent) {
                setViewMode('viewer');
                handleViewPdf(selectedContent);
              }
            }}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'viewer'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setViewMode('mindmap');
            }}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'mindmap'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
            title="Mind map"
          >
            <GitBranch className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setViewMode('flashcard');
            }}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'flashcard'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
            title="Flashcards"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
        {selectedContent && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#94A3B8]">{selectedContent.name}</span>
            <button
              onClick={() => {
                setSelectedContent(null);
                setViewMode('chat');
                onPdfDeselect?.();
              }}
              className="p-1 text-[#94A3B8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-[#94A3B8]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation about your PDFs</p>
                    <p className="text-sm mt-2">Ask questions about the uploaded content</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#38BDF8] text-[#0B1221]'
                          : 'bg-[#161F32] text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#161F32] p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#38BDF8]/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about your PDFs..."
                  className="flex-1 px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'viewer' ? (
          <div className="h-full">
            {pdfError ? (
              <div className="h-full flex items-center justify-center text-red-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Error loading PDF</p>
                  <p className="text-sm mt-2">{pdfError}</p>
                </div>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full"
                title={selectedContent?.name}
              />
            ) : selectedContent ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading PDF...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a PDF to view</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {!selectedContent ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center max-w-xs">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Select a PDF to generate a mind map.</p>
                  <p className="text-xs text-[#64748b]">
                    Choose a document from the left and then click &quot;Generate mind map&quot;.
                  </p>
                </div>
              </div>
            ) : mindMapError ? (
              <div className="h-full flex items-center justify-center text-red-400">
                <div className="text-center max-w-sm space-y-3">
                  <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-75" />
                  <p className="font-medium">Mind map error</p>
                  <p className="text-sm text-red-200">{mindMapError}</p>
                  <button
                    onClick={handleGenerateMindMap}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#38BDF8] text-[#0B1221] text-sm font-semibold hover:bg-[#38BDF8]/90 transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    Try generating again
                  </button>
                </div>
              </div>
            ) : mindMapLoading && !mindMapData ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Drawing your mind map...</p>
                </div>
              </div>
            ) : mindMapData ? (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Mind map for
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {mindMapData.title}
                  </p>
                  {mindMapData.central_idea && (
                    <p className="text-xs text-[#94A3B8]">
                      {mindMapData.central_idea}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-[#020617] border border-[#1f2937] p-2 sm:p-4">
                  <MindMapCanvas
                    nodes={mindMapData.nodes as any[]}
                    edges={mindMapData.edges as any[]}
                    centralIdea={mindMapData.central_idea}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateMindMap}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#38BDF8]/40 text-xs text-[#E2E8F0] hover:bg-[#0B1221] transition-colors"
                  >
                    {mindMapLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-3 h-3" />
                        Regenerate mind map
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center max-w-xs space-y-3">
                  <GitBranch className="w-10 h-10 mx-auto mb-1 opacity-75" />
                  <p className="font-medium text-sm text-white">
                    No mind map yet for this PDF
                  </p>
                  <p className="text-xs text-[#64748b]">
                    Turn this document into a visual mind map to see the main ideas and how they connect.
                  </p>
                  <button
                    onClick={handleGenerateMindMap}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#38BDF8] text-[#0B1221] text-sm font-semibold hover:bg-[#38BDF8]/90 transition-colors"
                  >
                    {mindMapLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4" />
                        Generate mind map
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'flashcard' ? (
          <div className="h-full flex flex-col">
            {!selectedContent ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center max-w-xs">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Select a PDF to generate flashcards.</p>
                  <p className="text-xs text-[#64748b]">
                    Choose a document from the left and flashcards will be generated automatically.
                  </p>
                </div>
              </div>
            ) : flashcardError ? (
              <div className="h-full flex items-center justify-center text-red-400">
                <div className="text-center max-w-sm space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-75" />
                  <p className="font-medium">Flashcard error</p>
                  <p className="text-sm text-red-200">{flashcardError}</p>
                  <button
                    onClick={handleGenerateFlashcard}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#38BDF8] text-[#0B1221] text-sm font-semibold hover:bg-[#38BDF8]/90 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Try generating again
                  </button>
                </div>
              </div>
            ) : flashcardLoading && !flashcardData ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Generating your flashcards...</p>
                </div>
              </div>
            ) : flashcardData && flashcardData.cards.length > 0 ? (
              <div className="h-full flex flex-col p-4">
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Flashcards for
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {flashcardData.topic}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {flashcardCurrentIndex + 1} of {flashcardData.cards.length}
                  </p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-xl">
                    {(() => {
                      const card = flashcardData.cards[flashcardCurrentIndex];
                      const isFlipped = !!flashcardFlippedCards[flashcardCurrentIndex];
                      return (
                        <div
                          className="relative w-full cursor-pointer"
                          onClick={() =>
                            setFlashcardFlippedCards((prev) => ({
                              ...prev,
                              [flashcardCurrentIndex]: !prev[flashcardCurrentIndex],
                            }))
                          }
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={isFlipped ? 'back' : 'front'}
                              initial={{ rotateY: 90, opacity: 0 }}
                              animate={{ rotateY: 0, opacity: 1 }}
                              exit={{ rotateY: -90, opacity: 0 }}
                              transition={{ duration: 0.35 }}
                              className="w-full min-h-[300px] rounded-xl border border-[#38BDF8]/40 bg-gradient-to-br from-[#020617] via-[#020617] to-[#1e293b] p-6 shadow-lg shadow-[#0f172a]/80 hover:border-[#38BDF8] transition-colors flex flex-col justify-center"
                            >
                              <p className="text-xs uppercase tracking-wide text-[#38BDF8] mb-3">
                                {isFlipped ? 'Back' : 'Front'}
                              </p>
                              <p className="text-base text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
                                {isFlipped ? card.back : card.front}
                              </p>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => {
                      setFlashcardCurrentIndex((prev) => Math.max(prev - 1, 0));
                      setFlashcardFlippedCards((prev) => {
                        const newState = { ...prev };
                        delete newState[flashcardCurrentIndex - 1];
                        return newState;
                      });
                    }}
                    disabled={flashcardCurrentIndex === 0}
                    className="px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161F32]/80 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleGenerateFlashcard}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#38BDF8]/40 text-xs text-[#E2E8F0] hover:bg-[#0B1221] transition-colors"
                  >
                    {flashcardLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3 h-3" />
                        Regenerate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setFlashcardCurrentIndex((prev) =>
                        Math.min(prev + 1, flashcardData.cards.length - 1)
                      );
                      setFlashcardFlippedCards((prev) => {
                        const newState = { ...prev };
                        delete newState[flashcardCurrentIndex + 1];
                        return newState;
                      });
                    }}
                    disabled={flashcardCurrentIndex === flashcardData.cards.length - 1}
                    className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] text-xs font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center max-w-xs space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto mb-1 opacity-75" />
                  <p className="font-medium text-sm text-white">
                    No flashcards yet for this PDF
                  </p>
                  <p className="text-xs text-[#64748b]">
                    Flashcards are being generated automatically in the background. They will appear here when ready.
                  </p>
                  {flashcardLoading && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                      <span className="text-xs">Generating...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});


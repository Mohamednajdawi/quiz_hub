'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Upload, FileText, Settings, HelpCircle, BookOpen, FileQuestion, PenTool, Sparkles, ChevronDown, ChevronUp, MessageSquare, Trash2, Eye, X, MoreVertical, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { studentProjectsApi, type StudentProject, type ProjectContent, type GenerationJobStatus } from '@/lib/api/studentProjects';
import { apiClient } from '@/lib/api/client';
import { format } from 'date-fns';
import { flashcardApi } from '@/lib/api/flashcards';
import { essayApi } from '@/lib/api/essay';

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}

interface GeneratedContent {
  quizzes: Array<{
    id: number;
    topic: string;
    category: string;
    subcategory: string;
    difficulty?: string;
    question_count: number;
    creation_timestamp?: string;
  }>;
  flashcards: Array<{
    id: number;
    topic: string;
    category: string;
    subcategory: string;
    difficulty?: string;
    card_count: number;
    creation_timestamp?: string;
  }>;
  essays: Array<{
    id: number;
    topic: string;
    category: string;
    subcategory: string;
    difficulty?: string;
    question_count: number;
    creation_timestamp?: string;
  }>;
}

function ContentItem({ 
  content, 
  projectId, 
  onGenerateQuiz, 
  onGenerateFlashcards, 
  onGenerateEssays,
  onDeleteContent,
  isGeneratingQuiz,
  isGeneratingFlashcards,
  isGeneratingEssays,
  isDeletingContent,
  generationMessage,
}: {
  content: ProjectContent;
  projectId: number;
  onGenerateQuiz: (content: ProjectContent) => void;
  onGenerateFlashcards: () => void;
  onGenerateEssays: () => void;
  onDeleteContent: () => void;
  isGeneratingQuiz: boolean;
  isGeneratingFlashcards: boolean;
  isGeneratingEssays: boolean;
  isDeletingContent: boolean;
  generationMessage: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: generatedContent, isLoading: loadingGenerated } = useQuery<GeneratedContent>({
    queryKey: ['generated-content', projectId, content.id],
    queryFn: () => studentProjectsApi.getContentGeneratedContent(projectId, content.id),
    enabled: expanded,
  });

  const handleViewQuiz = async (quizId: number) => {
    try {
      // Navigate directly to quiz detail page where editing is available
      router.push(`/quizzes/${quizId}`);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleViewFlashcards = async (flashcardId: number) => {
    try {
      const flashcardData = await flashcardApi.getFlashcards(flashcardId);
      router.push(`/flashcards/view?data=${encodeURIComponent(JSON.stringify(flashcardData))}`);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    }
  };

  const handleViewEssay = async (essayId: number) => {
    // Navigate directly to the essay detail page where users can answer questions
    router.push(`/essays/${essayId}`);
  };

  const hasGeneratedContent = generatedContent && (
    generatedContent.quizzes.length > 0 || 
    generatedContent.flashcards.length > 0 || 
    generatedContent.essays.length > 0
  );

  const sortByRecency = <T extends { creation_timestamp?: string | null }>(items: T[]) =>
    [...items].sort((a, b) => {
      const aTime = a.creation_timestamp ? new Date(a.creation_timestamp).getTime() : 0;
      const bTime = b.creation_timestamp ? new Date(b.creation_timestamp).getTime() : 0;
      return bTime - aTime;
    });

  const renderMeta = (creationTimestamp?: string | null, version?: number, isLatest?: boolean) => (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
      {isLatest && (
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
          Latest
        </span>
      )}
      {version !== undefined && (
        <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-white font-medium text-gray-700">
          v{version}
        </span>
      )}
      {creationTimestamp && (
        <span className="text-gray-500">
          {format(new Date(creationTimestamp), 'MMM d, yyyy • h:mm a')}
        </span>
      )}
    </div>
  );

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.generate-menu') && !target.closest('.more-menu')) {
        setShowGenerateMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* PDF Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-900 mb-1 break-words">{content.name}</h4>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{content.content_type.toUpperCase()}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{Math.round((content.file_size || 0) / 1024)} KB</span>
                {content.uploaded_at && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <span>Uploaded {format(new Date(content.uploaded_at), 'MMM d')}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
            {/* Primary Action: View */}
            {content.content_type === 'pdf' && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={async () => {
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                    const baseUrl = apiClient.defaults.baseURL?.replace(/\/$/, '') || '';
                    const response = await fetch(`${baseUrl}/student-projects/${projectId}/content/${content.id}/view`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (!response.ok) throw new Error('Failed to load PDF');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                    setShowPdfViewer(true);
                  } catch (error) {
                    console.error('Failed to load PDF:', error);
                    alert('Failed to load PDF. Please try again.');
                  }
                }}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View</span>
              </Button>
            )}

            {/* Generate Dropdown */}
            <div className="relative generate-menu">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowGenerateMenu(!showGenerateMenu)}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showGenerateMenu ? 'rotate-180' : ''}`} />
              </Button>
              {showGenerateMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      onGenerateQuiz(content);
                      setShowGenerateMenu(false);
                    }}
                    disabled={isGeneratingQuiz || isGeneratingFlashcards || isGeneratingEssays}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileQuestion className="w-4 h-4" />
                    <span className="flex-1">{isGeneratingQuiz ? generationMessage : 'Quiz'}</span>
                    {isGeneratingQuiz && <LoadingSpinner size="sm" />}
                  </button>
                  <button
                    onClick={() => {
                      onGenerateFlashcards();
                      setShowGenerateMenu(false);
                    }}
                    disabled={isGeneratingQuiz || isGeneratingFlashcards || isGeneratingEssays}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="flex-1">{isGeneratingFlashcards ? generationMessage : 'Flashcards'}</span>
                    {isGeneratingFlashcards && <LoadingSpinner size="sm" />}
                  </button>
                  <button
                    onClick={() => {
                      onGenerateEssays();
                      setShowGenerateMenu(false);
                    }}
                    disabled={isGeneratingQuiz || isGeneratingFlashcards || isGeneratingEssays}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PenTool className="w-4 h-4" />
                    <span className="flex-1">{isGeneratingEssays ? generationMessage : 'Essay Q&A'}</span>
                    {isGeneratingEssays && <LoadingSpinner size="sm" />}
                  </button>
                </div>
              )}
            </div>

            {/* More Menu */}
            <div className="relative more-menu">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center p-2"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {content.content_type === 'pdf' && (
                    <Link href={`/student-hub/${projectId}/chat?contentId=${content.id}`}>
                      <button
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat with PDF
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      onDeleteContent();
                      setShowMoreMenu(false);
                    }}
                    disabled={isDeletingContent}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeletingContent ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generated Content Section */}
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded) {
                queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, content.id] });
              }
            }}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Generated Content
              {generatedContent && (
                <span className="text-xs text-gray-500">
                  ({generatedContent.quizzes.length + generatedContent.flashcards.length + generatedContent.essays.length})
                </span>
              )}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="mt-4 space-y-4">
              {loadingGenerated ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : hasGeneratedContent ? (
                <>
                  {/* Quizzes */}
                  {generatedContent.quizzes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-indigo-600" />
                        Quizzes ({generatedContent.quizzes.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sortByRecency(generatedContent.quizzes).map((quiz, index, array) => {
                          const version = array.length - index;
                          const isLatest = index === 0;
                          return (
                          <div
                            key={quiz.id}
                            className="text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200 flex items-center justify-between gap-2"
                          >
                            <button
                              onClick={() => handleViewQuiz(quiz.id)}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="font-medium text-sm text-gray-900 truncate">{quiz.topic}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {quiz.question_count} questions
                                {quiz.difficulty && ` • ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}`}
                              </div>
                              {renderMeta(quiz.creation_timestamp, version, isLatest)}
                            </button>
                            <button
                              onClick={() => handleViewQuiz(quiz.id)}
                              className="flex-shrink-0 p-1.5 text-indigo-600 hover:bg-indigo-200 rounded transition-colors"
                              title="Edit quiz"
                              aria-label="Edit quiz"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  {/* Flashcards */}
                  {generatedContent.flashcards.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Flashcards ({generatedContent.flashcards.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sortByRecency(generatedContent.flashcards).map((flashcard, index, array) => {
                          const version = array.length - index;
                          const isLatest = index === 0;
                          return (
                          <button
                            key={flashcard.id}
                            onClick={() => handleViewFlashcards(flashcard.id)}
                            className="text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200"
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">{flashcard.topic}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {flashcard.card_count} cards
                              {flashcard.difficulty && ` • ${flashcard.difficulty.charAt(0).toUpperCase() + flashcard.difficulty.slice(1)}`}
                            </div>
                            {renderMeta(flashcard.creation_timestamp, version, isLatest)}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}

                  {/* Essays */}
                  {generatedContent.essays.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-indigo-600" />
                        Essays ({generatedContent.essays.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sortByRecency(generatedContent.essays).map((essay, index, array) => {
                          const version = array.length - index;
                          const isLatest = index === 0;
                          return (
                          <button
                            key={essay.id}
                            onClick={() => handleViewEssay(essay.id)}
                            className="text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200"
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">{essay.topic}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {essay.question_count} questions
                              {essay.difficulty && ` • ${essay.difficulty.charAt(0).toUpperCase() + essay.difficulty.slice(1)}`}
                            </div>
                            {renderMeta(essay.creation_timestamp, version, isLatest)}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-sm text-gray-600">
                  <p>No generated content yet.</p>
                  <p className="text-xs mt-1">Generate quizzes, flashcards, or essays from this PDF to see them here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {content.content_type === 'pdf' && (
        <div className={showPdfViewer ? 'fixed inset-0 z-50 overflow-y-auto' : 'hidden'}>
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowPdfViewer(false);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
              }}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full p-6" style={{ maxHeight: '90vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 truncate">{content.name || 'PDF Viewer'}</h2>
                <button
                  onClick={() => {
                    setShowPdfViewer(false);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors flex-shrink-0 ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* PDF Content */}
              <div className="w-full" style={{ height: 'calc(90vh - 100px)' }}>
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border border-gray-200 rounded-lg"
                    title={content.name || 'PDF Document'}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Settings Modal Component
function SettingsModal({
  isOpen,
  onClose,
  questionMode,
  setQuestionMode,
  numQuestions,
  setNumQuestions,
  numCards,
  setNumCards,
  difficulty,
  setDifficulty,
}: {
  isOpen: boolean;
  onClose: () => void;
  questionMode: 'auto' | 'custom';
  setQuestionMode: (value: 'auto' | 'custom') => void;
  numQuestions: number;
  setNumQuestions: (value: number) => void;
  numCards: number;
  setNumCards: (value: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  setDifficulty: (value: 'easy' | 'medium' | 'hard') => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Generation Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={questionMode}
              onChange={(e) => setQuestionMode(e.target.value as 'auto' | 'custom')}
            >
              <option value="auto">Auto (recommended)</option>
              <option value="custom">Specify manually</option>
            </select>
            {questionMode === 'custom' && (
              <div className="mt-3">
                <Input
                  label="Custom Question Count"
                  type="number"
                  min={1}
                  max={20}
                  value={numQuestions}
                  onChange={(e) =>
                    setNumQuestions(
                      Math.max(
                        1,
                        Math.min(20, parseInt(e.target.value || '0', 10) || 1)
                      )
                    )
                  }
                />
              </div>
            )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Flashcards
              </label>
              <Input 
                type="number" 
                min={1}
                max={50}
                value={numCards} 
                onChange={(e) => setNumCards(parseInt(e.target.value || '10', 10))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>These settings apply to all generation actions. Adjust before generating content.</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<File[]>([]);
  const [questionMode, setQuestionMode] = useState<'auto' | 'custom'>('auto');
  const [numQuestions, setNumQuestions] = useState(8);
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    type: 'quiz' | 'flashcards' | 'essays' | null;
    messageIndex: number;
  }>({ type: null, messageIndex: 0 });
  const [pendingContentId, setPendingContentId] = useState<number | null>(null);
  const [activeJobs, setActiveJobs] = useState<Array<{ jobId: number; contentId: number; contentName: string; jobType: 'quiz' | 'essay' }>>([]);
  const [readyQuizzes, setReadyQuizzes] = useState<Array<{ jobId: number; quizId: number; topic: string; contentName: string }>>([]);
  const [readyEssays, setReadyEssays] = useState<Array<{ jobId: number; essayId: number; topic: string; contentName: string }>>([]);
  const activeJobsRef = useRef(activeJobs);

  useEffect(() => {
    activeJobsRef.current = activeJobs;
  }, [activeJobs]);

  const { data: project, isLoading: projectLoading } = useQuery<StudentProject>({
    queryKey: ['student-project', projectId],
    queryFn: () => studentProjectsApi.getProject(projectId),
  });

  const { data: contents, isLoading: contentsLoading } = useQuery<ProjectContent[]>({
    queryKey: ['student-project-contents', projectId],
    queryFn: () => studentProjectsApi.listContents(projectId),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (files.length === 0) throw new Error('Select at least one PDF to upload');
      if (files.length === 1) {
        return studentProjectsApi.uploadPdf(projectId, files[0]);
      }
      return studentProjectsApi.uploadPdfs(projectId, files);
    },
    onSuccess: (data) => {
      setFiles([]);
      const uploadedCount = data.content?.length || 0;
      if (data.partial_success && data.errors) {
        setSuccess(`Successfully uploaded ${uploadedCount} file(s). ${data.errors.length} file(s) failed.`);
        setError(data.errors.join('; '));
      } else {
        setSuccess(`${uploadedCount} PDF${uploadedCount > 1 ? 's' : ''} uploaded successfully!`);
        setError(null);
      }
      queryClient.invalidateQueries({ queryKey: ['student-project-contents', projectId] });
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Upload failed');
      setSuccess(null);
    },
  });

  // Predefined generation messages
  const generationMessages = {
    quiz: [
      'Analyzing PDF content...',
      'Extracting key concepts...',
      'Generating questions...',
      'Creating answer options...',
      'Finalizing quiz...',
    ],
    flashcards: [
      'Reading document...',
      'Identifying important points...',
      'Creating flashcard pairs...',
      'Organizing content...',
      'Almost done...',
    ],
    essays: [
      'Processing document...',
      'Understanding context...',
      'Formulating essay questions...',
      'Preparing detailed answers...',
      'Finalizing content...',
    ],
  } as const;

  // Cycle through messages during generation
  useEffect(() => {
    if (!generationStatus.type) return;

    const messages = generationMessages[generationStatus.type];
    const interval = setInterval(() => {
      setGenerationStatus((prev) => ({
        ...prev,
        messageIndex: (prev.messageIndex + 1) % messages.length,
      }));
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationStatus.type]);

  const getGenerationMessage = () => {
    if (!generationStatus.type) return 'Generating...';
    const messages = generationMessages[generationStatus.type];
    return messages[generationStatus.messageIndex] || 'Generating...';
  };

  const isQuizGenerationActive = (contentId: number) =>
    (generateQuizMutation.isPending && pendingContentId === contentId) ||
    activeJobs.some((job) => job.contentId === contentId);

  const getQuizGenerationLabel = (contentId: number) => {
    if (generateQuizMutation.isPending && pendingContentId === contentId) {
      return getGenerationMessage();
    }
    if (activeJobs.some((job) => job.contentId === contentId)) {
      return 'Generating in background...';
    }
    return 'Quiz';
  };

  const isEssayGenerationActive = (contentId: number) =>
    (generateEssaysMutation.isPending && pendingContentId === contentId) ||
    activeJobs.some((job) => job.contentId === contentId && job.jobType === 'essay');

  const getEssayGenerationLabel = (contentId: number) => {
    if (generateEssaysMutation.isPending && pendingContentId === contentId) {
      return getGenerationMessage();
    }
    if (activeJobs.some((job) => job.contentId === contentId && job.jobType === 'essay')) {
      return 'Generating in background...';
    }
    return 'Essay Q&A';
  };

  const isFlashcardGenerationActive = (contentId: number) =>
    generateFlashcardsMutation.isPending && pendingContentId === contentId;

  const getFlashcardGenerationLabel = (contentId: number) => {
    if (generateFlashcardsMutation.isPending && pendingContentId === contentId) {
      return getGenerationMessage();
    }
    return 'Flashcards';
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // Silently fail if user denies
      });
    }
  }, []);

  useEffect(() => {
    if (activeJobs.length === 0) {
      return;
    }

    let isMounted = true;
    const interval = setInterval(async () => {
      const jobsSnapshot = [...activeJobsRef.current];
      if (jobsSnapshot.length === 0) {
        return;
      }

      try {
        const statuses = await Promise.all(
          jobsSnapshot.map((job) => studentProjectsApi.getGenerationJob(job.jobId))
        );

        if (!isMounted) {
          return;
        }

        const completed: Array<{ job: typeof jobsSnapshot[number]; status: GenerationJobStatus }> = [];
        const failed: Array<{ job: typeof jobsSnapshot[number]; status: GenerationJobStatus }> = [];

        statuses.forEach((status, index) => {
          const jobMeta = jobsSnapshot[index];
          if (status.status === 'completed' && status.result && (status.result.quiz_id || status.result.essay_id)) {
            completed.push({ job: jobMeta, status });
          } else if (status.status === 'failed') {
            failed.push({ job: jobMeta, status });
          }
        });

        if (completed.length || failed.length) {
          const jobsToRemove = new Set<number>([
            ...completed.map((item) => item.job.jobId),
            ...failed.map((item) => item.job.jobId),
          ]);

          const nextJobs = activeJobsRef.current.filter((job) => !jobsToRemove.has(job.jobId));
          activeJobsRef.current = nextJobs;
          setActiveJobs(nextJobs);

          completed.forEach(({ job, status }) => {
            if (status.result?.quiz_id) {
              const quizInfo = {
                jobId: job.jobId,
                quizId: status.result.quiz_id,
                topic: status.result.topic,
                contentName: job.contentName,
              };
              setReadyQuizzes((prev) => [...prev, quizInfo]);
              
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Quiz Ready!', {
                  body: `"${quizInfo.topic}" has been generated from ${job.contentName}. Click to open it.`,
                  icon: '/favicon.ico',
                  tag: `quiz-${quizInfo.quizId}`,
                });
              } else if ('Notification' in window && Notification.permission === 'default') {
                // Request permission for future notifications
                Notification.requestPermission();
              }
            } else if (status.result?.essay_id) {
              const essayInfo = {
                jobId: job.jobId,
                essayId: status.result.essay_id,
                topic: status.result.topic,
                contentName: job.contentName,
              };
              setReadyEssays((prev) => [...prev, essayInfo]);
              
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Essay Q&A Ready!', {
                  body: `"${essayInfo.topic}" has been generated from ${job.contentName}. Click to open it.`,
                  icon: '/favicon.ico',
                  tag: `essay-${essayInfo.essayId}`,
                });
              } else if ('Notification' in window && Notification.permission === 'default') {
                // Request permission for future notifications
                Notification.requestPermission();
              }
            }
            
            queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, job.contentId] });
            queryClient.invalidateQueries({ queryKey: ['student-project', projectId] });
          });

          if (failed.length) {
            const message = failed
              .map(({ job, status }) => `${job.contentName}: ${status.error_message || 'Generation failed'}`)
              .join(' | ');
            setError(message);
          }
        }
      } catch (pollError) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to poll generation jobs', pollError);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeJobs.length, projectId, queryClient]);

  const generateQuizMutation = useMutation({
    mutationFn: ({ contentId, contentName }: { contentId: number; contentName: string }) => {
      setGenerationStatus({ type: 'quiz', messageIndex: 0 });
      setPendingContentId(contentId);
      const desiredQuestions = questionMode === 'custom' ? numQuestions : undefined;
      return studentProjectsApi.startQuizGenerationJob(projectId, contentId, {
        num_questions: desiredQuestions,
        difficulty,
      }).then((response) => ({ response, contentId, contentName }));
    },
    onSuccess: ({ response, contentId, contentName }) => {
      setSuccess('Quiz generation started! We will notify you when it is ready.');
      setError(null);
      setActiveJobs((prev) => [
        ...prev,
        { jobId: response.job_id, contentId, contentName, jobType: 'quiz' },
      ]);
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Failed to start quiz generation');
      setSuccess(null);
    },
    onSettled: () => {
      setGenerationStatus({ type: null, messageIndex: 0 });
      setPendingContentId(null);
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: (contentId: number) => {
      setGenerationStatus({ type: 'flashcards', messageIndex: 0 });
      setPendingContentId(contentId);
      return studentProjectsApi.generateFlashcardsFromContent(projectId, contentId, numCards);
    },
    onSuccess: (data) => {
      setGenerationStatus({ type: null, messageIndex: 0 });
      setPendingContentId(null);
      setSuccess('Flashcards generated successfully!');
      setError(null);
      // Invalidate generated content queries for all contents
      contents?.forEach((c) => {
        queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, c.id] });
      });
      router.push(`/flashcards/view?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (error: unknown) => {
      setGenerationStatus({ type: null, messageIndex: 0 });
      setPendingContentId(null);
      setError(
        error instanceof Error ? error.message : 'Failed to generate flashcards'
      );
      setSuccess(null);
    },
  });

  const generateEssaysMutation = useMutation({
    mutationFn: ({ contentId, contentName }: { contentId: number; contentName: string }) => {
      setGenerationStatus({ type: 'essays', messageIndex: 0 });
      setPendingContentId(contentId);
      const desiredQuestions = questionMode === 'custom' ? numQuestions : undefined;
      return studentProjectsApi.startEssayGenerationJob(projectId, contentId, {
        num_questions: desiredQuestions,
        difficulty,
      }).then((response) => ({ response, contentId, contentName }));
    },
    onSuccess: ({ response, contentId, contentName }) => {
      setSuccess('Essay generation started! We will notify you when it is ready.');
      setError(null);
      setActiveJobs((prev) => [
        ...prev,
        { jobId: response.job_id, contentId, contentName, jobType: 'essay' },
      ]);
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Failed to start essay generation');
      setSuccess(null);
    },
    onSettled: () => {
      setGenerationStatus({ type: null, messageIndex: 0 });
      setPendingContentId(null);
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: (contentId: number) => studentProjectsApi.deleteContent(projectId, contentId),
    onSuccess: () => {
      setSuccess('PDF deleted successfully!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['student-project-contents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['student-project', projectId] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: unknown) => {
      setError(
        error instanceof Error ? error.message : 'Failed to delete PDF'
      );
      setSuccess(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => studentProjectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-projects'] });
      router.push('/student-hub');
    },
    onError: (error: unknown) => {
      setError(
        error instanceof Error ? error.message : 'Failed to delete project'
      );
      setSuccess(null);
    },
  });

  if (projectLoading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-6">
            <Link href="/student-hub" className="inline-flex items-center text-sm text-gray-700 hover:text-indigo-600 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project?.name || 'Project'}</h1>
                {project?.description && (
                  <p className="text-gray-700">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/student-hub/${projectId}/chat`}>
                  <Button variant="primary" size="lg">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with PDFs
                  </Button>
                </Link>
                {/* Project Menu */}
                <div className="relative project-menu">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                    className="flex items-center p-2"
                    title="Project options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                  {showProjectMenu && (
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowProjectMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Generation Settings
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setShowProjectMenu(false);
                          if (confirm(`Are you sure you want to delete the project "${project?.name}"? This will delete all PDFs, quizzes, flashcards, and essays in this project. This action cannot be undone.`)) {
                            deleteProjectMutation.mutate();
                          }
                        }}
                        disabled={deleteProjectMutation.isPending}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && <Alert type="error" className="mb-6">{error}</Alert>}
          {success && <Alert type="success" className="mb-6">{success}</Alert>}

          {readyQuizzes.map((entry) => (
            <Alert key={entry.jobId} type="success" className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  Quiz ready: <span className="text-indigo-700">{entry.topic}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Generated from <span className="font-medium">{entry.contentName}</span>. Click below to open it.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setReadyQuizzes((prev) => prev.filter((item) => item.jobId !== entry.jobId));
                  router.push(`/quizzes/${entry.quizId}`);
                }}
              >
                Open Quiz
              </Button>
            </Alert>
          ))}

          {readyEssays.map((entry) => (
            <Alert key={entry.jobId} type="success" className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  Essay Q&A ready: <span className="text-indigo-700">{entry.topic}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Generated from <span className="font-medium">{entry.contentName}</span>. Click below to open it.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setReadyEssays((prev) => prev.filter((item) => item.jobId !== entry.jobId));
                  router.push(`/essays/${entry.essayId}`);
                }}
              >
                Open Essay Q&A
              </Button>
            </Alert>
          ))}

          {activeJobs.length > 0 && (() => {
            const quizJobs = activeJobs.filter(job => job.jobType === 'quiz');
            const essayJobs = activeJobs.filter(job => job.jobType === 'essay');
            const totalJobs = activeJobs.length;
            
            return (
              <Alert type="info" className="mb-6">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-gray-900">
                    {totalJobs === 1
                      ? `Generating 1 ${activeJobs[0].jobType === 'quiz' ? 'quiz' : 'essay'} in the background...`
                      : `Generating ${totalJobs} items in the background...`}
                    {totalJobs > 1 && (
                      <span className="text-gray-600">
                        {' '}({quizJobs.length} quiz{quizJobs.length !== 1 ? 'zes' : ''}, {essayJobs.length} essay{essayJobs.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-700">
                    You can keep working while we process these. We'll notify you as soon as each item is ready.
                  </p>
                </div>
              </Alert>
            );
          })()}
          
          {/* Generation Status Alert */}
          {((generateQuizMutation.isPending && pendingContentId !== null) || 
            (generateFlashcardsMutation.isPending && pendingContentId !== null) || 
            (generateEssaysMutation.isPending && pendingContentId !== null)) ? (
            <Alert type="info" className="mb-6">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <div>
                  <p className="font-medium text-gray-900">{getGenerationMessage()}</p>
                  <p className="text-sm text-gray-600 mt-1">This may take a few moments...</p>
                </div>
              </div>
            </Alert>
          ) : null}

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            questionMode={questionMode}
            setQuestionMode={setQuestionMode}
            numQuestions={numQuestions}
            setNumQuestions={setNumQuestions}
            numCards={numCards}
            setNumCards={setNumCards}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Upload & Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upload Section */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Upload PDFs</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select PDF Files
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []);
                        setFiles(selectedFiles);
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    />
                    {files.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {files.map((file, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded-md flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700 flex-1 min-w-0">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-gray-500 flex-shrink-0">({Math.round(file.size / 1024)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = files.filter((_, i) => i !== index);
                                setFiles(newFiles);
                              }}
                              className="text-red-600 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {files.length > 0 && (
                      <p className="mt-2 text-xs text-gray-600">
                        {files.length} file{files.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    variant="primary"
                    onClick={() => uploadMutation.mutate()}
                    isLoading={uploadMutation.isPending}
                    disabled={files.length === 0}
                    size="lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length > 1 ? `${files.length} PDFs` : 'PDF'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">Project Files</h3>
                </div>
                {contents && contents.length > 0 && (
                  <span className="text-sm text-gray-700">{contents.length} {contents.length === 1 ? 'file' : 'files'}</span>
                )}
              </div>

              {contentsLoading ? (
                <Card>
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : !contents || contents.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
                    <p className="text-gray-700 mb-6">Upload your first PDF to start generating study materials</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                        <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
                        <p className="font-medium text-gray-900 mb-1">Quizzes</p>
                        <p className="text-center">Test your knowledge</p>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                        <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
                        <p className="font-medium text-gray-900 mb-1">Flashcards</p>
                        <p className="text-center">Quick review</p>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                        <PenTool className="w-6 h-6 text-indigo-600 mb-2" />
                        <p className="font-medium text-gray-900 mb-1">Essays</p>
                        <p className="text-center">Deep understanding</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {contents.map((c) => (
                    <ContentItem
                      key={c.id}
                      content={c}
                      projectId={projectId}
                      onGenerateQuiz={(selectedContent) =>
                        generateQuizMutation.mutate({
                          contentId: selectedContent.id,
                          contentName: selectedContent.name,
                        })
                      }
                      onGenerateFlashcards={() => generateFlashcardsMutation.mutate(c.id)}
                      onGenerateEssays={() => generateEssaysMutation.mutate({
                        contentId: c.id,
                        contentName: c.name,
                      })}
                      onDeleteContent={() => {
                        if (confirm(`Are you sure you want to delete "${c.name}"? This will also delete all quizzes, flashcards, and essays generated from this PDF. This action cannot be undone.`)) {
                          deleteContentMutation.mutate(c.id);
                        }
                      }}
                      isGeneratingQuiz={isQuizGenerationActive(c.id)}
                      isGeneratingFlashcards={isFlashcardGenerationActive(c.id)}
                      isGeneratingEssays={isEssayGenerationActive(c.id)}
                      isDeletingContent={deleteContentMutation.isPending}
                      generationMessage={
                        isQuizGenerationActive(c.id) ? getQuizGenerationLabel(c.id) :
                        isFlashcardGenerationActive(c.id) ? getFlashcardGenerationLabel(c.id) :
                        isEssayGenerationActive(c.id) ? getEssayGenerationLabel(c.id) :
                        'Generate'
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

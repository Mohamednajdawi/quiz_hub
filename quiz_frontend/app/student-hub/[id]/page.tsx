'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Upload, FileText, Settings, HelpCircle, BookOpen, FileQuestion, PenTool, Sparkles, ChevronDown, ChevronUp, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { studentProjectsApi, type StudentProject, type ProjectContent } from '@/lib/api/studentProjects';
import { format } from 'date-fns';
import { quizApi } from '@/lib/api/quiz';
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
}: {
  content: ProjectContent;
  projectId: number;
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
  onGenerateEssays: () => void;
  onDeleteContent: () => void;
  isGeneratingQuiz: boolean;
  isGeneratingFlashcards: boolean;
  isGeneratingEssays: boolean;
  isDeletingContent: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: generatedContent, isLoading: loadingGenerated } = useQuery<GeneratedContent>({
    queryKey: ['generated-content', projectId, content.id],
    queryFn: () => studentProjectsApi.getContentGeneratedContent(projectId, content.id),
    enabled: expanded,
  });

  const handleViewQuiz = async (quizId: number) => {
    try {
      const quizData = await quizApi.getQuiz(quizId);
      router.push(`/quizzes/take?data=${encodeURIComponent(JSON.stringify(quizData))}`);
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
    try {
      const essayData = await essayApi.getEssayQA(essayId);
      router.push(`/essays/view?data=${encodeURIComponent(JSON.stringify(essayData))}`);
    } catch (error) {
      console.error('Failed to load essay:', error);
    }
  };

  const hasGeneratedContent = generatedContent && (
    generatedContent.quizzes.length > 0 || 
    generatedContent.flashcards.length > 0 || 
    generatedContent.essays.length > 0
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* PDF Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-900 mb-1 truncate">{content.name}</h4>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{content.content_type.toUpperCase()}</span>
                </span>
                <span>•</span>
                <span>{Math.round((content.file_size || 0) / 1024)} KB</span>
                {content.uploaded_at && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>Uploaded {format(new Date(content.uploaded_at), 'MMM d')}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGenerateQuiz} 
              isLoading={isGeneratingQuiz}
              className="flex items-center gap-1"
            >
              <FileQuestion className="w-4 h-4" />
              Quiz
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGenerateFlashcards} 
              isLoading={isGeneratingFlashcards}
              className="flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Cards
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGenerateEssays} 
              isLoading={isGeneratingEssays}
              className="flex items-center gap-1"
            >
              <PenTool className="w-4 h-4" />
              Essay
            </Button>
            {content.content_type === 'pdf' && (
              <Link href={`/student-hub/${projectId}/chat?contentId=${content.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDeleteContent}
              isLoading={isDeletingContent}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
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
                        {generatedContent.quizzes.map((quiz) => (
                          <button
                            key={quiz.id}
                            onClick={() => handleViewQuiz(quiz.id)}
                            className="text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200"
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">{quiz.topic}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {quiz.question_count} questions
                              {quiz.difficulty && ` • ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}`}
                            </div>
                          </button>
                        ))}
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
                        {generatedContent.flashcards.map((flashcard) => (
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
                          </button>
                        ))}
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
                        {generatedContent.essays.map((essay) => (
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
                          </button>
                        ))}
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
    </Card>
  );
}

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    onError: (e: any) => {
      setError(e.message || 'Upload failed');
      setSuccess(null);
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: (contentId: number) => studentProjectsApi.generateQuizFromContent(projectId, contentId, numQuestions, difficulty),
    onSuccess: (data) => {
      setSuccess('Quiz generated successfully!');
      setError(null);
      // Invalidate generated content queries for all contents
      contents?.forEach((c) => {
        queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, c.id] });
      });
      router.push(`/quizzes/take?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (e: any) => {
      setError(e.message || 'Failed to generate quiz');
      setSuccess(null);
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: (contentId: number) => studentProjectsApi.generateFlashcardsFromContent(projectId, contentId, numCards),
    onSuccess: (data) => {
      setSuccess('Flashcards generated successfully!');
      setError(null);
      // Invalidate generated content queries for all contents
      contents?.forEach((c) => {
        queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, c.id] });
      });
      router.push(`/flashcards/view?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (e: any) => {
      setError(e.message || 'Failed to generate flashcards');
      setSuccess(null);
    },
  });

  const generateEssaysMutation = useMutation({
    mutationFn: (contentId: number) => studentProjectsApi.generateEssaysFromContent(projectId, contentId, numQuestions, difficulty),
    onSuccess: (data) => {
      setSuccess('Essay Q&A generated successfully!');
      setError(null);
      // Invalidate generated content queries for all contents
      contents?.forEach((c) => {
        queryClient.invalidateQueries({ queryKey: ['generated-content', projectId, c.id] });
      });
      router.push(`/essays/view?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (e: any) => {
      setError(e.message || 'Failed to generate essay Q&A');
      setSuccess(null);
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
    onError: (e: any) => {
      setError(e.message || 'Failed to delete PDF');
      setSuccess(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => studentProjectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-projects'] });
      router.push('/student-hub');
    },
    onError: (e: any) => {
      setError(e.message || 'Failed to delete project');
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
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete the project "${project?.name}"? This will delete all PDFs, quizzes, flashcards, and essays in this project. This action cannot be undone.`)) {
                      deleteProjectMutation.mutate();
                    }
                  }}
                  isLoading={deleteProjectMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </div>
          </div>

          {error && <Alert type="error" className="mb-6">{error}</Alert>}
          {success && <Alert type="success" className="mb-6">{success}</Alert>}

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

              {/* Generation Settings */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Generation Settings</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <Input 
                      type="number" 
                      min={1}
                      max={20}
                      value={numQuestions} 
                      onChange={(e) => setNumQuestions(parseInt(e.target.value || '5', 10))} 
                    />
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
                      onChange={(e) => setDifficulty(e.target.value as any)}
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
                      onGenerateQuiz={() => generateQuizMutation.mutate(c.id)}
                      onGenerateFlashcards={() => generateFlashcardsMutation.mutate(c.id)}
                      onGenerateEssays={() => generateEssaysMutation.mutate(c.id)}
                      onDeleteContent={() => {
                        if (confirm(`Are you sure you want to delete "${c.name}"? This will also delete all quizzes, flashcards, and essays generated from this PDF. This action cannot be undone.`)) {
                          deleteContentMutation.mutate(c.id);
                        }
                      }}
                      isGeneratingQuiz={generateQuizMutation.isPending}
                      isGeneratingFlashcards={generateFlashcardsMutation.isPending}
                      isGeneratingEssays={generateEssaysMutation.isPending}
                      isDeletingContent={deleteContentMutation.isPending}
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

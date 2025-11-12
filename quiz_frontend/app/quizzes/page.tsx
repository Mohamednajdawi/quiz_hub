'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import { quizApi } from '@/lib/api/quiz';
import type { URLRequest } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function QuizzesPageContent() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<'url' | 'pdf'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questionMode, setQuestionMode] = useState<'auto' | 'custom'>('auto');
  const [numQuestions, setNumQuestions] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  
  // Check if user has reached their free token limit (only for free users)
  const isPro = user?.account_type === 'pro' || user?.subscription?.status === 'active';
  const hasReachedLimit = !isPro && user && typeof user.free_tokens === 'number' && user.free_tokens === 0;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (sourceType === 'url') {
        const payload: URLRequest = {
          url,
          difficulty,
        };
        if (questionMode === 'custom') {
          payload.num_questions = numQuestions;
        }
        return quizApi.generateFromURL(payload);
      } else {
        if (!file) throw new Error('Please select a PDF file');
        return quizApi.generateFromPDF(
          file,
          questionMode === 'custom' ? numQuestions : undefined,
          difficulty
        );
      }
    },
    onSuccess: (data) => {
      // If quiz has an ID, navigate to quiz detail page, otherwise go to take page
      if (data.quiz_id) {
        router.push(`/quizzes/${data.quiz_id}`);
      } else {
        // Navigate to quiz taking page with the generated quiz data
        router.push(`/quizzes/take?data=${encodeURIComponent(JSON.stringify(data))}`);
      }
    },
    onError: (error: unknown) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
        (
          (error as { response?: { status?: number } }).response?.status === 402 ||
          (
            'message' in error &&
            typeof (error as { message?: string }).message === 'string' &&
            ((error as { message?: string }).message ?? '').toLowerCase().includes('payment')
          ) ||
          (
            'message' in error &&
            typeof (error as { message?: string }).message === 'string' &&
            ((error as { message?: string }).message ?? '').toLowerCase().includes('upgrade')
          )
        )
      ) {
        setShowLimitModal(true);
      }
    },
  });
  
  // Get user's quizzes if authenticated, otherwise get all quizzes
  const { data: topics, error: topicsError, isLoading: topicsLoading } = useQuery({
    queryKey: ['quiz-topics', isAuthenticated ? 'my' : 'all'],
    queryFn: async () => {
      if (isAuthenticated) {
        console.log('[QUIZ] Fetching my quizzes for authenticated user');
        return await quizApi.getMyTopics();
      } else {
        console.log('[QUIZ] Fetching all quizzes (not authenticated)');
        return await quizApi.getTopics();
      }
    },
    enabled: true, // Always fetch
    retry: 1,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has reached limit before submitting
    if (hasReachedLimit) {
      setShowLimitModal(true);
      return;
    }
    
    generateMutation.mutate();
  };

  return (
    <Layout>
      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        contentType="quiz"
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a Quiz</h1>

          <Card>
            <CardHeader
              title="Generate Quiz"
              description="Create a quiz from a URL or PDF document"
            />

            {generateMutation.isError && (
              <Alert type="error" className="mb-4">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : 'An error occurred while generating the quiz'}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSourceType('url')}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                      sourceType === 'url'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <LinkIcon className="w-5 h-5 inline mr-2" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('pdf')}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                      sourceType === 'pdf'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-5 h-5 inline mr-2" />
                    PDF
                  </button>
                </div>
              </div>

              {sourceType === 'url' ? (
                <Input
                  label="URL"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  required
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Select
                    label="Question Count"
                    value={questionMode}
                    onChange={(e) =>
                      setQuestionMode(e.target.value as 'auto' | 'custom')
                    }
                    options={[
                      { value: 'auto', label: 'Auto (recommended)' },
                      { value: 'custom', label: 'Specify manually' },
                    ]}
                  />
                  {questionMode === 'custom' && (
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
                            Math.min(20, parseInt(e.target.value, 10) || 1)
                          )
                        )
                      }
                    />
                  )}
                </div>

                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')
                  }
                  options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={generateMutation.isPending}
              >
                Generate Quiz
              </Button>
            </form>
          </Card>

          {/* Share Quiz Entry Card - Prominent */}
          <Card className="mt-8 bg-indigo-50 border-indigo-200">
            <div className="px-6 py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-indigo-900">Take a Shared Quiz</h3>
                  <p className="text-sm text-indigo-700">Enter a 6-digit code to take a quiz shared with you</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/quizzes/share')}
                className="w-full"
                size="lg"
              >
                <Key className="w-5 h-5 mr-2" />
                Enter Quiz Code
              </Button>
            </div>
          </Card>

          <Card className="mt-8">
            <CardHeader 
              title={isAuthenticated ? "My Quizzes" : "Recent Quizzes"}
              description={isAuthenticated ? "Quizzes you created and quizzes from your projects" : "Browse available quizzes"}
            />
            
            {topicsLoading && (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            )}
            
            {topicsError && (
              <Alert type="error" className="mb-4">
                {topicsError instanceof Error ? topicsError.message : 'Failed to load quizzes'}
                <div className="mt-2 text-sm">
                  {isAuthenticated ? 'Make sure you are logged in and have generated quizzes from your projects.' : 'Failed to load quiz list.'}
                </div>
              </Alert>
            )}
            
            {!topicsLoading && !topicsError && topics && topics.topics.length > 0 && (
              <div className="space-y-2">
                {topics.topics.slice(0, 10).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/quizzes/${topic.id}`)}
                    className="w-full text-left px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{topic.topic}</div>
                    <div className="text-sm text-gray-700">
                      {topic.category} • {topic.subcategory}
                      {topic.difficulty && ` • ${topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!topicsLoading && !topicsError && topics && topics.topics.length === 0 && (
              <div className="text-center py-8 text-gray-700">
                {isAuthenticated ? (
                  <>
                    <p>No quizzes available yet.</p>
                    <p className="text-sm mt-2">Generate quizzes from your project PDFs to see them here.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push('/student-hub')}
                    >
                      Go to Student Hub
                    </Button>
                  </>
                ) : (
                  <p>No quizzes available.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function QuizzesPage() {
  return (
    <ProtectedRoute>
      <QuizzesPageContent />
    </ProtectedRoute>
  );
}


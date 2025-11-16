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
import { essayApi } from '@/lib/api/essay';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function EssaysPageContent() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<'url' | 'pdf'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  
  // Check if user has reached their free token limit (only for free users)
  const isPro = user?.account_type === 'pro' || user?.subscription?.status === 'active';
  const hasReachedLimit = !isPro && user && typeof user.free_tokens === 'number' && user.free_tokens === 0;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (sourceType === 'url') {
        return essayApi.generateFromURL({
          url,
          num_questions: numQuestions,
          difficulty,
        });
      } else {
        if (!file) throw new Error('Please select a PDF file');
        return essayApi.generateFromPDF(file, numQuestions, difficulty);
      }
    },
    onSuccess: (data) => {
      router.push(`/essays/view?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (error: any) => {
      // Check if it's a payment required error (402) or token limit error
      if (error?.response?.status === 402 || error?.message?.toLowerCase().includes('payment') || error?.message?.toLowerCase().includes('upgrade')) {
        setShowLimitModal(true);
      }
    },
  });
  
  // Get user's essays if authenticated, otherwise get all essays
  const { data: topics, error: topicsError, isLoading: topicsLoading } = useQuery({
    queryKey: ['essay-topics', isAuthenticated ? 'my' : 'all', user?.id],
    queryFn: async () => {
      if (isAuthenticated) {
        console.log('[ESSAY] Fetching my essays for authenticated user:', user?.id);
        try {
          const result = await essayApi.getMyTopics();
          console.log('[ESSAY] Successfully fetched essays:', result);
          return result;
        } catch (error: any) {
          console.error('[ESSAY] Error fetching my essays:', error);
          console.error('[ESSAY] Error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
          throw error;
        }
      } else {
        console.log('[ESSAY] Fetching all essays (not authenticated)');
        return await essayApi.getTopics();
      }
    },
    enabled: true, // Always fetch
    retry: 1,
  });

  // Log errors when they occur
  if (topicsError) {
    console.error('[ESSAY] Query error:', topicsError);
  }

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
        contentType="essay"
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Essay Q&A</h1>

          <Card>
            <CardHeader
              title="Generate Essay Questions"
              description="Create essay questions with detailed answers from a URL or PDF document"
            />

            {generateMutation.isError && (
              <Alert type="error" className="mb-4">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : 'An error occurred while generating essay questions'}
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
                <Input
                  label="Number of Questions"
                  type="number"
                  min={1}
                  max={10}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 3)}
                  required
                />

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
                Generate Essay Questions
              </Button>
            </form>
          </Card>

          <Card className="mt-8">
            <CardHeader title={isAuthenticated ? "Available Essay Q&A" : "Recent Essay Q&A Sets"} />
            
            {topicsLoading && (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            )}
            
            {topicsError && (
              <Alert type="error" className="mb-4">
                <div className="font-semibold mb-2">
                  {topicsError instanceof Error ? topicsError.message : 'Failed to load essay Q&A'}
                </div>
                <div className="mt-2 text-sm space-y-1">
                  {isAuthenticated ? (
                    <>
                      <p>• Make sure you are logged in and have generated essay Q&A from your projects.</p>
                      <p>• Check your browser console for detailed error information.</p>
                      <p>• If the error persists, try refreshing the page or logging out and back in.</p>
                    </>
                  ) : (
                    <p>Failed to load essay Q&A list. Please try again later.</p>
                  )}
                </div>
              </Alert>
            )}
            
            {!topicsLoading && !topicsError && topics && topics.topics.length > 0 && (
              <div className="space-y-2">
                {topics.topics.slice(0, 10).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/essays/${topic.id}`)}
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
                    <p>No essay Q&A available yet.</p>
                    <p className="text-sm mt-2">Generate essay Q&A from your project PDFs to see them here.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push('/student-hub')}
                    >
                      Go to Student Hub
                    </Button>
                  </>
                ) : (
                  <p>No essay Q&A available.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function EssaysPage() {
  return (
    <ProtectedRoute>
      <EssaysPageContent />
    </ProtectedRoute>
  );
}


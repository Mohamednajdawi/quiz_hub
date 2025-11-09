'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import { flashcardApi } from '@/lib/api/flashcards';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function FlashcardsPageContent() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<'url' | 'pdf'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [numCards, setNumCards] = useState(10);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  
  // Check if user has reached their free token limit
  const hasReachedLimit = user && typeof user.free_tokens === 'number' && user.free_tokens === 0;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (sourceType === 'url') {
        return flashcardApi.generateFromURL({
          url,
          num_cards: numCards,
        });
      } else {
        if (!file) throw new Error('Please select a PDF file');
        return flashcardApi.generateFromPDF(file, numCards);
      }
    },
    onSuccess: (data) => {
      router.push(`/flashcards/view?data=${encodeURIComponent(JSON.stringify(data))}`);
    },
    onError: (error: any) => {
      // Check if it's a payment required error (402) or token limit error
      if (error?.response?.status === 402 || error?.message?.toLowerCase().includes('payment') || error?.message?.toLowerCase().includes('upgrade')) {
        setShowLimitModal(true);
      }
    },
  });
  
  // Get user's flashcards if authenticated, otherwise get all flashcards
  const { data: topics, error: topicsError, isLoading: topicsLoading } = useQuery({
    queryKey: ['flashcard-topics', isAuthenticated ? 'my' : 'all'],
    queryFn: async () => {
      if (isAuthenticated) {
        console.log('[FLASHCARD] Fetching my flashcards for authenticated user');
        return await flashcardApi.getMyTopics();
      } else {
        console.log('[FLASHCARD] Fetching all flashcards (not authenticated)');
        return await flashcardApi.getTopics();
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
        contentType="flashcard"
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Flashcards</h1>

          <Card>
            <CardHeader
              title="Generate Flashcards"
              description="Create flashcards from a URL or PDF document"
            />

            {generateMutation.isError && (
              <Alert type="error" className="mb-4">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : 'An error occurred while generating flashcards'}
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

              <Input
                label="Number of Cards"
                type="number"
                min={1}
                max={50}
                value={numCards}
                onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={generateMutation.isPending}
              >
                Generate Flashcards
              </Button>
            </form>
          </Card>

          <Card className="mt-8">
            <CardHeader title={isAuthenticated ? "Available Flashcards" : "Recent Flashcard Sets"} />
            
            {topicsLoading && (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            )}
            
            {topicsError && (
              <Alert type="error" className="mb-4">
                {topicsError instanceof Error ? topicsError.message : 'Failed to load flashcards'}
                <div className="mt-2 text-sm">
                  {isAuthenticated ? 'Make sure you are logged in and have generated flashcards from your projects.' : 'Failed to load flashcard list.'}
                </div>
              </Alert>
            )}
            
            {!topicsLoading && !topicsError && topics && topics.length > 0 && (
              <div className="space-y-2">
                {topics.slice(0, 10).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/flashcards/${topic.id}`)}
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
            
            {!topicsLoading && !topicsError && topics && topics.length === 0 && (
              <div className="text-center py-8 text-gray-700">
                {isAuthenticated ? (
                  <>
                    <p>No flashcards available yet.</p>
                    <p className="text-sm mt-2">Generate flashcards from your project PDFs to see them here.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push('/student-hub')}
                    >
                      Go to Student Hub
                    </Button>
                  </>
                ) : (
                  <p>No flashcards available.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function FlashcardsPage() {
  return (
    <ProtectedRoute>
      <FlashcardsPageContent />
    </ProtectedRoute>
  );
}


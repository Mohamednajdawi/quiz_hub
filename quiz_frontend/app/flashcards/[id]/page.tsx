'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { flashcardApi } from '@/lib/api/flashcards';

function FlashcardDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const flashcardId = parseInt(params.id as string);

  const { data: flashcards, isLoading, error } = useQuery({
    queryKey: ['flashcards', flashcardId],
    queryFn: () => flashcardApi.getFlashcards(flashcardId),
    enabled: !isNaN(flashcardId),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !flashcards) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Alert type="error">Flashcard set not found</Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{flashcards.topic}</h1>
            <div className="text-sm text-gray-700 mb-4">
              {flashcards.category} • {flashcards.subcategory}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {flashcards.cards.map((card, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded p-4">
                    <div className="text-sm text-indigo-600 font-medium mb-2">Front</div>
                    <div className="text-gray-900">{card.front}</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-sm text-green-600 font-medium mb-2">Back</div>
                    <div className="text-gray-900">{card.back}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/flashcards')}>
              Back to Flashcards
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                router.push(
                  `/flashcards/view?data=${encodeURIComponent(JSON.stringify(flashcards))}`
                )
              }
            >
              Study Flashcards
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function FlashcardDetailPage() {
  return (
    <ProtectedRoute>
      <FlashcardDetailPageContent />
    </ProtectedRoute>
  );
}


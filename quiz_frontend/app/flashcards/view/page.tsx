'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FlashcardData, FlashcardCard } from '@/lib/types';
import { RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

function ViewFlashcardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setFlashcardData(parsed);
      } catch (error) {
        console.error('Error parsing flashcard data:', error);
      }
    }
  }, [searchParams]);

  if (!flashcardData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-700">Loading flashcards...</div>
        </div>
      </Layout>
    );
  }

  const currentCard: FlashcardCard = flashcardData.cards[currentIndex];
  const progress = ((currentIndex + 1) / flashcardData.cards.length) * 100;

  const handleNext = () => {
    if (currentIndex < flashcardData.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{flashcardData.topic}</h1>
            <div className="text-sm text-gray-700 mb-4">
              {flashcardData.category} • {flashcardData.subcategory}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">
                Card {currentIndex + 1} of {flashcardData.cards.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="min-h-[400px] flex items-center justify-center mb-6">
            <div
              className="w-full cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {!isFlipped ? (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-8 min-h-[300px] flex items-center justify-center transition-all hover:shadow-lg">
                  <div className="text-center">
                    <div className="text-sm text-indigo-600 font-medium mb-2">Front</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {currentCard.front}
                    </div>
                    <div className="text-xs text-gray-700 mt-4">Click to flip</div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 min-h-[300px] flex items-center justify-center transition-all hover:shadow-lg">
                  <div className="text-center">
                    <div className="text-sm text-green-600 font-medium mb-2">Back</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {currentCard.back}
                    </div>
                    <div className="text-xs text-gray-700 mt-4">Click to flip</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Flip Card
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === flashcardData.cards.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="primary" onClick={() => router.push('/flashcards')}>
              Create New Set
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function ViewFlashcardsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      }>
        <ViewFlashcardsContent />
      </Suspense>
    </ProtectedRoute>
  );
}


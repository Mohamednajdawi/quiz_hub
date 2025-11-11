'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { FlashcardData, FlashcardCard } from '@/lib/types';
import { RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

// Safe URI decoding function that handles malformed URIs
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    // If decodeURIComponent fails, try a more lenient approach
    try {
      // Replace + with spaces (URL encoding for spaces)
      const withSpaces = str.replace(/\+/g, ' ');
      return decodeURIComponent(withSpaces);
    } catch {
      // If that also fails, try to fix common encoding issues
      try {
        // Try to fix malformed percent encodings
        const fixed = str.replace(/%([0-9A-F]{2})/gi, (match, hex) => {
          try {
            return String.fromCharCode(parseInt(hex, 16));
          } catch {
            return match;
          }
        });
        return fixed;
      } catch {
        // Last resort: return as-is (might already be decoded)
        console.warn('Could not decode URI component, using as-is');
        return str;
      }
    }
  }
}

function ViewFlashcardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decoded = safeDecodeURIComponent(dataParam);
        const parsed = JSON.parse(decoded);
        
        // Validate the parsed data structure
        if (!parsed || !parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
          throw new Error('Invalid flashcard data structure');
        }
        
        setFlashcardData(parsed);
        setError(null);
      } catch (error) {
        console.error('Error parsing flashcard data:', error);
        setError('Failed to load flashcard data. The data may be corrupted or too large for URL parameters.');
      }
    } else {
      setError('No flashcard data provided.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Card>
            <div className="p-6">
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push('/flashcards')}>
                  Back to Flashcards
                </Button>
                <Button variant="primary" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!flashcardData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <div className="ml-4 text-gray-700">Loading flashcards...</div>
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

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-full max-w-4xl h-[340px] sm:h-[380px] [perspective:1200px]">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsFlipped(!isFlipped)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsFlipped(!isFlipped);
                  }
                }}
                className="relative w-full h-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] focus:outline-none focus:ring-4 focus:ring-indigo-200 rounded-xl"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                <div className="absolute inset-0 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm [backface-visibility:hidden]">
                  <div className="text-sm text-indigo-600 font-medium mb-2 uppercase tracking-wide">
                    Front
                  </div>
                  <div className="text-xl font-semibold text-gray-900 leading-relaxed max-h-[220px] overflow-y-auto">
                    {currentCard.front}
                  </div>
                  <div className="text-xs text-gray-600 mt-6">Click or press space to flip</div>
                </div>

                <div className="absolute inset-0 bg-green-50 border-2 border-green-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="text-sm text-green-600 font-medium mb-2 uppercase tracking-wide">
                    Back
                  </div>
                  <div className="text-xl font-semibold text-gray-900 leading-relaxed max-h-[220px] overflow-y-auto">
                    {currentCard.back}
                  </div>
                  <div className="text-xs text-gray-600 mt-6">Click or press space to flip back</div>
                </div>
              </div>
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


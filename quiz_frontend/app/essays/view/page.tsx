'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EssayQAData, EssayQAQuestion } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function ViewEssaysContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [essayData, setEssayData] = useState<EssayQAData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setEssayData(parsed);
      } catch (error) {
        console.error('Error parsing essay data:', error);
      }
    }
  }, [searchParams]);

  if (!essayData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-700">Loading essay questions...</div>
        </div>
      </Layout>
    );
  }

  const currentQuestion: EssayQAQuestion = essayData.questions[currentIndex];
  const progress = ((currentIndex + 1) / essayData.questions.length) * 100;

  const handleNext = () => {
    if (currentIndex < essayData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{essayData.topic}</h1>
            <div className="text-sm text-gray-700 mb-4">
              {essayData.category} • {essayData.subcategory}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">
                Question {currentIndex + 1} of {essayData.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="text-sm text-blue-600 font-medium mb-2">Question</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentQuestion.question}
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="text-sm text-green-600 font-medium mb-2">Full Answer</div>
              <div className="text-gray-900 whitespace-pre-wrap">
                {currentQuestion.full_answer}
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="text-sm text-yellow-600 font-medium mb-2">Key Information</div>
              <ul className="list-disc list-inside space-y-1 text-gray-900">
                {currentQuestion.key_info.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
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
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === essayData.questions.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="primary" onClick={() => router.push('/essays')}>
              Create New Set
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function ViewEssaysPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      }>
        <ViewEssaysContent />
      </Suspense>
    </ProtectedRoute>
  );
}


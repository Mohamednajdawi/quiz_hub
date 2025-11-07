'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { essayApi } from '@/lib/api/essay';

function EssayDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const essayId = parseInt(params.id as string);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const { data: essay, isLoading, error } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: () => essayApi.getEssayQA(essayId),
    enabled: !isNaN(essayId),
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

  if (error || !essay) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Alert type="error">Essay Q&A set not found</Alert>
        </div>
      </Layout>
    );
  }

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const toggleRevealAnswer = (questionIndex: number) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{essay.topic}</h1>
            <div className="text-sm text-gray-700 mb-4">
              {essay.category} • {essay.subcategory}
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {essay.questions.map((question, index) => {
              const isAnswerRevealed = revealedAnswers[index] || false;
              const currentUserAnswer = userAnswers[index] || '';
              
              return (
                <div key={index} className="border-b border-gray-200 pb-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <div className="text-sm text-blue-600 font-medium mb-2">
                      Question {index + 1}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {question.question}
                    </div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                    <div className="text-sm text-purple-600 font-medium mb-3">Your Answer</div>
                    <textarea
                      value={currentUserAnswer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[150px]"
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-center mb-4">
                    <Button
                      variant={isAnswerRevealed ? "secondary" : "primary"}
                      onClick={() => toggleRevealAnswer(index)}
                    >
                      {isAnswerRevealed ? "Hide Answer" : "Reveal Answer"}
                    </Button>
                  </div>

                  {isAnswerRevealed && (
                    <>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                        <div className="text-sm text-green-600 font-medium mb-2">Full Answer</div>
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {question.full_answer}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-600 font-medium mb-2">Key Information</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-900">
                          {question.key_info.map((info, infoIndex) => (
                            <li key={infoIndex}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/essays')}>
              Back to Essays
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                router.push(`/essays/view?data=${encodeURIComponent(JSON.stringify(essay))}`)
              }
            >
              View Questions
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function EssayDetailPage() {
  return (
    <ProtectedRoute>
      <EssayDetailPageContent />
    </ProtectedRoute>
  );
}


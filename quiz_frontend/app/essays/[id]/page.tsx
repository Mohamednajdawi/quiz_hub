'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { essayApi } from '@/lib/api/essay';
import { useAuth } from '@/contexts/AuthContext';
import { formatFeedbackToHtml } from '@/lib/utils/formatFeedback';

interface EssayFeedback {
  feedback: string;
  score: number;
}

function EssayDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const essayId = parseInt(params.id as string);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [combinedFeedback, setCombinedFeedback] = useState<EssayFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: essay, isLoading, error } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: () => essayApi.getEssayQA(essayId),
    enabled: !isNaN(essayId),
  });

  const submitAllAnswersMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      if (!essay) {
        throw new Error('Essay not loaded');
      }
      
      // Prepare all answers
      const answers = essay.questions.map((_: any, index: number) => ({
        question_index: index,
        user_answer: userAnswers[index] || '',
      }));
      
      const timestamp = new Date().toISOString();
      return essayApi.storeAllAnswers(essayId, user.id, answers, timestamp);
    },
    onSuccess: (data: { message: string; total_answers: number; ai_feedback?: string; score?: number }) => {
      if (data.ai_feedback && data.score !== undefined) {
        setCombinedFeedback({
          feedback: data.ai_feedback,
          score: data.score,
        });
      }
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmitAllAnswers = () => {
    if (!essay) return;
    
    // Check if all questions have answers
    const allAnswered = essay.questions.every((_: any, index: number) => {
      const answer = userAnswers[index] || '';
      return answer.trim().length > 0;
    });
    
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    submitAllAnswersMutation.mutate();
  };

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
              const currentUserAnswer = userAnswers[index] || '';
              const showAnswers = !!combinedFeedback;
              
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
                      disabled={!!combinedFeedback}
                    />
                  </div>

                  {showAnswers && (
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

          {/* Combined Feedback Section */}
          {combinedFeedback && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-indigo-900">Overall Feedback & Score</div>
                <span
                  className={`text-2xl font-bold ${
                    combinedFeedback.score >= 70
                      ? 'text-green-600'
                      : combinedFeedback.score >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {combinedFeedback.score.toFixed(1)}%
                </span>
              </div>
              <div
                className="text-sm text-indigo-900 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatFeedbackToHtml(combinedFeedback.feedback),
                }}
              />
            </div>
          )}

          {/* Submit All Button */}
          {!combinedFeedback && (
            <div className="flex justify-center mb-6">
              <Button
                variant="primary"
                onClick={handleSubmitAllAnswers}
                disabled={isSubmitting || !essay.questions.every((_: any, index: number) => (userAnswers[index] || '').trim())}
                className="px-8 py-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting All Answers...
                  </>
                ) : (
                  'Submit All Answers for Feedback'
                )}
              </Button>
            </div>
          )}

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


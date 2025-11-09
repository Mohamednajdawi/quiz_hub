'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { quizApi } from '@/lib/api/quiz';
import { Share2, Copy, Check, BarChart3 } from 'lucide-react';

function QuizDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(quizId),
    enabled: !isNaN(quizId),
  });

  // Try to get existing share code if quiz has one
  const { data: existingCodeData } = useQuery({
    queryKey: ['quiz-share-code', quizId],
    queryFn: async () => {
      try {
        return await quizApi.getShareCode(quizId);
      } catch (e) {
        // Silently fail - user might not have permission or code doesn't exist
        return null;
      }
    },
    enabled: !isNaN(quizId) && !!quiz,
    retry: false,
  });

  useEffect(() => {
    if (existingCodeData?.share_code) {
      setShareCode(existingCodeData.share_code);
    }
  }, [existingCodeData]);

  const generateCodeMutation = useMutation({
    mutationFn: () => quizApi.generateShareCode(quizId),
    onSuccess: (data) => {
      setShareCode(data.share_code);
    },
    onError: (error: any) => {
      console.error('Error generating share code:', error);
      alert(error?.response?.data?.detail || error?.message || 'Failed to generate share code');
    },
  });

  const copyToClipboard = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  if (error || !quiz) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Alert type="error">Quiz not found</Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.topic}</h1>
            <div className="text-sm text-gray-700">
              {quiz.category} • {quiz.subcategory}
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {quiz.questions.map((question, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Question {index + 1}: {question.question}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg ${
                        optIndex === question.right_option
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${
                            optIndex === question.right_option
                              ? 'text-green-700'
                              : 'text-gray-700'
                          }`}
                        >
                          {optIndex === question.right_option && '✓ '}
                          {option}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Share Code Section */}
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share This Quiz
                </h3>
                {shareCode ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-indigo-900 font-mono">{shareCode}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-indigo-700">
                      Share this code with others to let them take your quiz
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-indigo-700 mb-3">
                      Generate a 6-digit code to share this quiz with others
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => generateCodeMutation.mutate()}
                      isLoading={generateCodeMutation.isPending}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Generate Share Code
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {shareCode && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/quizzes/${quizId}/results`)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Results
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/quizzes')}>
              Back to Quizzes
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                router.push(`/quizzes/take?data=${encodeURIComponent(JSON.stringify(quiz))}`)
              }
            >
              Take This Quiz
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function QuizDetailPage() {
  return (
    <ProtectedRoute>
      <QuizDetailPageContent />
    </ProtectedRoute>
  );
}


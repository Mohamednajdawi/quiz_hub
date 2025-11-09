'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { quizApi } from '@/lib/api/quiz';
import { BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

function QuizResultsContent() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['shared-quiz-results', quizId],
    queryFn: () => quizApi.getSharedQuizResults(quizId),
    enabled: !isNaN(quizId),
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

  if (error || !results) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Alert type="error">
            {error instanceof Error ? error.message : 'Failed to load results'}
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push(`/quizzes/${quizId}`)}>
              Back to Quiz
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const averageScore = results.attempts.length > 0
    ? results.attempts.reduce((sum, attempt) => sum + attempt.percentage_score, 0) / results.attempts.length
    : 0;

  const bestScore = results.attempts.length > 0
    ? Math.max(...results.attempts.map(a => a.percentage_score))
    : 0;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
                <p className="text-gray-700">{results.quiz_topic}</p>
              </div>
              <Button variant="outline" onClick={() => router.push(`/quizzes/${quizId}`)}>
                Back to Quiz
              </Button>
            </div>

            {results.share_code && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
                <p className="text-sm text-indigo-700">
                  <span className="font-semibold">Share Code:</span>{' '}
                  <span className="font-mono text-lg">{results.share_code}</span>
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Attempts</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{results.total_attempts}</div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Average Score</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {averageScore.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Best Score</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {bestScore.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Attempts List */}
            {results.attempts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                <p className="text-gray-600">
                  Share the quiz code with others to see their results here
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">All Attempts</h2>
                <div className="space-y-3">
                  {results.attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {attempt.participant_name}
                            </span>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              attempt.percentage_score >= 70
                                ? 'bg-green-100 text-green-800'
                                : attempt.percentage_score >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.percentage_score.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              {attempt.score} / {attempt.total_questions} correct
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.floor(attempt.time_taken_seconds / 60)}m {attempt.time_taken_seconds % 60}s
                            </span>
                            <span>
                              {format(new Date(attempt.timestamp), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function QuizResultsPage() {
  return (
    <ProtectedRoute>
      <QuizResultsContent />
    </ProtectedRoute>
  );
}


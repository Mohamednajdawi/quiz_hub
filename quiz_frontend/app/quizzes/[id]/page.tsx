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

function QuizDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(quizId),
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


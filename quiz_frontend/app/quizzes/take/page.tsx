'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { attemptApi } from '@/lib/api/attempts';
import { QuizData, QuizQuestion } from '@/lib/types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatFeedbackToHtml } from '@/lib/utils/formatFeedback';

function TakeQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    percentage: number;
    timeTaken: number;
    correctAnswers: number[];
    feedback?: string;
  } | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setQuizData(parsed);
        setSelectedAnswers(new Array(parsed.questions.length).fill(-1));
      } catch (error) {
        console.error('Error parsing quiz data:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showResults) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showResults, startTime]);

  const recordAttemptMutation = useMutation({
    mutationFn: attemptApi.recordAttempt,
    onSuccess: (data) => {
      if (data.ai_feedback) {
        setResults((prev) => (prev ? { ...prev, feedback: data.ai_feedback } : prev));
      }
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (!quizData) return;

    // Convert right_option to number (handles both string and number)
    const correctAnswers = quizData.questions.map((q) => {
      const rightOption = q.right_option;
      if (typeof rightOption === 'string') {
        const trimmed = rightOption.trim().toLowerCase();
        // If it's a single letter (a, b, c, d), convert to index
        if (trimmed.length === 1 && trimmed >= 'a' && trimmed <= 'z') {
          return trimmed.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
        } else {
          // Try parsing as number
          return parseInt(trimmed, 10);
        }
      }
      return rightOption;
    });
    let score = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) {
        score++;
      }
    });

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const percentage = (score / quizData.questions.length) * 100;

    const resultsData = {
      score,
      total: quizData.questions.length,
      percentage,
      timeTaken,
      correctAnswers,
      feedback: undefined,
    };

    setResults(resultsData);
    setShowResults(true);

    // Record attempt
    const topicId = quizData.quiz_id ?? 999;
    recordAttemptMutation.mutate({
      topic_id: topicId,
      user_id: user?.id, // Use authenticated user ID if available
      score,
      total_questions: quizData.questions.length,
      time_taken_seconds: timeTaken,
      user_answers: selectedAnswers,
      correct_answers: correctAnswers,
      difficulty_level: 'medium',
      source_type: topicId === 999 ? 'url' : 'stored',
      source_info: quizData.topic,
    });
  };

  if (!quizData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const question: QuizQuestion = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  if (showResults && results) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h1>
              <div className="mb-6">
                <div className="text-6xl font-bold text-indigo-600 mb-2">
                  {results.percentage.toFixed(0)}%
                </div>
                <div className="text-lg text-gray-800">
                  {results.score} out of {results.total} correct
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-700 mb-8">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s
                </div>
              </div>

              {recordAttemptMutation.isPending && !results.feedback && (
                <div className="mb-8 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <LoadingSpinner size="sm" />
                  <span>Generating personalized feedback...</span>
                </div>
              )}

              {results.feedback && (
                <div className="mb-8">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 text-left shadow-sm">
                    <h2 className="text-lg font-semibold text-indigo-900 mb-2">Personalized Feedback</h2>
                    <div
                      className="text-sm text-indigo-900 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatFeedbackToHtml(results.feedback) }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8 text-left">
                {quizData.questions.map((q, index) => {
                  // Convert right_option to integer (handles both string and number)
                  // Also handles letter options (a, b, c, d) by converting to index
                  let correctOptionIndex: number;
                  const rightOption = q.right_option;
                  if (typeof rightOption === 'string') {
                    const trimmed = rightOption.trim().toLowerCase();
                    // If it's a single letter (a, b, c, d), convert to index
                    if (trimmed.length === 1 && trimmed >= 'a' && trimmed <= 'z') {
                      correctOptionIndex = trimmed.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
                    } else {
                      // Try parsing as number
                      correctOptionIndex = parseInt(trimmed, 10);
                    }
                  } else {
                    correctOptionIndex = rightOption;
                  }
                  
                  // Handle invalid or NaN values
                  const isValidIndex = !isNaN(correctOptionIndex) && 
                    correctOptionIndex >= 0 && 
                    correctOptionIndex < q.options.length;
                  
                  const isCorrect = selectedAnswers[index] === correctOptionIndex;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-shadow ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          Question {index + 1}: {q.question}
                        </div>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-800 space-y-1">
                        <div>
                          <span className="font-medium">Your answer:</span>{' '}
                          <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700'}>
                            {selectedAnswers[index] >= 0 && selectedAnswers[index] < q.options.length
                              ? q.options[selectedAnswers[index]]
                              : 'Not answered'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Correct answer:</span>{' '}
                          <span className="text-green-700 font-medium">
                            {isValidIndex
                              ? q.options[correctOptionIndex]
                              : `Option ${q.right_option} (invalid index)`}
                          </span>
                        </div>
                        {!isCorrect && isValidIndex && selectedAnswers[index] >= 0 && (
                          <div className="mt-2 text-xs text-gray-700 italic">
                            The correct answer was option {String.fromCharCode(97 + correctOptionIndex)} ({correctOptionIndex + 1})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => router.push('/quizzes')}>
                  Create New Quiz
                </Button>
                <Button variant="primary" onClick={() => router.push('/dashboard')}>
                  View Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{quizData.topic}</h1>
              <div className="text-sm text-gray-700">
                Question {currentQuestion + 1} of {quizData.questions.length}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.question}
            </h2>
            <div className="space-y-2">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion === quizData.questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={selectedAnswers[currentQuestion] === -1}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestion] === -1}
              >
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function TakeQuizPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      }>
        <TakeQuizContent />
      </Suspense>
    </ProtectedRoute>
  );
}


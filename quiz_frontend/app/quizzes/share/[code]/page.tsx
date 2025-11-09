'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { quizApi } from '@/lib/api/quiz';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function SharedQuizContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const shareCode = params.code as string;
  
  // Automatically set participant name from user data
  const [participantName, setParticipantName] = useState(() => {
    if (user?.first_name || user?.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    }
    return 'Guest';
  });
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Update participant name when user data becomes available
  useEffect(() => {
    const name = user?.first_name || user?.last_name
      ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
      : 'Guest';
    setParticipantName(name);
  }, [user]);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['shared-quiz', shareCode],
    queryFn: () => quizApi.getQuizByShareCode(shareCode),
    enabled: !!shareCode && shareCode.length === 6,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      return quizApi.submitSharedQuiz(shareCode, participantName, answers, timeTaken);
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
    },
  });

  useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(-1));
    }
  }, [quiz]);

  useEffect(() => {
    if (!submitted && quiz) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, submitted, quiz]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (answers.some(a => a === -1)) {
      if (!confirm('You have unanswered questions. Submit anyway?')) {
        return;
      }
    }
    submitMutation.mutate();
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
          <Alert type="error">
            {error instanceof Error ? error.message : 'Quiz not found. Please check the code and try again.'}
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push('/quizzes/share')}>
              Enter Different Code
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted && result) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                result.percentage_score >= 70 ? 'bg-green-100' : result.percentage_score >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {result.percentage_score >= 70 ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-lg text-gray-700 mb-6">
                {result.score} out of {result.total_questions} correct
              </p>
              <div className="text-4xl font-bold text-indigo-600 mb-4">
                {result.percentage_score.toFixed(1)}%
              </div>
              <p className="text-gray-600 mb-6">
                Time taken: {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
              </p>
              <Button variant="primary" onClick={() => router.push('/quizzes/share')}>
                Take Another Quiz
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = answers.filter(a => a !== -1).length;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{quiz.topic}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                </div>
                <span>{answeredCount} / {quiz.questions.length} answered</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.question}
            </h2>
            <div className="space-y-3">
              {question.options.map((option: string, index: number) => {
                const isSelected = answers[currentQuestion] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={submitMutation.isPending}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function SharedQuizPage() {
  return <SharedQuizContent />;
}


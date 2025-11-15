'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { WelcomeOnboarding, shouldShowOnboarding } from '@/components/WelcomeOnboarding';
import { attemptApi } from '@/lib/api/attempts';
import { essayApi } from '@/lib/api/essay';
import { formatFeedbackToHtml } from '@/lib/utils/formatFeedback';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, Clock, Award } from 'lucide-react';

function DashboardPageContent() {
  // Get user ID from auth context
  const { user } = useAuth();
  const userId = user?.id || null;
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown on mount
  useEffect(() => {
    if (user && shouldShowOnboarding()) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['user-analytics', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return attemptApi.getUserAnalytics(userId);
    },
    enabled: !!userId,
  });

  const { data: history } = useQuery({
    queryKey: ['user-history', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return attemptApi.getUserHistory(userId);
    },
    enabled: !!userId,
  });

  const { data: essayAnswers } = useQuery({
    queryKey: ['essay-answers', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return essayApi.getUserAnswers(userId);
    },
    enabled: !!userId,
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

  if (error) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <Alert type="error">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <WelcomeOnboarding 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {analytics && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700">Total Quizzes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.total_quizzes}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700">Average Score</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.average_score.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700">Best Score</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.best_score.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700">Time Spent</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.floor(analytics.total_time_spent / 60)}m
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Chart */}
            {analytics.scores.length > 0 && (
              <Card className="mb-8">
                <CardHeader title="Performance Trend" />
                <div className="h-64 flex items-end justify-between gap-2">
                  {analytics.scores.map((score, index) => {
                    const maxScore = Math.max(...analytics.scores);
                    const height = (score / maxScore) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-indigo-600 rounded-t transition-all hover:bg-indigo-700"
                        style={{ height: `${height}%` }}
                        title={`Score: ${score.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Category Performance */}
            {Object.keys(analytics.category_attempts).length > 0 && (
              <Card className="mb-8">
                <CardHeader title="Category Performance" />
                <div className="space-y-4">
                  {Object.entries(analytics.category_attempts).map(([category, attempts]) => {
                    const accuracy =
                      analytics.category_accuracy[category] * 100 || 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{category}</span>
                          <span className="text-sm text-gray-700">
                            {attempts} attempts • {accuracy.toFixed(1)}% accuracy
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {analytics.strengths.length > 0 && (
                <Card>
                  <CardHeader title="Strengths" />
                  <div className="space-y-2">
                    {analytics.strengths.map((strength) => (
                      <div
                        key={strength}
                        className="flex items-center p-2 bg-green-50 rounded-md"
                      >
                        <span className="text-green-700 font-medium">{strength}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {analytics.weaknesses.length > 0 && (
                <Card>
                  <CardHeader title="Areas for Improvement" />
                  <div className="space-y-2">
                    {analytics.weaknesses.map((weakness) => (
                      <div
                        key={weakness}
                        className="flex items-center p-2 bg-red-50 rounded-md"
                      >
                        <span className="text-red-700 font-medium">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Recent Quiz History */}
        {history && history.attempts.length > 0 && (
          <Card>
            <CardHeader title="Recent Quiz History" />
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      AI Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.attempts.slice(0, 10).map((attempt) => (
                    <HistoryRow key={attempt.id} attempt={attempt} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Recent Essay Answers */}
        {essayAnswers && essayAnswers.answers.length > 0 && (
          <Card>
            <CardHeader title="Recent Essay Answers" />
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Topic / Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      AI Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {essayAnswers.answers.slice(0, 10).map((answer) => (
                    <EssayAnswerRow key={answer.id} answer={answer} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {(!analytics || analytics.total_quizzes === 0) && (!essayAnswers || essayAnswers.total_answers === 0) && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-700 mb-4">No activity yet.</p>
              <p className="text-sm text-gray-700">
                Start taking quizzes or answering essay questions to see your performance analytics here.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}

type HistoryAttempt = {
  id: number;
  topic_name?: string;
  category?: string;
  subcategory?: string;
  timestamp: string;
  score: number;
  total_questions: number;
  percentage_score: number;
  time_taken_seconds: number;
  ai_feedback?: string;
};

function HistoryRow({ attempt }: { attempt: HistoryAttempt }) {
  const [expanded, setExpanded] = useState(false);

  const formattedFeedback = attempt.ai_feedback
    ? formatFeedbackToHtml(attempt.ai_feedback)
    : '';

  const plainText = formattedFeedback
    ? formattedFeedback.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    : '';

  const normalizedText = plainText.replace(/\s+/g, ' ').trim();
  const preview =
    normalizedText.length > 160 ? `${normalizedText.slice(0, 160).trim()}…` : normalizedText;

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{attempt.topic_name ?? 'Quiz'}</div>
        <div className="text-sm text-gray-700">
          {(attempt.category ?? 'Unknown Category')} • {(attempt.subcategory ?? 'Quiz')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`text-sm font-medium ${
            attempt.percentage_score >= 70
              ? 'text-green-600'
              : attempt.percentage_score >= 50
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {attempt.percentage_score.toFixed(1)}%
        </span>
        <div className="text-xs text-gray-700">
          {attempt.score}/{attempt.total_questions}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {Math.floor(attempt.time_taken_seconds / 60)}m {attempt.time_taken_seconds % 60}s
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {format(new Date(attempt.timestamp), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 text-xs text-gray-700 whitespace-normal max-w-xs">
        {formattedFeedback ? (
          <div className="leading-relaxed">
            {expanded ? (
              <div dangerouslySetInnerHTML={{ __html: formattedFeedback }} />
            ) : (
              <span>{preview}</span>
            )}
            {normalizedText.length > 160 && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {expanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        ) : (
          <span className="italic text-gray-400">Feedback not available</span>
        )}
      </td>
    </tr>
  );
}

type EssayAnswerData = {
  id: number;
  essay_topic_id: number;
  topic: string;
  category: string;
  subcategory: string;
  question_index: number;
  question: string;
  user_answer: string;
  timestamp: string;
  ai_feedback?: string;
  score?: number;
};

function EssayAnswerRow({ answer }: { answer: EssayAnswerData }) {
  const [expanded, setExpanded] = useState(false);

  const formattedFeedback = answer.ai_feedback
    ? formatFeedbackToHtml(answer.ai_feedback)
    : '';

  const plainText = formattedFeedback
    ? formattedFeedback.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    : '';

  const normalizedText = plainText.replace(/\s+/g, ' ').trim();
  const preview =
    normalizedText.length > 160 ? `${normalizedText.slice(0, 160).trim()}…` : normalizedText;

  return (
    <tr>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{answer.topic}</div>
        <div className="text-sm text-gray-700">
          {answer.category} • {answer.subcategory}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Q{answer.question_index + 1}: {answer.question.length > 60 
            ? `${answer.question.slice(0, 60)}...` 
            : answer.question}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {answer.score !== undefined ? (
          <span
            className={`text-sm font-medium ${
              answer.score >= 70
                ? 'text-green-600'
                : answer.score >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {answer.score.toFixed(1)}%
          </span>
        ) : (
          <span className="text-sm text-gray-400 italic">Pending</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {format(new Date(answer.timestamp), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 text-xs text-gray-700 whitespace-normal max-w-xs">
        {formattedFeedback ? (
          <div className="leading-relaxed">
            {expanded ? (
              <div dangerouslySetInnerHTML={{ __html: formattedFeedback }} />
            ) : (
              <span>{preview}</span>
            )}
            {normalizedText.length > 160 && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {expanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        ) : (
          <span className="italic text-gray-400">Feedback not available</span>
        )}
      </td>
    </tr>
  );
}


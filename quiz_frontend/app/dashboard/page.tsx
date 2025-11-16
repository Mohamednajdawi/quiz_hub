'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { WelcomeOnboarding, shouldShowOnboarding } from '@/components/WelcomeOnboarding';
import { attemptApi } from '@/lib/api/attempts';
import { essayApi } from '@/lib/api/essay';
import { formatFeedbackToHtml } from '@/lib/utils/formatFeedback';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen, 
  FileText, 
  Plus,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

function DashboardPageContent() {
  // Get user ID from auth context
  const { user } = useAuth();
  const userId = user?.id || null;
  const router = useRouter();
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

  // Calculate combined statistics
  const combinedStats = useMemo(() => {
    const totalQuizzes = analytics?.total_quizzes || 0;
    const totalEssays = essayAnswers?.total_answers || 0;
    const totalActivities = totalQuizzes + totalEssays;
    
    // Calculate average essay score
    const essayScores = essayAnswers?.answers
      .filter(a => a.score !== undefined)
      .map(a => a.score!) || [];
    const avgEssayScore = essayScores.length > 0
      ? essayScores.reduce((sum, score) => sum + score, 0) / essayScores.length
      : 0;
    
    // Combined average (weighted by attempts)
    const quizAvg = analytics?.average_score || 0;
    const combinedAvg = totalActivities > 0
      ? ((quizAvg * totalQuizzes) + (avgEssayScore * totalEssays)) / totalActivities
      : 0;
    
    // Best scores
    const bestQuizScore = analytics?.best_score || 0;
    const bestEssayScore = essayScores.length > 0 ? Math.max(...essayScores) : 0;
    const bestOverallScore = Math.max(bestQuizScore, bestEssayScore);
    
    return {
      totalActivities,
      totalQuizzes,
      totalEssays,
      combinedAvg,
      avgEssayScore,
      bestOverallScore,
      essayScores,
    };
  }, [analytics, essayAnswers]);

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
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Track your learning progress and performance</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Button
              variant="primary"
              onClick={() => router.push('/quizzes')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/essays')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Essays
            </Button>
          </div>
        </div>

        {/* Combined Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 mb-1">Total Activities</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {combinedStats.totalActivities}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  {combinedStats.totalQuizzes} quizzes • {combinedStats.totalEssays} essays
                </p>
              </div>
              <div className="flex-shrink-0 bg-indigo-200 rounded-lg p-3">
                <Activity className="h-8 w-8 text-indigo-700" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-green-900">
                  {combinedStats.combinedAvg > 0 ? combinedStats.combinedAvg.toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics && analytics.average_score > 0 && (
                    <>Quizzes: {analytics.average_score.toFixed(1)}%</>
                  )}
                  {combinedStats.avgEssayScore > 0 && (
                    <> • Essays: {combinedStats.avgEssayScore.toFixed(1)}%</>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 bg-green-200 rounded-lg p-3">
                <TrendingUp className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Best Score</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {combinedStats.bestOverallScore > 0 ? combinedStats.bestOverallScore.toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-yellow-600 mt-1">Personal best</p>
              </div>
              <div className="flex-shrink-0 bg-yellow-200 rounded-lg p-3">
                <Award className="h-8 w-8 text-yellow-700" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Time Spent</p>
                <p className="text-3xl font-bold text-blue-900">
                  {analytics ? Math.floor(analytics.total_time_spent / 60) : 0}m
                </p>
                <p className="text-xs text-blue-600 mt-1">Total study time</p>
              </div>
              <div className="flex-shrink-0 bg-blue-200 rounded-lg p-3">
                <Clock className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card onClick={() => router.push('/quizzes')}>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Take a Quiz</p>
                <p className="text-sm text-gray-600">Test your knowledge</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Card>

          <Card onClick={() => router.push('/essays')}>
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Answer Essays</p>
                <p className="text-sm text-gray-600">Practice writing</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Card>

          <Card onClick={() => router.push('/projects')}>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-lg p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">My Projects</p>
                <p className="text-sm text-gray-600">Organize content</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </div>

        {analytics && (
          <>

            {/* Performance Chart */}
            {analytics.scores.length > 0 && (
              <Card className="mb-8">
                <CardHeader title="Quiz Performance Trend" />
                <div className="p-6">
                  <div className="h-64 flex items-end justify-between gap-1">
                    {analytics.scores.slice(-10).map((score, index) => {
                      const maxScore = Math.max(...analytics.scores.slice(-10), 100);
                      const height = Math.max((score / maxScore) * 100, 5);
                      const isRecent = index >= analytics.scores.slice(-10).length - 3;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div
                            className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                              isRecent ? 'bg-indigo-600' : 'bg-indigo-400'
                            }`}
                            style={{ height: `${height}%` }}
                            title={`Score: ${score.toFixed(1)}%`}
                          />
                          <span className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {score.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-600">
                    <span>Last {Math.min(analytics.scores.length, 10)} attempts</span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-400 rounded"></div>
                      Older
                      <div className="w-3 h-3 bg-indigo-600 rounded ml-2"></div>
                      Recent
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Essay Performance Chart */}
            {combinedStats.essayScores.length > 0 && (
              <Card className="mb-8">
                <CardHeader title="Essay Performance Trend" />
                <div className="p-6">
                  <div className="h-64 flex items-end justify-between gap-1">
                    {combinedStats.essayScores.slice(-10).map((score, index) => {
                      const maxScore = Math.max(...combinedStats.essayScores.slice(-10), 100);
                      const height = Math.max((score / maxScore) * 100, 5);
                      const isRecent = index >= combinedStats.essayScores.slice(-10).length - 3;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div
                            className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                              isRecent ? 'bg-purple-600' : 'bg-purple-400'
                            }`}
                            style={{ height: `${height}%` }}
                            title={`Score: ${score.toFixed(1)}%`}
                          />
                          <span className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {score.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-600">
                    <span>Last {Math.min(combinedStats.essayScores.length, 10)} essays</span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded"></div>
                      Older
                      <div className="w-3 h-3 bg-purple-600 rounded ml-2"></div>
                      Recent
                    </span>
                  </div>
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

        {/* Recent Activity Timeline */}
        {((history?.attempts && history.attempts.length > 0) || (essayAnswers?.answers && essayAnswers.answers.length > 0)) && (
          <Card className="mb-8">
            <CardHeader title="Recent Activity" />
            <div className="divide-y divide-gray-200">
              {/* Combine and sort activities */}
              {[
                ...(history?.attempts.slice(0, 5).map(attempt => ({
                  type: 'quiz' as const,
                  id: attempt.id,
                  timestamp: attempt.timestamp,
                  title: attempt.topic_name || 'Quiz',
                  subtitle: `${attempt.category || 'Unknown'} • ${attempt.subcategory || 'Quiz'}`,
                  score: attempt.percentage_score,
                  data: attempt,
                })) || []),
                ...(essayAnswers?.answers.slice(0, 5).map(answer => ({
                  type: 'essay' as const,
                  id: answer.id,
                  timestamp: answer.timestamp,
                  title: answer.topic,
                  subtitle: `Q${answer.question_index + 1}: ${answer.question.slice(0, 50)}...`,
                  score: answer.score,
                  data: answer,
                })) || []),
              ]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        activity.type === 'quiz' ? 'bg-indigo-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'quiz' ? (
                          <BarChart3 className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{activity.subtitle}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          {activity.score !== undefined && (
                            <span className={`text-sm font-semibold whitespace-nowrap ${
                              activity.score >= 70
                                ? 'text-green-600'
                                : activity.score >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {activity.score.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Recent Quiz History */}
        {history && history.attempts.length > 0 && (
          <Card className="mb-8">
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
          <Card className="mb-8">
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
          <Card className="border-2 border-dashed border-gray-300">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Started!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start taking quizzes or answering essay questions to see your performance analytics here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={() => router.push('/quizzes')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Take Your First Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/essays')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Answer an Essay
                </Button>
              </div>
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


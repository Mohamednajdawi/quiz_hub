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
import { format } from 'date-fns';
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
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function DashboardPageContent() {
  // Get user ID from auth context
  const { user } = useAuth();
  const userId = user?.id || null;
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

        {/* Performance Charts */}
        {history && history.attempts && Array.isArray(history.attempts) && history.attempts.length > 0 && (() => {
          // Sort attempts by timestamp (oldest first) and take last 20 for better visibility
          const sortedAttempts = [...history.attempts]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-20);
          
          const scores = sortedAttempts.map(a => a.percentage_score);
          const maxScore = Math.max(...scores, 100);
          const minScore = Math.min(...scores, 0);
          const range = maxScore - minScore || 100;
          const chartHeight = 256; // h-64 = 256px
          const padding = 60; // Increased padding for time labels
          const bottomPadding = 60; // Extra space for X-axis labels and "Time" label
          const innerWidth = 600; // Base width for calculation
          const innerHeight = chartHeight - padding - bottomPadding;
          
          // Get time range
          const timestamps = sortedAttempts.map(a => new Date(a.timestamp).getTime());
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const timeRange = maxTime - minTime || 1;
          
          // Calculate points for the line (X = time, Y = score)
          const points = sortedAttempts.map((attempt, index) => {
            const timeValue = new Date(attempt.timestamp).getTime();
            const normalizedTime = (timeValue - minTime) / timeRange;
            const x = padding + normalizedTime * innerWidth;
            const normalizedScore = range > 0 ? (attempt.percentage_score - minScore) / range : 0.5;
            const y = padding + innerHeight - (normalizedScore * innerHeight);
            return { 
              x, 
              y, 
              score: attempt.percentage_score, 
              timestamp: attempt.timestamp,
              date: new Date(attempt.timestamp)
            };
          });
          
          // Create path for the line
          const pathData = points.length > 1 
            ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            : `M ${points[0].x} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
          
          // Generate X-axis time labels (show 5-6 evenly spaced labels)
          const numLabels = Math.min(6, sortedAttempts.length);
          const timeLabels = [];
          if (sortedAttempts.length === 1) {
            // Single data point
            timeLabels.push({
              x: points[0].x,
              date: new Date(sortedAttempts[0].timestamp),
              index: 0
            });
          } else {
            for (let i = 0; i < numLabels; i++) {
              const index = Math.floor((i / (numLabels - 1)) * (sortedAttempts.length - 1));
              if (sortedAttempts[index]) {
                timeLabels.push({
                  x: points[index].x,
                  date: new Date(sortedAttempts[index].timestamp),
                  index
                });
              }
            }
          }
          
          return (
            <Card className="mb-8">
              <CardHeader title="Quiz Performance Trend" />
              <div className="p-6">
                <div className="relative" style={{ height: `${chartHeight}px` }}>
                  <svg 
                    width="100%" 
                    height={chartHeight}
                    className="overflow-visible"
                    viewBox={`0 0 ${innerWidth + padding * 2} ${chartHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Grid lines for scores (Y-axis) */}
                    {[0, 25, 50, 75, 100].map((percent) => {
                      const y = padding + innerHeight - ((percent / 100) * innerHeight);
                      return (
                        <line
                          key={percent}
                          x1={padding}
                          y1={y}
                          x2={innerWidth + padding}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      );
                    })}
                    
                    {/* Line path */}
                    {points.length > 0 && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    
                    {/* Data points */}
                    {points.map((point, index) => {
                      const isRecent = index >= sortedAttempts.length - 3;
                      return (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill={isRecent ? "#4f46e5" : "#818cf8"}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:r-8 transition-all cursor-pointer"
                          />
                          <title>{`Score: ${point.score.toFixed(1)}%\nDate: ${format(point.date, 'MMM d, yyyy HH:mm')}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Y-axis labels (Score) */}
                  <div className="absolute left-0 top-0 flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ height: `${innerHeight}px`, top: `${padding}px`, width: `${padding}px` }}>
                    <span>{maxScore.toFixed(0)}%</span>
                    <span>{((maxScore + minScore) / 2).toFixed(0)}%</span>
                    <span>{minScore.toFixed(0)}%</span>
                  </div>
                  <div className="absolute -left-10 top-1/2 transform -rotate-90 origin-center text-xs font-medium text-gray-700 whitespace-nowrap" style={{ top: `calc(${padding}px + ${innerHeight / 2}px)` }}>
                    Score (%)
                  </div>
                  
                  {/* X-axis labels (Time) */}
                  <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500" style={{ height: `${bottomPadding}px` }}>
                    {timeLabels.map((label, idx) => {
                      // Calculate position as percentage of total SVG width (including padding)
                      const totalWidth = innerWidth + padding * 2;
                      const positionPercent = (label.x / totalWidth) * 100;
                      return (
                        <span 
                          key={idx}
                          className="absolute"
                          style={{ 
                            left: `${positionPercent}%`,
                            transform: 'translateX(-50%)',
                            bottom: '5px'
                          }}
                        >
                          {format(label.date, 'MMM d')}
                        </span>
                      );
                    })}
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap" style={{ bottom: '-25px' }}>
                      Time
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-600">
                  <span>Last {sortedAttempts.length} attempts over time</span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded"></div>
                    Older
                    <div className="w-3 h-3 bg-indigo-600 rounded ml-2"></div>
                    Recent
                  </span>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Essay Performance Chart */}
        {combinedStats.essayScores && Array.isArray(combinedStats.essayScores) && combinedStats.essayScores.length > 0 && (() => {
          const scoresSlice = combinedStats.essayScores.slice(-10);
          const maxScore = Math.max(...scoresSlice, 100);
          const minScore = Math.min(...scoresSlice, 0);
          const range = maxScore - minScore || 100;
          const chartHeight = 256; // h-64 = 256px
          const padding = 40;
          const innerWidth = 600; // Base width for calculation
          const innerHeight = chartHeight - padding * 2;
          
          // Calculate points for the line
          const points = scoresSlice.map((score: number, index: number) => {
            const x = padding + (index / Math.max(scoresSlice.length - 1, 1)) * innerWidth;
            const normalizedScore = range > 0 ? (score - minScore) / range : 0.5;
            const y = padding + innerHeight - (normalizedScore * innerHeight);
            return { x, y, score };
          });
          
          // Create path for the line
          const pathData = points.length > 1 
            ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            : `M ${points[0].x} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
          
          return (
            <Card className="mb-8">
              <CardHeader title="Essay Performance Trend" />
              <div className="p-6">
                <div className="relative" style={{ height: `${chartHeight}px` }}>
                  <svg 
                    width="100%" 
                    height={chartHeight}
                    className="overflow-visible"
                    viewBox={`0 0 ${innerWidth + padding * 2} ${chartHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((percent) => {
                      const y = padding + innerHeight - ((percent / 100) * innerHeight);
                      return (
                        <line
                          key={percent}
                          x1={padding}
                          y1={y}
                          x2={innerWidth + padding}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      );
                    })}
                    
                    {/* Line path */}
                    {points.length > 0 && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    
                    {/* Data points */}
                    {points.map((point, index) => {
                      const isRecent = index >= scoresSlice.length - 3;
                      return (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill={isRecent ? "#9333ea" : "#a855f7"}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:r-8 transition-all cursor-pointer"
                          />
                          <title>{`Score: ${point.score.toFixed(1)}%`}</title>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                    <span>{maxScore.toFixed(0)}%</span>
                    <span>{((maxScore + minScore) / 2).toFixed(0)}%</span>
                    <span>{minScore.toFixed(0)}%</span>
                  </div>
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
          );
        })()}


        {/* Recent Activity - Unified Table */}
        {((history?.attempts && history.attempts.length > 0) || (essayAnswers?.answers && essayAnswers.answers.length > 0)) && (() => {
          // Combine and sort all activities
          const allActivities = [
            ...(history?.attempts.map(attempt => ({
              type: 'quiz' as const,
              id: attempt.id,
              timestamp: attempt.timestamp,
              name: attempt.topic_name || 'Quiz',
              category: attempt.category,
              subcategory: attempt.subcategory,
              score: attempt.percentage_score,
              timeTaken: attempt.time_taken_seconds,
              aiFeedback: attempt.ai_feedback,
              data: attempt,
            })) || []),
            ...(essayAnswers?.answers.map(answer => ({
              type: 'essay' as const,
              id: answer.id,
              timestamp: answer.timestamp,
              name: `${answer.topic} - Q${answer.question_index + 1}: ${answer.question}`,
              category: answer.category,
              subcategory: answer.subcategory,
              score: answer.score,
              timeTaken: null,
              aiFeedback: answer.ai_feedback,
              data: answer,
            })) || []),
          ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          // Calculate pagination
          const totalItems = allActivities.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentItems = allActivities.slice(startIndex, endIndex);

          return (
            <Card className="mb-8">
              <CardHeader title="Recent Activity" />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
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
                    {currentItems.map((activity) => (
                      <tr key={`${activity.type}-${activity.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.type === 'quiz'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {activity.type === 'quiz' ? (
                              <>
                                <BarChart3 className="w-3 h-3 mr-1" />
                                Quiz
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                Essay
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.name.length > 100 
                              ? `${activity.name.slice(0, 100)}...` 
                              : activity.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.category || 'Unknown'} • {activity.subcategory || activity.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.score !== undefined ? (
                            <span className={`text-sm font-medium ${
                              activity.score >= 70
                                ? 'text-green-600'
                                : activity.score >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {activity.score.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {activity.timeTaken !== null ? (
                            <>
                              {Math.floor(activity.timeTaken / 60)}m {activity.timeTaken % 60}s
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 whitespace-normal max-w-xs">
                          {activity.aiFeedback ? (
                            <ActivityFeedback feedback={activity.aiFeedback} />
                          ) : (
                            <span className="italic text-gray-400">Feedback not available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} activities
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}

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

// Reusable component for activity feedback
function ActivityFeedback({ feedback }: { feedback: string }) {
  const [expanded, setExpanded] = useState(false);

  const formattedFeedback = formatFeedbackToHtml(feedback);
  const plainText = formattedFeedback
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const normalizedText = plainText.replace(/\s+/g, ' ').trim();
  const preview = normalizedText.length > 160 
    ? `${normalizedText.slice(0, 160).trim()}…` 
    : normalizedText;

  return (
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
  );
}


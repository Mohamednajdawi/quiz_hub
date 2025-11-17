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
  const [showQuiz, setShowQuiz] = useState(true);
  const [showEssay, setShowEssay] = useState(true);

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

        {/* Combined Performance Chart */}
        {((history && history.attempts && Array.isArray(history.attempts) && history.attempts.length > 0) || 
          (essayAnswers && essayAnswers.answers && Array.isArray(essayAnswers.answers) && essayAnswers.answers.filter(a => a.score !== undefined).length > 0)) && (() => {
          // Prepare quiz data
          const quizData = (history?.attempts || [])
            .map(attempt => ({
              type: 'quiz' as const,
              timestamp: attempt.timestamp,
              score: attempt.percentage_score,
              date: new Date(attempt.timestamp)
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-20);
          
          // Prepare essay data
          const essayData = (essayAnswers?.answers || [])
            .filter(a => a.score !== undefined)
            .map(answer => ({
              type: 'essay' as const,
              timestamp: answer.timestamp,
              score: answer.score!,
              date: new Date(answer.timestamp)
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-20);
          
          // Combine all data points for unified time range
          const allDataPoints = [...quizData, ...essayData];
          
          if (allDataPoints.length === 0) return null;
          
          // Get unified time range
          const timestamps = allDataPoints.map(d => d.date.getTime());
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const timeRange = maxTime - minTime || 1;
          
          // Get unified score range
          const allScores = allDataPoints.map(d => d.score);
          const maxScore = Math.max(...allScores, 100);
          const minScore = Math.min(...allScores, 0);
          const range = maxScore - minScore || 100;
          
          const chartHeight = 256;
          const padding = 60;
          const bottomPadding = 60;
          const innerWidth = 600;
          const innerHeight = chartHeight - padding - bottomPadding;
          
          // Calculate points for quiz line
          const quizPoints = showQuiz ? quizData.map((item) => {
            const timeValue = item.date.getTime();
            const normalizedTime = (timeValue - minTime) / timeRange;
            const x = padding + normalizedTime * innerWidth;
            const normalizedScore = range > 0 ? (item.score - minScore) / range : 0.5;
            const y = padding + innerHeight - (normalizedScore * innerHeight);
            return { x, y, score: item.score, timestamp: item.timestamp, date: item.date };
          }) : [];
          
          // Calculate points for essay line
          const essayPoints = showEssay ? essayData.map((item) => {
            const timeValue = item.date.getTime();
            const normalizedTime = (timeValue - minTime) / timeRange;
            const x = padding + normalizedTime * innerWidth;
            const normalizedScore = range > 0 ? (item.score - minScore) / range : 0.5;
            const y = padding + innerHeight - (normalizedScore * innerHeight);
            return { x, y, score: item.score, timestamp: item.timestamp, date: item.date };
          }) : [];
          
          // Create paths
          const quizPathData = quizPoints.length > 1 
            ? quizPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            : quizPoints.length === 1 ? `M ${quizPoints[0].x} ${quizPoints[0].y} L ${quizPoints[0].x + 20} ${quizPoints[0].y}` : '';
          
          const essayPathData = essayPoints.length > 1 
            ? essayPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            : essayPoints.length === 1 ? `M ${essayPoints[0].x} ${essayPoints[0].y} L ${essayPoints[0].x + 20} ${essayPoints[0].y}` : '';
          
          // Generate X-axis time labels
          const minLabelSpacing = 60;
          const timeLabels = [];
          const sortedAllData = allDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          if (sortedAllData.length === 1) {
            const point = sortedAllData[0];
            const timeValue = point.date.getTime();
            const normalizedTime = (timeValue - minTime) / timeRange;
            const x = padding + normalizedTime * innerWidth;
            timeLabels.push({ x, date: point.date, index: 0 });
          } else {
            const maxLabels = Math.min(8, sortedAllData.length);
            const candidates = [];
            for (let i = 0; i < maxLabels; i++) {
              const index = Math.floor((i / (maxLabels - 1)) * (sortedAllData.length - 1));
              if (sortedAllData[index]) {
                const timeValue = sortedAllData[index].date.getTime();
                const normalizedTime = (timeValue - minTime) / timeRange;
                const x = padding + normalizedTime * innerWidth;
                candidates.push({ x, date: sortedAllData[index].date, index });
              }
            }
            
            let lastX = -Infinity;
            for (const candidate of candidates) {
              if (candidate.x - lastX >= minLabelSpacing || timeLabels.length === 0) {
                timeLabels.push(candidate);
                lastX = candidate.x;
              }
            }
            
            // Ensure first and last points
            if (timeLabels.length === 0 || timeLabels[0].index !== 0) {
              const firstPoint = sortedAllData[0];
              const timeValue = firstPoint.date.getTime();
              const normalizedTime = (timeValue - minTime) / timeRange;
              const x = padding + normalizedTime * innerWidth;
              const firstLabel = { x, date: firstPoint.date, index: 0 };
              if (timeLabels.length === 0 || timeLabels[0].x - firstLabel.x >= minLabelSpacing) {
                timeLabels.unshift(firstLabel);
              } else if (timeLabels[0].x - firstLabel.x < minLabelSpacing / 2) {
                timeLabels[0] = firstLabel;
              }
            }
            
            const lastIndex = sortedAllData.length - 1;
            if (timeLabels.length === 0 || timeLabels[timeLabels.length - 1].index !== lastIndex) {
              const lastPoint = sortedAllData[lastIndex];
              const timeValue = lastPoint.date.getTime();
              const normalizedTime = (timeValue - minTime) / timeRange;
              const x = padding + normalizedTime * innerWidth;
              const lastLabel = { x, date: lastPoint.date, index: lastIndex };
              const lastLabelX = timeLabels.length > 0 ? timeLabels[timeLabels.length - 1].x : -Infinity;
              if (timeLabels.length === 0 || lastLabel.x - lastLabelX >= minLabelSpacing) {
                timeLabels.push(lastLabel);
              } else if (lastLabel.x - lastLabelX < minLabelSpacing / 2) {
                timeLabels[timeLabels.length - 1] = lastLabel;
              }
            }
            
            timeLabels.sort((a, b) => a.index - b.index);
          }
          
          return (
            <Card className="mb-8">
              <CardHeader title="Performance Trend" />
              <div className="p-6">
                {/* Checkboxes */}
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showQuiz}
                      onChange={(e) => setShowQuiz(e.target.checked)}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <div className="w-3.5 h-3.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded shadow-sm"></div>
                      Quiz
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showEssay}
                      onChange={(e) => setShowEssay(e.target.checked)}
                      className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2 group-hover:text-pink-600 transition-colors">
                      <div className="w-3.5 h-3.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded shadow-sm"></div>
                      Essay
                    </span>
                  </label>
                </div>
                
                <div className="relative" style={{ height: `${chartHeight}px` }}>
                  <svg 
                    width="100%" 
                    height={chartHeight}
                    className="overflow-visible"
                    viewBox={`0 0 ${innerWidth + padding * 2} ${chartHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="quizGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="essayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
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
                    
                    {/* Quiz line path with gradient */}
                    {showQuiz && quizPathData && (
                      <path
                        d={quizPathData}
                        fill="none"
                        stroke="url(#quizGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={showQuiz ? 1 : 0.3}
                        filter="url(#glow)"
                      />
                    )}
                    
                    {/* Essay line path with gradient */}
                    {showEssay && essayPathData && (
                      <path
                        d={essayPathData}
                        fill="none"
                        stroke="url(#essayGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={showEssay ? 1 : 0.3}
                        filter="url(#glow)"
                      />
                    )}
                    
                    {/* Quiz data points */}
                    {showQuiz && quizPoints.map((point, index) => (
                      <g key={`quiz-${index}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="7"
                          fill="url(#quizGradient)"
                          stroke="white"
                          strokeWidth="2.5"
                          className="hover:r-9 transition-all cursor-pointer"
                          filter="url(#glow)"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="white"
                          opacity="0.6"
                        />
                        <title>{`Quiz Score: ${point.score.toFixed(1)}%\nDate: ${format(point.date, 'MMM d, yyyy HH:mm')}`}</title>
                      </g>
                    ))}
                    
                    {/* Essay data points */}
                    {showEssay && essayPoints.map((point, index) => (
                      <g key={`essay-${index}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="7"
                          fill="url(#essayGradient)"
                          stroke="white"
                          strokeWidth="2.5"
                          className="hover:r-9 transition-all cursor-pointer"
                          filter="url(#glow)"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="white"
                          opacity="0.6"
                        />
                        <title>{`Essay Score: ${point.score.toFixed(1)}%\nDate: ${format(point.date, 'MMM d, yyyy HH:mm')}`}</title>
                      </g>
                    ))}
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
                          {format(label.date, 'M/d')}
                        </span>
                      );
                    })}
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap" style={{ bottom: '-25px' }}>
                      Time
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  <span>
                    {showQuiz && showEssay 
                      ? `${quizData.length} quizzes • ${essayData.length} essays over time`
                      : showQuiz 
                        ? `${quizData.length} quizzes over time`
                        : `${essayData.length} essays over time`
                    }
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


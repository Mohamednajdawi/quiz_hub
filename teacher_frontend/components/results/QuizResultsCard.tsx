'use client';

import { useQuery } from '@tanstack/react-query';
import { quizApi } from '@/lib/api/quiz';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuizResultsCardProps {
  quiz: { id: number; topic: string; category: string };
}

export function QuizResultsCard({ quiz }: QuizResultsCardProps) {
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['quiz-results', quiz.id],
    queryFn: () => quizApi.getSharedResults(quiz.id),
    enabled: !!quiz.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['quiz-stats', quiz.id],
    queryFn: () => quizApi.getStatistics(quiz.id),
    enabled: !!quiz.id,
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (resultsLoading || statsLoading) {
    return (
      <div className="glassmorphism rounded-lg p-6 border border-[#38BDF8]/20">
        <div className="text-[#38BDF8] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphism rounded-lg p-6 border border-[#38BDF8]/20"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{quiz.topic}</h2>
          <p className="text-[#94A3B8] text-sm">{quiz.category}</p>
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-[#38BDF8] font-semibold">{stats.total_attempts}</div>
              <div className="text-[#94A3B8]">Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-[#38BDF8] font-semibold">
                {stats.average_score.toFixed(1)}%
              </div>
              <div className="text-[#94A3B8]">Avg Score</div>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-[#161F32] rounded border border-[#38BDF8]/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#38BDF8]" />
              <span className="text-sm text-[#94A3B8]">Total Attempts</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_attempts}</div>
          </div>

          <div className="p-4 bg-[#161F32] rounded border border-[#38BDF8]/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#38BDF8]" />
              <span className="text-sm text-[#94A3B8]">Average Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.average_score.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 bg-[#161F32] rounded border border-[#38BDF8]/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-[#94A3B8]">Best Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.best_score.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 bg-[#161F32] rounded border border-[#38BDF8]/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#38BDF8]" />
              <span className="text-sm text-[#94A3B8]">Total Time</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatTime(stats.total_time_spent)}
            </div>
          </div>
        </div>
      )}

      {results && results.attempts.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Attempts</h3>
          <div className="space-y-3">
            {results.attempts.slice(0, 10).map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 bg-[#161F32] rounded border border-[#38BDF8]/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">
                        {attempt.participant_name || 'Anonymous'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          attempt.percentage_score >= 70
                            ? 'bg-green-500/20 text-green-400'
                            : attempt.percentage_score >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {attempt.percentage_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {attempt.score}/{attempt.total_questions} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(attempt.time_taken_seconds)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          {format(new Date(attempt.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    {attempt.question_performance && (
                      <div className="mt-3 pt-3 border-t border-[#38BDF8]/10">
                        <div className="text-xs text-[#94A3B8] mb-2">Question Performance:</div>
                        <div className="flex flex-wrap gap-1">
                          {attempt.question_performance.map((q: any, idx: number) => (
                            <div
                              key={idx}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                                q.is_correct
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                              title={`Question ${idx + 1}: ${q.is_correct ? 'Correct' : 'Incorrect'}`}
                            >
                              {q.is_correct ? '✓' : '✗'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {attempt.ai_feedback && (
                      <div className="mt-3 p-3 bg-[#0B1221] rounded border border-[#38BDF8]/10">
                        <div className="text-xs text-[#94A3B8] mb-1">AI Feedback:</div>
                        <div className="text-sm text-[#94A3B8]">{attempt.ai_feedback}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {results.attempts.length > 10 && (
            <div className="mt-4 text-center text-[#94A3B8] text-sm">
              Showing 10 of {results.attempts.length} attempts
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-[#94A3B8]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No attempts yet for this quiz</p>
          <p className="text-sm mt-2">
            Share the quiz with students to see results here
          </p>
        </div>
      )}
    </motion.div>
  );
}


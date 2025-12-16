'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { quizApi } from '@/lib/api/quiz';
import { coursesApi } from '@/lib/api/courses';
import { Loader2, ArrowLeft, User, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CourseResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const courseId = parseInt(params.id as string);
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

  // Get course data to find quiz references
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getById(courseId),
    enabled: !!courseId && !authLoading && isAuthenticated, // Only run when auth is ready
    retry: 1,
  });

  // Get generated content to map quizzes to PDFs
  const { data: generatedContent } = useQuery({
    queryKey: ['generated-content', courseId],
    queryFn: () => coursesApi.getGeneratedContent(courseId),
    enabled: !!courseId && !authLoading && isAuthenticated, // Only run when auth is ready
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Fetch results for all quizzes in this course using useQueries
  // Stagger requests to avoid overwhelming the network on refresh
  const quizIds = course?.quiz_references || [];
  
  const resultsQueries = useQueries({
    queries: quizIds.map((quizId: number, index: number) => ({
      queryKey: ['quiz-results', quizId],
      queryFn: async () => {
        // Stagger requests: wait 50ms * index to avoid simultaneous bursts
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(index * 50, 1000)));
        }
        return quizApi.getSharedResults(quizId);
      },
      enabled: !!course && quizIds.length > 0 && !authLoading && isAuthenticated, // Only run when auth is ready
      staleTime: 2 * 60 * 1000, // 2 minutes - results don't change often
      retry: (failureCount, error: any) => {
        // Only retry network errors, and limit retries
        if (error?.message?.includes('Network error')) {
          return failureCount < 2;
        }
        return failureCount < 1;
      },
    })),
  });

  const isLoading = resultsQueries.some((q) => q.isLoading) || !course || !generatedContent;
  const hasError = resultsQueries.some((q) => q.isError);

  // Create a map of quiz_id -> content_id -> PDF name
  const quizToPdfMap: Record<number, { contentId: number | null; pdfName: string }> = {};
  if (generatedContent && course) {
    generatedContent.quizzes.forEach((quiz) => {
      const pdf = course.contents.find((c) => c.id === quiz.content_id);
      quizToPdfMap[quiz.id] = {
        contentId: quiz.content_id || null,
        pdfName: pdf?.name || 'All PDFs',
      };
    });
  }

  // Combine all results with PDF information
  const allResults = resultsQueries
    .map((q) => q.data)
    .filter((data) => data && data.attempts.length > 0)
    .flatMap((data) =>
      data!.attempts.map((attempt: any) => {
        const pdfInfo = quizToPdfMap[data!.quiz_id] || { contentId: null, pdfName: 'All PDFs' };
        return {
          ...attempt,
          quiz_id: data!.quiz_id,
          quiz_topic: data!.quiz_topic,
          share_code: data!.share_code,
          pdf_name: pdfInfo.pdfName,
          content_id: pdfInfo.contentId,
        };
      })
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group results by PDF (content_id)
  const resultsByPdf = allResults.reduce((acc: Record<string, typeof allResults>, result: any) => {
    const key = result.content_id ? `pdf_${result.content_id}` : 'all_pdfs';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {});

  // Get PDF names for grouping
  const pdfGroups = Object.entries(resultsByPdf).map(([key, results]) => {
    const firstResult = results[0] as any;
    return {
      key,
      pdfName: firstResult.pdf_name,
      contentId: firstResult.content_id,
      results: results as typeof allResults,
    };
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get incorrect question numbers from user_answers and correct_answers
  const getIncorrectQuestions = (attempt: any): number[] => {
    if (!attempt.user_answers || !attempt.correct_answers) {
      return [];
    }
    const incorrect: number[] = [];
    for (let i = 0; i < attempt.user_answers.length; i++) {
      if (attempt.user_answers[i] !== attempt.correct_answers[i]) {
        incorrect.push(i + 1); // Question numbers are 1-indexed
      }
    }
    return incorrect;
  };

  // Format incorrect questions as "Q2, Q7" or "Q2 and Q7"
  const formatIncorrectQuestions = (incorrect: number[]): string => {
    if (incorrect.length === 0) return 'None';
    if (incorrect.length === 1) return `Q${incorrect[0]}`;
    if (incorrect.length === 2) return `Q${incorrect[0]} and Q${incorrect[1]}`;
    // More than 2: "Q2, Q7, and Q10"
    const last = incorrect[incorrect.length - 1];
    const rest = incorrect.slice(0, -1).map(q => `Q${q}`).join(', ');
    return `${rest}, and Q${last}`;
  };

  // Get participant display name
  const getParticipantName = (attempt: any): string => {
    if (attempt.participant_first_name || attempt.participant_last_name) {
      const firstName = attempt.participant_first_name || '';
      const lastName = attempt.participant_last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Anonymous';
    }
    return attempt.participant_name || 'Anonymous';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#38BDF8] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1221] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Results</h1>
          <p className="text-[#94A3B8]">
            View all student attempts and performance analytics
          </p>
        </div>

        {/* Summary Stats */}
        {allResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="w-6 h-6 text-[#38BDF8]" />
                <h3 className="text-sm font-medium text-[#94A3B8]">Total Attempts</h3>
              </div>
              <p className="text-3xl font-bold text-white">{allResults.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-[#38BDF8]" />
                <h3 className="text-sm font-medium text-[#94A3B8]">Average Score</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {allResults.length > 0
                  ? (
                      allResults.reduce((sum, r) => sum + r.percentage_score, 0) / allResults.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-[#38BDF8]" />
                <h3 className="text-sm font-medium text-[#94A3B8]">Avg Time</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {allResults.length > 0
                  ? formatTime(
                      Math.round(
                        allResults.reduce((sum, r) => sum + r.time_taken_seconds, 0) /
                          allResults.length
                      )
                    )
                  : '0m 0s'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Results List - Grouped by PDF */}
        {allResults.length === 0 ? (
          <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-white text-lg mb-2">No results yet</p>
            <p className="text-[#94A3B8]">
              Students haven't taken any shared quizzes from this course yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pdfGroups.map((pdfGroup, groupIndex) => (
              <div key={pdfGroup.key} className="space-y-4">
                {/* PDF Header */}
                <div className="glassmorphism rounded-lg border border-[#38BDF8]/30 p-4 bg-[#38BDF8]/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-[#38BDF8] rounded-full"></div>
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>📄</span>
                        {pdfGroup.pdfName}
                      </h2>
                      <p className="text-sm text-[#94A3B8] mt-1">
                        {pdfGroup.results.length} {pdfGroup.results.length === 1 ? 'attempt' : 'attempts'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results for this PDF */}
                <div className="space-y-4 ml-4">
                  {pdfGroup.results.map((attempt: any, index: number) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glassmorphism rounded-lg border border-[#38BDF8]/20 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-[#161F32]/50 transition-colors"
                  onClick={() =>
                    setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Participant Name */}
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {getParticipantName(attempt)}
                      </h3>
                      
                      {/* Participant Details */}
                      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                        {attempt.participant_first_name && (
                          <span className="text-[#94A3B8]">
                            <span className="font-medium text-white">First:</span> {attempt.participant_first_name}
                          </span>
                        )}
                        {attempt.participant_last_name && (
                          <span className="text-[#94A3B8]">
                            <span className="font-medium text-white">Last:</span> {attempt.participant_last_name}
                          </span>
                        )}
                        {attempt.participant_email && (
                          <span className="text-[#94A3B8]">
                            <span className="font-medium text-white">Email:</span> {attempt.participant_email}
                          </span>
                        )}
                      </div>

                      {/* Quiz Topic and PDF */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-[#94A3B8]">{attempt.quiz_topic}</span>
                        <span className="text-sm text-[#94A3B8]">•</span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#38BDF8]/20 text-[#38BDF8] text-xs rounded border border-[#38BDF8]/30">
                          <span>📄</span>
                          {attempt.pdf_name}
                        </span>
                      </div>

                      {/* Score and Incorrect Questions */}
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-[#94A3B8]">
                          <span className="font-medium text-white">Score:</span> {attempt.score} / {attempt.total_questions}
                        </span>
                        {(() => {
                          const incorrect = getIncorrectQuestions(attempt);
                          if (incorrect.length > 0) {
                            return (
                              <span className="text-sm text-red-400">
                                <span className="font-medium">Incorrect:</span> {formatIncorrectQuestions(incorrect)}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Timestamp and Time Taken */}
                      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                        <span>{formatDate(attempt.timestamp)}</span>
                        <span>•</span>
                        <span>{formatTime(attempt.time_taken_seconds)}</span>
                      </div>
                    </div>
                    
                    {/* Score Percentage */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`text-3xl font-bold ${
                          attempt.percentage_score >= 70
                            ? 'text-[#38BDF8]'
                            : attempt.percentage_score >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {attempt.percentage_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAttempt === attempt.id && (
                  <div className="border-t border-[#38BDF8]/20 p-6 bg-[#161F32]/30 space-y-4">
                    {/* Participant Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Participant Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-[#94A3B8]">First Name:</span>
                          <span className="text-white ml-2">{attempt.participant_first_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Last Name:</span>
                          <span className="text-white ml-2">{attempt.participant_last_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Email:</span>
                          <span className="text-white ml-2">{attempt.participant_email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Score Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[#94A3B8]">Score:</span>
                          <span className="text-white ml-2 font-semibold">{attempt.score} / {attempt.total_questions}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Percentage:</span>
                          <span className={`ml-2 font-semibold ${
                            attempt.percentage_score >= 70
                              ? 'text-[#38BDF8]'
                              : attempt.percentage_score >= 50
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}>
                            {attempt.percentage_score.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Time Taken:</span>
                          <span className="text-white ml-2">{formatTime(attempt.time_taken_seconds)}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Incorrect Questions:</span>
                          <span className="text-red-400 ml-2 font-semibold">
                            {formatIncorrectQuestions(getIncorrectQuestions(attempt))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {attempt.ai_feedback && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">AI Feedback</h4>
                        <p className="text-[#94A3B8] whitespace-pre-wrap bg-[#0B1221] p-4 rounded border border-[#38BDF8]/10">
                          {attempt.ai_feedback}
                        </p>
                      </div>
                    )}

                    {/* Technical Details */}
                    <div className="pt-3 border-t border-[#38BDF8]/10">
                      <div className="text-xs text-[#94A3B8] space-y-1">
                        <p>
                          <span className="font-semibold">Quiz ID:</span> {attempt.quiz_id}
                        </p>
                        {attempt.share_code && (
                          <p>
                            <span className="font-semibold">Share Code:</span> {attempt.share_code}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Submitted:</span> {formatDate(attempt.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


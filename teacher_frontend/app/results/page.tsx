'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi } from '@/lib/api/courses';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, FileText, Calendar } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAllCourses, setShowAllCourses] = useState(false);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'results/page.tsx:18',
        message: 'ResultsPage render',
        data: { authLoading, isAuthenticated, queryEnabled: !authLoading && isAuthenticated },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      }),
    }).catch(() => {});
  }, [authLoading, isAuthenticated]);
  // #endregion

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses-for-results'],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'results/page.tsx:40',
          message: 'Courses query function executing (results view)',
          data: {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      return coursesApi.getAll();
    },
    enabled: !authLoading && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, err: unknown) => {
      if (err instanceof Error && err.message.includes('Network error')) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
  });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'results/page.tsx:63',
        message: 'Courses query state changed (results view)',
        data: {
          isLoading,
          hasError: !!error,
          hasData: !!data,
          errorMessage: error instanceof Error ? error.message : null,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      }),
    }).catch(() => {});
  }, [isLoading, error, data]);
  // #endregion

  const courses = data?.projects || [];
  const sortedCourses = [...courses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const visibleCourses = showAllCourses ? sortedCourses : sortedCourses.slice(0, 9);
  const hasMoreCourses = sortedCourses.length > 9;

  if (authLoading || isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-[#38BDF8] text-lg">Loading courses for results...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-white mb-2">Error loading courses</h2>
              <p className="text-[#94A3B8] mb-4">
                {error instanceof Error ? error.message : 'Please try refreshing the page'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B1221]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Results by Course</h1>
            <p className="text-sm sm:text-base text-[#94A3B8]">
              Select a course to view quiz results grouped by PDF.
            </p>
          </div>

          {sortedCourses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No courses yet</h2>
              <p className="text-[#94A3B8] mb-6">
                Create a course and generate quizzes to see results here.
              </p>
              <button
                onClick={() => router.push('/courses')}
                className="px-6 py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded"
              >
                Go to Courses
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/courses/${course.id}/results`)}
                  className="glassmorphism rounded-lg p-6 border border-[#38BDF8]/20 hover:border-[#38BDF8]/40 cursor-pointer transition-all hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <BarChart3 className="w-8 h-8 text-[#38BDF8]" />
                    <div className="text-xs text-[#94A3B8]">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{course.contents.length} PDFs</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{course.name}</h3>
                  <p className="text-[#94A3B8] text-sm mb-4 line-clamp-2">
                    {course.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      <span>{course.quiz_references.length} quizzes with results</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {hasMoreCourses && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowAllCourses((prev) => !prev)}
                  className="px-6 py-2 border border-[#38BDF8]/40 text-[#38BDF8] hover:bg-[#38BDF8]/10 rounded-full text-sm font-medium transition-colors"
                >
                  {showAllCourses
                    ? 'Show less'
                    : `Show more (${sortedCourses.length - visibleCourses.length})`}
                </button>
              </div>
            )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}


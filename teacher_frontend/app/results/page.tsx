'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { quizApi } from '@/lib/api/quiz';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3 } from 'lucide-react';
import { QuizResultsCard } from '@/components/results/QuizResultsCard';

export default function ResultsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: quizzes, isLoading, error } = useQuery({
    queryKey: ['my-quizzes'],
    queryFn: () => quizApi.getMyQuizzes(),
    enabled: !authLoading && isAuthenticated, // Only run when auth is ready
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B1221]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Results & Analytics</h1>
            <p className="text-[#94A3B8]">Monitor student performance and quiz statistics</p>
          </div>

          {isLoading || authLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-[#38BDF8] text-lg">Loading quizzes...</div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-white mb-2">Error loading quizzes</h2>
              <p className="text-[#94A3B8]">Please try refreshing the page</p>
            </div>
          ) : !quizzes || quizzes.topics.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-[#94A3B8] mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-white mb-2">No quizzes yet</h2>
              <p className="text-[#94A3B8]">Generate quizzes from your courses to see results here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {quizzes.topics.map((quiz, index) => (
                <QuizResultsCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


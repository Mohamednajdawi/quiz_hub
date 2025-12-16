'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { quizApi } from '@/lib/api/quiz';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3 } from 'lucide-react';
import { QuizResultsCard } from '@/components/results/QuizResultsCard';

export default function ResultsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:13',message:'ResultsPage render',data:{authLoading,isAuthenticated,queryEnabled:!authLoading&&isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [authLoading, isAuthenticated]);
  // #endregion
  
  const { data: quizzes, isLoading, error, refetch } = useQuery({
    queryKey: ['my-quizzes'],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:22',message:'Query function executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return quizApi.getMyQuizzes();
    },
    enabled: !authLoading && isAuthenticated, // Only run when auth is ready
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:28',message:'Query retry decision',data:{failureCount,errorMessage:error?.message,willRetry:error?.message?.includes('Network error')?failureCount<3:failureCount<1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Retry network errors more aggressively
      if (error?.message?.includes('Network error')) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
  });
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:38',message:'Query state changed',data:{isLoading,hasError:!!error,hasData:!!quizzes,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [isLoading, error, quizzes]);
  // #endregion


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
              <p className="text-[#94A3B8] mb-4">{error.message || 'Please try refreshing the page'}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
              >
                Retry
              </button>
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


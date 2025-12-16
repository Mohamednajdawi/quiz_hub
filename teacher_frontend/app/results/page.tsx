'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { quizApi } from '@/lib/api/quiz';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { QuizResultsCard } from '@/components/results/QuizResultsCard';

export default function ResultsPage() {
  const { data: quizzes } = useQuery({
    queryKey: ['my-quizzes'],
    queryFn: () => quizApi.getMyQuizzes(),
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

          {!quizzes || quizzes.topics.length === 0 ? (
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


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glassmorphism rounded-lg p-6 sm:p-8 border border-[#38BDF8]/20">
          <div className="text-center mb-6 sm:mb-8">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#38BDF8] mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
            <p className="text-sm sm:text-base text-[#94A3B8]">Sign in to manage your courses</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  placeholder="teacher@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#94A3B8] text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-[#38BDF8] hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


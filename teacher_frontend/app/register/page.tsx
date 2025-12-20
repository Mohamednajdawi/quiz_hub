'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Calendar, Users, BookOpen } from 'lucide-react';
import { GenderOption } from '@/lib/api/auth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'prefer_not_to_say' as GenderOption,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-sm sm:text-base text-[#94A3B8]">Start managing your courses</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Birth Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Gender
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderOption })}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Creating account...'
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#94A3B8] text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#38BDF8] hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


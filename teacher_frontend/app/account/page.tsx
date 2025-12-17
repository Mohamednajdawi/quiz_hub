'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GenderOption } from '@/lib/api/auth';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Calendar, Users, Save } from 'lucide-react';

export default function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<GenderOption>('prefer_not_to_say');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form once user is available
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setBirthDate(user.birth_date || '');
      setGender((user.gender as GenderOption) || 'prefer_not_to_say');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await updateProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        birth_date: birthDate || undefined,
        gender,
      });
      setSuccess('Account details updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update account details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
          <div className="text-[#38BDF8] text-lg">Loading account...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B1221]">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-lg p-6 border border-[#38BDF8]/20"
          >
            <div className="flex items-center gap-3 mb  -6">
              <UserIcon className="w-8 h-8 text-[#38BDF8]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Account</h1>
                <p className="text-sm text-[#94A3B8]">
                  Update your personal information used across the teacher dashboard.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-300 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-[#94A3B8] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    First name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Birth date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      type="date"
                      value={birthDate || ''}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as GenderOption)}
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

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}



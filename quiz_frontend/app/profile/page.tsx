'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import type { GenderOption, UpdateProfileRequest } from '@/lib/api/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProfileFormState {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: GenderOption;
}

const genderOptions: { value: GenderOption; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function ProfileContent() {
  const { user, updateProfile, isLoading } = useAuth();
  const [formState, setFormState] = useState<ProfileFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxBirthDate = useMemo(() => {
    const today = new Date();
    const minBirthDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );
    return minBirthDate.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (user) {
      setFormState({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        birth_date: user.birth_date ?? '',
        gender: user.gender ?? 'prefer_not_to_say',
      });
    }
  }, [user]);

  const isDirty = useMemo(() => {
    if (!formState || !user) return false;
    return (
      formState.first_name !== (user.first_name ?? '') ||
      formState.last_name !== (user.last_name ?? '') ||
      formState.birth_date !== (user.birth_date ?? '') ||
      formState.gender !== (user.gender ?? 'prefer_not_to_say')
    );
  }, [formState, user]);

  if (isLoading || !formState || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === 'gender' ? (value as GenderOption) : value,
          }
        : prev
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState) return;

    setError(null);
    setSuccess(null);

    if (!formState.first_name.trim() || !formState.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }

    if (!formState.birth_date) {
      setError('Please provide your birth date.');
      return;
    }

    const birthDateObj = new Date(formState.birth_date);
    if (Number.isNaN(birthDateObj.getTime())) {
      setError('Please provide a valid birth date.');
      return;
    }

    const today = new Date();
    const minBirthDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );

    if (birthDateObj > minBirthDate) {
      setError('You must be at least 13 years old.');
      return;
    }

    const payload: UpdateProfileRequest = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      birth_date: formState.birth_date,
      gender: formState.gender,
    };

    setIsSaving(true);
    try {
      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mt-12">
          <Card>
            <CardHeader
              title="Profile"
              description="Manage your personal information and keep your profile up to date."
            />

            <div className="px-6 pb-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
                <p className="text-sm text-gray-600">Your email address is used for login and notifications.</p>
                <div className="mt-4">
                  <Input label="Email" value={user.email} readOnly disabled className="bg-gray-100" />
                </div>
                {typeof user.free_tokens === 'number' && (
                  <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-4 py-3">
                    <span className="font-semibold">Free plan status:</span> {user.free_tokens} generation{user.free_tokens === 1 ? '' : 's'} remaining.
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-600">Provide details to personalize your experience.</p>
              </div>

              {error && (
                <Alert type="error">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert type="success">
                  {success}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    value={formState.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={formState.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                  label="Birth Date"
                  type="date"
                  value={formState.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  max={maxBirthDate}
                  required
                  />
                  <Select
                    label="Gender"
                    value={formState.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                    options={genderOptions}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    disabled={!isDirty || isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}


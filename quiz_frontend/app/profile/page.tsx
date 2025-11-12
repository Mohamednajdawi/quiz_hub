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
import { subscriptionApi } from '@/lib/api/subscription';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Calendar, XCircle } from 'lucide-react';

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
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<ProfileFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  
  const isPro = user?.account_type === 'pro' || user?.subscription?.status === 'active';
  
  // Fetch subscription details
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getCurrentUserSubscription,
    enabled: isPro,
    retry: 1,
  });
  
  const cancelMutation = useMutation({
    mutationFn: (subscriptionId: string) => subscriptionApi.cancelSubscription(subscriptionId, true),
    onSuccess: () => {
      setCancelSuccess('Subscription will be canceled at the end of the current billing period.');
      setCancelError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      // Refresh user data
      window.location.reload();
    },
    onError: (err: any) => {
      setCancelError(err?.response?.data?.detail || err?.message || 'Failed to cancel subscription');
      setCancelSuccess(null);
    },
  });

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
                
                {/* Subscription Info */}
                {isPro && subscription?.has_subscription && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg px-4 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-gray-900">Pro Subscription Active</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        {subscription.remaining_generations !== undefined && subscription.monthly_limit !== undefined ? (
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium">Generations:</span>
                            <span className="text-indigo-600 font-semibold">
                              {subscription.remaining_generations} remaining ({subscription.monthly_limit} per month)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium">Generations:</span>
                            <span className="text-indigo-600 font-semibold">200 per month</span>
                          </div>
                        )}
                        {subscription.plan_type && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium">Plan:</span>
                            <span className="text-indigo-600 font-semibold capitalize">{subscription.plan_type}</span>
                          </div>
                        )}
                        {subscription.current_period_end && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Next payment:</span>
                            <span>{new Date(subscription.current_period_end).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                        )}
                        {subscription.cancel_at_period_end && (
                          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">Subscription will cancel at period end</span>
                          </div>
                        )}
                      </div>
                      {!subscription.cancel_at_period_end && subscription.stripe_subscription_id && (
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
                                cancelMutation.mutate(subscription.stripe_subscription_id!);
                              }
                            }}
                            isLoading={cancelMutation.isPending}
                            disabled={cancelMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                      {cancelError && (
                        <Alert type="error" className="mt-3">
                          {cancelError}
                        </Alert>
                      )}
                      {cancelSuccess && (
                        <Alert type="success" className="mt-3">
                          {cancelSuccess}
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
                
                {!isPro && typeof user.free_tokens === 'number' && (
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


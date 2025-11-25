'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import type { GenderOption } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/events';

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<GenderOption>('prefer_not_to_say');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const maxBirthDate = (() => {
    const today = new Date();
    const minBirthDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );
    return minBirthDate.toISOString().split('T')[0];
  })();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }

    if (!birthDate) {
      setError('Please provide your birth date');
      return;
    }

    const birthDateObj = new Date(birthDate);
    if (Number.isNaN(birthDateObj.getTime())) {
      setError('Please provide a valid birth date');
      return;
    }

    const today = new Date();
    const minBirthDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );

    if (birthDateObj > minBirthDate) {
      setError('You must be at least 13 years old to register');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password.length > 72) {
      setError('Password must be at most 72 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        gender,
      });
      trackEvent({
        name: 'signup_success',
        params: { method: 'email' },
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Registration failed. Please try again.');
      trackEvent({
        name: 'signup_error',
        params: { reason: err.response?.status ?? 'unknown' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const genderOptions: { value: GenderOption; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto mt-12">
          <Card>
            <CardHeader
              title="Create Account"
              description="Sign up to start creating quizzes and tracking your progress"
            />

            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(event: InputChangeEvent) => setFirstName(event.target.value)}
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(event: InputChangeEvent) => setLastName(event.target.value)}
                  placeholder="Doe"
                  required
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event: InputChangeEvent) => setEmail(event.target.value)}
                placeholder="your.email@example.com"
                required
                autoComplete="email"
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Birth Date"
                  type="date"
                  value={birthDate}
                  onChange={(event: InputChangeEvent) => setBirthDate(event.target.value)}
                  max={maxBirthDate}
                  required
                />
                <Select
                  label="Gender"
                  value={gender}
                  onChange={(event: SelectChangeEvent) =>
                    setGender(event.target.value as GenderOption)
                  }
                  options={genderOptions}
                  required
                />
              </div>

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(event: InputChangeEvent) => setPassword(event.target.value)}
                placeholder="At least 6 characters (max 72)"
                required
                autoComplete="new-password"
                maxLength={72}
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event: InputChangeEvent) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                maxLength={72}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


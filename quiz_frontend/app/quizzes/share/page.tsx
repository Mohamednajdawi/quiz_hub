'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Key } from 'lucide-react';

export default function ShareQuizEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate code format
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    // Navigate to the quiz page
    router.push(`/quizzes/share/${code}`);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Quiz Code</h1>
              <p className="text-gray-600">
                Enter the 6-digit code shared with you to take the quiz
              </p>
            </div>

            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Quiz Code"
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setError(null);
                }}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                required
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={code.length !== 6}
              >
                Start Quiz
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


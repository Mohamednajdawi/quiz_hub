'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { gdprApi } from '@/lib/api/gdpr';
import { useAuth } from '@/contexts/AuthContext';

function DataRightsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataAccessData, setDataAccessData] = useState<any>(null);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [objectionReason, setObjectionReason] = useState('');
  const [objectionPurpose, setObjectionPurpose] = useState('');

  const handleDataAccess = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await gdprApi.getDataAccess();
      setDataAccessData(data.data);
      setActiveSection('data-access');
      setSuccess('Your data has been retrieved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const blob = await gdprApi.exportData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progrezz_data_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`Your data has been exported as ${format.toUpperCase()}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to export your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataErasure = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action is IRREVERSIBLE.\n\n' +
      'Deleting your account will:\n' +
      '• Permanently delete all your data\n' +
      '• Remove all quizzes, flashcards, essays, and mind maps\n' +
      '• Cancel your subscription\n' +
      '• Anonymize your account\n\n' +
      'Some financial records may be retained for legal compliance.\n\n' +
      'Are you absolutely sure you want to delete your account?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This is your last chance. Type DELETE in the next prompt to confirm.'
    );

    if (!doubleConfirm) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await gdprApi.deleteDataErasure();
      setSuccess('Your account and data have been deleted. You will be logged out.');
      setTimeout(() => {
        logout();
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictProcessing = async () => {
    if (!restrictionReason.trim()) {
      setError('Please provide a reason for restricting processing.');
      return;
    }

    const confirmed = window.confirm(
      'Restricting processing will deactivate your account. You will not be able to use Progrezz until the restriction is lifted.\n\n' +
      'Do you want to continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await gdprApi.restrictProcessing(restrictionReason);
      setSuccess('Processing has been restricted. Your account has been deactivated.');
      setTimeout(() => {
        logout();
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to restrict processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectToProcessing = async () => {
    if (!objectionReason.trim()) {
      setError('Please provide a reason for objecting to processing.');
      return;
    }

    const confirmed = window.confirm(
      'Objecting to processing will deactivate your account. You will not be able to use Progrezz.\n\n' +
      'Do you want to continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await gdprApi.objectToProcessing(objectionReason, objectionPurpose || undefined);
      setSuccess('Your objection has been recorded. Your account has been deactivated.');
      setTimeout(() => {
        logout();
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to record your objection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mt-12">
          <div className="mb-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/profile')}
              className="mb-4"
            >
              ← Back to Profile
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Your Data Rights</h1>
            <p className="text-sm text-gray-600 mt-2">
              Under GDPR, you have several rights regarding your personal data. Use these tools to exercise your rights.
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              {success}
            </Alert>
          )}

          <div className="space-y-6">
            {/* Article 15: Right of Access */}
            <Card>
              <CardHeader
                title="Right of Access (Article 15)"
                description="View all personal data we hold about you"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  You have the right to know what personal data we process about you and how we use it.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setActiveSection('data-access');
                      handleDataAccess();
                    }}
                    isLoading={loading && activeSection === 'data-access'}
                    disabled={loading}
                  >
                    View My Data
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveSection('export-json');
                      handleDataExport('json');
                    }}
                    isLoading={loading && activeSection === 'export-json'}
                    disabled={loading}
                  >
                    Export as JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveSection('export-csv');
                      handleDataExport('csv');
                    }}
                    isLoading={loading && activeSection === 'export-csv'}
                    disabled={loading}
                  >
                    Export as CSV
                  </Button>
                </div>

                {dataAccessData && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Your Data Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{dataAccessData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Account Created:</span>
                        <span className="ml-2 font-medium">
                          {dataAccessData.created_at
                            ? new Date(dataAccessData.created_at).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quizzes Created:</span>
                        <span className="ml-2 font-medium">
                          {dataAccessData.quiz_topics_created?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quiz Attempts:</span>
                        <span className="ml-2 font-medium">
                          {dataAccessData.quiz_attempts?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Projects:</span>
                        <span className="ml-2 font-medium">
                          {dataAccessData.student_projects?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Subscriptions:</span>
                        <span className="ml-2 font-medium">
                          {dataAccessData.subscriptions?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Article 16: Right to Rectification */}
            <Card>
              <CardHeader
                title="Right to Rectification (Article 16)"
                description="Correct inaccurate personal data"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  You can update your personal information from your{' '}
                  <a href="/profile" className="text-indigo-600 hover:underline">
                    profile page
                  </a>
                  .
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/profile')}
                >
                  Go to Profile
                </Button>
              </div>
            </Card>

            {/* Article 20: Right to Data Portability */}
            <Card>
              <CardHeader
                title="Right to Data Portability (Article 20)"
                description="Download your data in a machine-readable format"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Download all your personal data in JSON or CSV format for use in other services.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setActiveSection('export-json');
                      handleDataExport('json');
                    }}
                    isLoading={loading && activeSection === 'export-json'}
                    disabled={loading}
                  >
                    Download JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveSection('export-csv');
                      handleDataExport('csv');
                    }}
                    isLoading={loading && activeSection === 'export-csv'}
                    disabled={loading}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Article 18: Right to Restriction */}
            <Card>
              <CardHeader
                title="Right to Restriction of Processing (Article 18)"
                description="Temporarily restrict processing of your data"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  If you dispute the accuracy of your data or object to processing, you can request
                  that we restrict processing while the matter is resolved.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Reason for Restriction"
                    value={restrictionReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRestrictionReason(e.target.value)}
                    placeholder="Please explain why you want to restrict processing..."
                    multiline
                    rows={3}
                  />
                  <Button
                    variant="warning"
                    onClick={() => {
                      setActiveSection('restrict');
                      handleRestrictProcessing();
                    }}
                    isLoading={loading && activeSection === 'restrict'}
                    disabled={loading || !restrictionReason.trim()}
                  >
                    Request Restriction
                  </Button>
                </div>
              </div>
            </Card>

            {/* Article 21: Right to Object */}
            <Card>
              <CardHeader
                title="Right to Object (Article 21)"
                description="Object to processing of your personal data"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  You have the right to object to processing of your personal data for certain purposes.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Reason for Objection"
                    value={objectionReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setObjectionReason(e.target.value)}
                    placeholder="Please explain why you object to processing..."
                    multiline
                    rows={3}
                    required
                  />
                  <Input
                    label="Processing Purpose (Optional)"
                    value={objectionPurpose}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setObjectionPurpose(e.target.value)}
                    placeholder="e.g., marketing, analytics, etc."
                  />
                  <Button
                    variant="warning"
                    onClick={() => {
                      setActiveSection('object');
                      handleObjectToProcessing();
                    }}
                    isLoading={loading && activeSection === 'object'}
                    disabled={loading || !objectionReason.trim()}
                  >
                    Submit Objection
                  </Button>
                </div>
              </div>
            </Card>

            {/* Article 17: Right to Erasure */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader
                title="Right to Erasure (Article 17) - 'Right to be Forgotten'"
                description="Permanently delete your account and all data"
              />
              <div className="px-6 pb-6">
                <div className="bg-red-100 border border-red-300 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Warning: This action is irreversible</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>All your data will be permanently deleted</li>
                    <li>All quizzes, flashcards, essays, and mind maps will be removed</li>
                    <li>Your subscription will be cancelled</li>
                    <li>Your account will be anonymized</li>
                    <li>Some financial records may be retained for legal compliance</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  If you want to delete your account and all associated data, click the button below.
                  This action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  onClick={() => {
                    setActiveSection('erase');
                    handleDataErasure();
                  }}
                  isLoading={loading && activeSection === 'erase'}
                  disabled={loading}
                >
                  Delete My Account
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function DataRightsPage() {
  return (
    <ProtectedRoute>
      <DataRightsContent />
    </ProtectedRoute>
  );
}


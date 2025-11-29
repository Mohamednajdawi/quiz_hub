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
      '⚠️ WARNING: This action cannot be undone.\n\n' +
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
      'Restricting your account will deactivate it immediately. You will not be able to use Progrezz until the restriction is lifted.\n\n' +
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
      'Submitting this request will deactivate your account immediately. You will not be able to use Progrezz until the matter is resolved.\n\n' +
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
            <h1 className="text-3xl font-bold text-gray-900">Data & Privacy</h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage your personal data, download your information, or delete your account.
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
            {/* Data Access */}
            <Card>
              <CardHeader
                title="View Your Data"
                description="See all information we have about your account"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Review all personal information, activity history, and content associated with your account.
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

            {/* Data Correction */}
            <Card>
              <CardHeader
                title="Update Your Information"
                description="Correct or update your personal details"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Keep your account information up to date. You can modify your name, birth date, and other personal details.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/profile')}
                >
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader
                title="Download Your Data"
                description="Export your account data in a portable format"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Get a complete copy of your data in JSON or CSV format. Perfect for backing up your information or transferring to another service.
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

            {/* Processing Restriction */}
            <Card>
              <CardHeader
                title="Restrict Account Activity"
                description="Temporarily pause processing of your data"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  If you need to temporarily pause account activity while resolving a concern, you can request a restriction. Your account will be deactivated until you're ready to resume.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Reason"
                    value={restrictionReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRestrictionReason(e.target.value)}
                    placeholder="Please explain why you need to restrict your account activity..."
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
                    Restrict Account
                  </Button>
                </div>
              </div>
            </Card>

            {/* Object to Processing */}
            <Card>
              <CardHeader
                title="Object to Data Processing"
                description="Request that we stop processing your data for specific purposes"
              />
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 mb-4">
                  If you have concerns about how your data is being used, you can object to specific processing activities. Your account will be deactivated while we review your request.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Reason"
                    value={objectionReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setObjectionReason(e.target.value)}
                    placeholder="Please explain your concerns..."
                    multiline
                    rows={3}
                    required
                  />
                  <Input
                    label="Specific Purpose (Optional)"
                    value={objectionPurpose}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setObjectionPurpose(e.target.value)}
                    placeholder="e.g., marketing communications, analytics, etc."
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
                    Submit Request
                  </Button>
                </div>
              </div>
            </Card>

            {/* Account Deletion */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader
                title="Delete Account"
                description="Permanently remove your account and all associated data"
              />
              <div className="px-6 pb-6">
                <div className="bg-red-100 border border-red-300 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Warning: This action cannot be undone</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>All your data will be permanently deleted</li>
                    <li>All quizzes, flashcards, essays, and mind maps will be removed</li>
                    <li>Your subscription will be cancelled</li>
                    <li>Your account will be anonymized</li>
                    <li>Some financial records may be retained for legal compliance</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Once deleted, you will not be able to recover any of your data or content. Please ensure you have exported any information you wish to keep before proceeding.
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


'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import { studentProjectsApi, type StudentProject } from '@/lib/api/studentProjects';

export default function StudentHubPage() {
  return (
    <ProtectedRoute>
      <StudentHubContent />
    </ProtectedRoute>
  );
}

function StudentHubContent() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: projects, isLoading, error: queryError } = useQuery<StudentProject[]>({
    queryKey: ['student-projects'],
    queryFn: studentProjectsApi.listProjects,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: () => studentProjectsApi.createProject({ name, description }),
    onSuccess: () => {
      setName('');
      setDescription('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['student-projects'] });
    },
    onError: (e: any) => {
      const errorMsg = e?.response?.data?.detail || e?.message || String(e);
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to create project');
    },
  });

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Hub</h1>
            <p className="text-gray-700">Create projects and manage your study materials</p>
          </div>

          {(error || queryError) && (
            <Alert type="error" className="mb-6">
              {error || (queryError instanceof Error ? queryError.message : String(queryError))}
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Project Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">New Project</h3>
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Project Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g., Math 101 Notes"
                    required 
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this project..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => createMutation.mutate()}
                    disabled={!name.trim()}
                    isLoading={createMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              </Card>
            </div>

            {/* Projects List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">Your Projects</h3>
                </div>
                {projects && projects.length > 0 && (
                  <span className="text-sm text-gray-700">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
                )}
              </div>

              {isLoading ? (
                <Card>
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((p) => {
                    // Calculate counts
                    const pdfCount = p.contents?.filter(c => c.content_type === 'pdf').length || 0;
                    const quizCount = p.quiz_references?.length || 0;
                    const flashcardCount = p.flashcard_references?.length || 0;
                    const essayCount = p.essay_references?.length || 0;

                    // Build count string
                    const countParts: string[] = [];
                    if (pdfCount > 0) countParts.push(`${pdfCount} PDF${pdfCount !== 1 ? 's' : ''}`);
                    if (quizCount > 0) countParts.push(`${quizCount} ${quizCount === 1 ? 'Quiz' : 'Quizzes'}`);
                    if (flashcardCount > 0) countParts.push(`${flashcardCount} Flashcard${flashcardCount !== 1 ? 's' : ''}`);
                    if (essayCount > 0) countParts.push(`${essayCount} Essay${essayCount !== 1 ? 's' : ''}`);
                    const countString = countParts.join(' • ');

                    return (
                      <Link key={p.id} href={`/student-hub/${p.id}`} className="block group">
                        <Card className="transition-all hover:shadow-lg hover:border-indigo-300 cursor-pointer">
                          <div className="flex flex-col">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                              {p.name}
                            </h4>
                            {countString && (
                              <p className="text-sm text-gray-600">
                                {countString}
                              </p>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-700 mb-6">Create your first project to start organizing your study materials</p>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Projects help you:</p>
                      <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                        <li>Organize PDFs by subject or topic</li>
                        <li>Generate quizzes, flashcards, and essays</li>
                        <li>Track your learning progress</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

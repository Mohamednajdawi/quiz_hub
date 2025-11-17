'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Plus, FolderOpen, Trash2, Info, Crown, Sparkles, TrendingUp, CheckCircle2, Zap } from 'lucide-react';
import { studentProjectsApi, type StudentProject } from '@/lib/api/studentProjects';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentHubPage() {
  return (
    <ProtectedRoute>
      <StudentHubContent />
    </ProtectedRoute>
  );
}

function StudentHubContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: projects, isLoading, error: queryError } = useQuery<StudentProject[]>({
    queryKey: ['student-projects'],
    queryFn: studentProjectsApi.listProjects,
    retry: 1,
  });

  const projectCount = projects?.length || 0;
  const isPro = user?.account_type === 'pro' || user?.subscription?.status === 'active';
  const isAtFreeTierLimit = !isPro && projectCount >= 3;
  const freeTierMax = 3;
  const projectsRemaining = isPro ? Infinity : Math.max(0, freeTierMax - projectCount);
  const progressPercentage = isPro ? 100 : Math.min(100, (projectCount / freeTierMax) * 100);

  const createMutation = useMutation({
    mutationFn: () => studentProjectsApi.createProject({ name, description }),
    onSuccess: () => {
      setName('');
      setDescription('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['student-projects'] });
      // Add success feedback (micro-interaction)
      setTimeout(() => {
        // Visual feedback handled by query invalidation
      }, 100);
    },
    onError: (e: any) => {
      const errorMsg = e?.response?.data?.detail || e?.message || String(e);
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to create project');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => studentProjectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-projects'] });
    },
    onError: (e: any) => {
      const errorMsg = e?.response?.data?.detail || e?.message || String(e);
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to delete project');
    },
  });

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FolderOpen className="w-8 h-8 text-indigo-600" />
                  Student Hub
                </h1>
                <p className="text-gray-700">Create projects and manage your study materials</p>
              </div>
              {!isPro && projectCount > 0 && (
                <div className="hidden sm:flex flex-col items-end">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {projectCount}/{freeTierMax} Projects
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        progressPercentage >= 100 
                          ? 'bg-red-500' 
                          : progressPercentage >= 66 
                          ? 'bg-yellow-500' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Indicator for Free Tier */}
            {!isPro && projectCount > 0 && projectCount < freeTierMax && (
              <div className="mb-6 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Great progress! {projectsRemaining} project{projectsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Keep organizing your study materials
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(error || queryError) && (
            <Alert type="error" className="mb-6">
              {error || (queryError instanceof Error ? queryError.message : String(queryError))}
            </Alert>
          )}

          {/* Free Tier Limit Banner - Using Loss Aversion & Scarcity */}
          {isAtFreeTierLimit && (
            <div className="mb-6 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900 mb-1 text-lg">
                        You're making great progress! 🎉
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        You've used all {freeTierMax} free projects. <span className="font-semibold">Unlock unlimited projects</span> and never worry about limits again.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-amber-200">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Unlimited Projects
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-amber-200">
                          <Zap className="w-3 h-3 text-yellow-600" />
                          200 AI Generations
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-amber-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Advanced Features
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => router.push('/pricing')}
                      className="flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Project Sidebar - Enhanced with visual feedback */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">New Project</h3>
                    <p className="text-xs text-gray-500">Start organizing your materials</p>
                  </div>
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
                      Description <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this project..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  {!isPro && projectCount > 0 && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                      <span className="font-medium">{projectsRemaining}</span> project{projectsRemaining !== 1 ? 's' : ''} remaining on free tier
                    </div>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => createMutation.mutate()}
                    disabled={!name.trim() || isAtFreeTierLimit}
                    isLoading={createMutation.isPending}
                    className="w-full shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Creating...' : 'Create Project'}
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

                    const totalContent = pdfCount + quizCount + flashcardCount + essayCount;
                    const hasContent = totalContent > 0;
                    
                    return (
                      <div key={p.id} className="group">
                        <Card className="transition-all duration-200 hover:shadow-xl hover:border-indigo-400 hover:-translate-y-0.5 border-l-4 border-l-indigo-500">
                          <div className="flex items-start justify-between gap-4">
                            <Link href={`/student-hub/${p.id}`} className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                                  hasContent 
                                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100' 
                                    : 'bg-gray-100'
                                } transition-colors group-hover:scale-110`}>
                                  <FolderOpen className={`w-6 h-6 ${
                                    hasContent ? 'text-indigo-600' : 'text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                      {p.name}
                                    </h4>
                                    {hasContent && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  {countString ? (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <span>{countString}</span>
                                    </p>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No content yet - upload a PDF to get started</p>
                                  )}
                                  {p.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${p.name}"? This will delete all PDFs, quizzes, flashcards, and essays in this project. This action cannot be undone.`)) {
                                  deleteProjectMutation.mutate(p.id);
                                }
                              }}
                              isLoading={deleteProjectMutation.isPending}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-indigo-50/20">
                  <div className="text-center py-12 px-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <FolderOpen className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to get started? 🚀</h3>
                    <p className="text-gray-700 mb-6 max-w-md mx-auto">
                      Create your first project to organize your study materials and unlock powerful learning tools
                    </p>
                    <div className="bg-white rounded-lg p-4 mb-6 max-w-md mx-auto shadow-sm border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        What you can do with projects:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-2 text-left">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Organize PDFs by subject or topic</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Generate AI-powered quizzes, flashcards, and essays</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Track your learning progress and performance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Chat with your PDFs for instant answers</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>💡 <span className="font-medium">Tip:</span> Start by creating a project for your current course or subject</p>
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

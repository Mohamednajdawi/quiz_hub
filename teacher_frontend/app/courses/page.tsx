'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, Course } from '@/lib/api/courses';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit2, FileText, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function CoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
    enabled: !authLoading && isAuthenticated, // Only run when auth is ready
    staleTime: 5 * 60 * 1000, // 5 minutes - courses don't change often
    retry: 1,
  });

  // Refetch when auth becomes ready (if query wasn't already enabled)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isLoading && !data) {
      refetch();
    }
  }, [authLoading, isAuthenticated, isLoading, data, refetch]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      coursesApi.create(data),
    onMutate: async (newCourseData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['courses']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['courses'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Create optimistic course object
        const optimisticCourse: Course = {
          id: Date.now(), // Temporary ID
          user_id: '',
          name: newCourseData.name,
          description: newCourseData.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          contents: [],
          quiz_references: [],
          flashcard_references: [],
          essay_references: [],
          mind_map_references: [],
        };
        
        return {
          ...oldData,
          projects: [optimisticCourse, ...oldData.projects],
          total_count: oldData.total_count + 1,
        };
      });
      
      return { previousData };
    },
    onSuccess: (response, variables, context) => {
      // Close modal immediately for better UX
      setShowCreateModal(false);
      setCourseName('');
      setCourseDescription('');
      
      // Refetch in background to get full course data (non-blocking)
      queryClient.invalidateQueries({ 
        queryKey: ['courses'],
        refetchType: 'active' // Only refetch if query is active
      });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['courses'], context.previousData);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const handleCreate = () => {
    if (courseName.trim()) {
      createMutation.mutate({
        name: courseName,
        description: courseDescription,
      });
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-[#38BDF8] text-lg">Loading courses...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-red-400">Error loading courses</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const courses = data?.projects || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B1221]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
              <p className="text-[#94A3B8]">Manage your courses and content</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No courses yet</h2>
              <p className="text-[#94A3B8] mb-6">Create your first course to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="glassmorphism rounded-lg p-6 border border-[#38BDF8]/20 hover:border-[#38BDF8]/40 cursor-pointer transition-all hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <BookOpen className="w-8 h-8 text-[#38BDF8]" />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement edit
                        }}
                        className="p-1 text-[#94A3B8] hover:text-[#38BDF8]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(course.id, e)}
                        className="p-1 text-[#94A3B8] hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{course.name}</h3>
                  <p className="text-[#94A3B8] text-sm mb-4 line-clamp-2">
                    {course.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{course.contents.length} PDFs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(course.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glassmorphism rounded-lg p-6 w-full max-w-md border border-[#38BDF8]/20"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Create New Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Introduction to Python"
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Course description..."
                    rows={3}
                    className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCourseName('');
                      setCourseDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-[#161F32] hover:bg-[#161F32]/80 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!courseName.trim() || createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


'use client';

import { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { PdfSidebar } from '@/components/course/PdfSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, CourseContent } from '@/lib/api/courses';
import { ArrowLeft, BarChart3, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Lazy load heavy components for better initial load performance
const ChatViewer = dynamic(() => import('@/components/course/ChatViewer').then(mod => ({ default: mod.ChatViewer })), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#161F32] rounded-lg">
      <div className="text-[#38BDF8] text-sm">Loading chat...</div>
    </div>
  ),
  ssr: false,
});

const GenerationPanel = dynamic(() => import('@/components/course/GenerationPanel').then(mod => ({ default: mod.GenerationPanel })), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#161F32] rounded-lg">
      <div className="text-[#38BDF8] text-sm">Loading panel...</div>
    </div>
  ),
  ssr: false,
});

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<CourseContent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getById(courseId),
    enabled: !!courseId && !authLoading && isAuthenticated, // Only run when auth is ready
    staleTime: 2 * 60 * 1000, // 2 minutes - course data changes less frequently
    retry: 1,
  });

  // Auto-select first PDF when course loads
  useEffect(() => {
    if (course && course.contents.length > 0 && !selectedPdf) {
      setSelectedPdf(course.contents[0]);
    }
  }, [course, selectedPdf]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-[#38BDF8] text-lg">Loading course...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0B1221]">
          <Navigation />
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-red-400">Course not found</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B1221]">
        <Navigation />
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
                  aria-label="Open PDF sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{course.name}</h1>
              </div>
              {course.description && (
                <p className="text-sm sm:text-base text-[#94A3B8]">{course.description}</p>
              )}
            </div>
            <button
              onClick={() => router.push(`/courses/${courseId}/results`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors text-sm sm:text-base"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">View Results</span>
              <span className="sm:hidden">Results</span>
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#0B1221] border-r border-[#38BDF8]/20 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <PdfSidebar 
                    courseId={courseId} 
                    contents={course.contents}
                    onPdfSelect={(pdf) => {
                      setSelectedPdf(pdf);
                      setIsSidebarOpen(false);
                    }}
                    selectedPdf={selectedPdf}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-12rem)]">
            {/* Left Column - PDFs (hidden on mobile, shown in drawer) */}
            <div className="hidden lg:block lg:col-span-2">
              <PdfSidebar 
                courseId={courseId} 
                contents={course.contents}
                onPdfSelect={setSelectedPdf}
                selectedPdf={selectedPdf}
              />
            </div>

            {/* Middle Column - Chat/Viewer */}
            <div className="col-span-1 lg:col-span-7 min-h-[400px] lg:min-h-0">
              <ChatViewer 
                courseId={courseId} 
                contents={course.contents}
                selectedPdf={selectedPdf}
                onPdfDeselect={() => setSelectedPdf(null)}
              />
            </div>

            {/* Right Column - Generation */}
            <div className="col-span-1 lg:col-span-3 min-h-[400px] lg:min-h-0">
              <GenerationPanel
                courseId={courseId}
                quizReferences={course.quiz_references}
                flashcardReferences={course.flashcard_references}
                essayReferences={course.essay_references}
                selectedContentId={selectedPdf?.id}
                contents={course.contents}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


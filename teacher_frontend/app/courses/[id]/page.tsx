'use client';

import { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { PdfSidebar } from '@/components/course/PdfSidebar';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, CourseContent } from '@/lib/api/courses';
import { ArrowLeft, BarChart3 } from 'lucide-react';
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
  const [selectedPdf, setSelectedPdf] = useState<CourseContent | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getById(courseId),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes - course data changes less frequently
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

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-[#94A3B8]">{course.description}</p>
              )}
            </div>
            <button
              onClick={() => router.push(`/courses/${courseId}/results`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              View Results
            </button>
          </div>

          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
            {/* Left Column - PDFs (20%) */}
            <div className="col-span-12 lg:col-span-2">
              <PdfSidebar 
                courseId={courseId} 
                contents={course.contents}
                onPdfSelect={setSelectedPdf}
                selectedPdf={selectedPdf}
              />
            </div>

            {/* Middle Column - Chat/Viewer (60%) */}
            <div className="col-span-12 lg:col-span-7">
              <ChatViewer 
                courseId={courseId} 
                contents={course.contents}
                selectedPdf={selectedPdf}
                onPdfDeselect={() => setSelectedPdf(null)}
              />
            </div>

            {/* Right Column - Generation (20%) */}
            <div className="col-span-12 lg:col-span-3">
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


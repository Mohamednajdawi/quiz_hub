'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, CourseContent } from '@/lib/api/courses';
import { Upload, FileText, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface PdfSidebarProps {
  courseId: number;
  contents: CourseContent[];
  onPdfSelect?: (content: CourseContent) => void;
  selectedPdf?: CourseContent | null;
}

export function PdfSidebar({ courseId, contents, onPdfSelect, selectedPdf }: PdfSidebarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => coursesApi.uploadPdf(courseId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (contentId: number) => coursesApi.deleteContent(courseId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      uploadMutation.mutate(Array.from(files));
    }
  };

  const handleDelete = (contentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this PDF?')) {
      deleteMutation.mutate(contentId);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="glassmorphism rounded-lg p-4 border border-[#38BDF8]/20 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">PDFs</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] rounded transition-colors disabled:opacity-50"
          title="Upload PDF"
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto space-y-2">
        {contents.length === 0 ? (
          <div className="text-center py-8 text-[#94A3B8] text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No PDFs uploaded</p>
            <p className="text-xs mt-1">Click upload to add PDFs</p>
          </div>
        ) : (
          contents.map((content) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onPdfSelect?.(content)}
              className={`p-3 bg-[#161F32] rounded border transition-colors group cursor-pointer ${
                selectedPdf?.id === content.id
                  ? 'border-[#38BDF8] bg-[#38BDF8]/10'
                  : 'border-[#38BDF8]/10 hover:border-[#38BDF8]/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate" title={content.name}>
                    {content.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                    <span>{formatFileSize(content.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(content.uploaded_at), 'MMM d')}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(content.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isUploading && (
        <div className="mt-4 p-3 bg-[#161F32] rounded border border-[#38BDF8]/30">
          <div className="flex items-center gap-2 text-sm text-[#38BDF8]">
            <div className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        </div>
      )}
    </div>
  );
}


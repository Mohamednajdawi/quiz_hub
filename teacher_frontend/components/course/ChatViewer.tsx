'use client';

import { useState, useEffect, memo } from 'react';
import { CourseContent, coursesApi } from '@/lib/api/courses';
import { MessageSquare, FileText, X } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface ChatViewerProps {
  courseId: number;
  contents: CourseContent[];
  selectedPdf?: CourseContent | null;
  onPdfDeselect?: () => void;
}

export const ChatViewer = memo(function ChatViewer({ courseId, contents, selectedPdf, onPdfDeselect }: ChatViewerProps) {
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'viewer'>('chat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Handle external PDF selection from sidebar - open chat instead of viewer
  useEffect(() => {
    if (selectedPdf && selectedPdf.id !== selectedContent?.id) {
      setSelectedContent(selectedPdf);
      setViewMode('chat'); // Always open chat when clicking PDF from sidebar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPdf]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Chat with all PDFs in the course, or specific PDF if selected
      const contentId = selectedContent?.id;
      const response = await coursesApi.chatWithPdfs(courseId, userMessage, contentId);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
        },
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get response. Please try again.';
      
      // Check if it's a generation limit error (402)
      const isLimitError = error.response?.status === 402 || error.status === 402 || errorMessage.includes('free generations') || errorMessage.includes('upgrade');
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isLimitError 
            ? `⚠️ ${errorMessage}`
            : `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPdf = async (content: CourseContent) => {
    setSelectedContent(content);
    setViewMode('viewer');
    setPdfError(null);
    
    // Clean up previous blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      // Fetch PDF with authentication
      const response = await apiClient.get(
        `/student-projects/${courseId}/content/${content.id}/view`,
        {
          responseType: 'blob',
        }
      );

      // Create blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      setPdfError(error.message || 'Failed to load PDF');
    }
  };

  // Clean up blob URL on unmount or when content changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#38BDF8]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'chat'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (contents.length > 0 && !selectedContent) {
                setSelectedContent(contents[0]);
                setViewMode('viewer');
                handleViewPdf(contents[0]);
              } else if (selectedContent) {
                setViewMode('viewer');
                handleViewPdf(selectedContent);
              }
            }}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'viewer'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
        {selectedContent && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#94A3B8]">{selectedContent.name}</span>
            <button
              onClick={() => {
                setSelectedContent(null);
                setViewMode('chat');
                onPdfDeselect?.();
              }}
              className="p-1 text-[#94A3B8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-[#94A3B8]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation about your PDFs</p>
                    <p className="text-sm mt-2">Ask questions about the uploaded content</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#38BDF8] text-[#0B1221]'
                          : 'bg-[#161F32] text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#161F32] p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-[#38BDF8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#38BDF8]/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about your PDFs..."
                  className="flex-1 px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {pdfError ? (
              <div className="h-full flex items-center justify-center text-red-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Error loading PDF</p>
                  <p className="text-sm mt-2">{pdfError}</p>
                </div>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full"
                title={selectedContent?.name}
              />
            ) : selectedContent ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading PDF...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a PDF to view</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});


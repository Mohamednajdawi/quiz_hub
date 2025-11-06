'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Send, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';
import { studentProjectsApi, type StudentProject, type ProjectContent } from '@/lib/api/studentProjects';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contentId?: number; // Track which PDF was used for this message
}

export default function ProjectChatPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          </div>
        </Layout>
      }>
        <ProjectChatContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function ProjectChatContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = parseInt(params.id as string, 10);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Get contentId from URL query parameter if present
  const urlContentId = searchParams.get('contentId');
  const initialContentId = urlContentId ? parseInt(urlContentId, 10) : null;
  const [selectedContentId, setSelectedContentId] = useState<number | null>(initialContentId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: project, isLoading: projectLoading } = useQuery<StudentProject>({
    queryKey: ['student-project', projectId],
    queryFn: () => studentProjectsApi.getProject(projectId),
  });

  const { data: contents, isLoading: contentsLoading } = useQuery<ProjectContent[]>({
    queryKey: ['student-project-contents', projectId],
    queryFn: () => studentProjectsApi.listContents(projectId),
  });

  const chatMutation = useMutation({
    mutationFn: (msg: string) => studentProjectsApi.chatWithPDFs(projectId, msg, selectedContentId || undefined),
    onSuccess: (data) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        contentId: selectedContentId || undefined,
      };
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        contentId: selectedContentId || undefined,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setMessage('');
      inputRef.current?.focus();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to send message';
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || chatMutation.isPending) return;
    chatMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = (contentId: number | null) => {
    setSelectedContentId(contentId);
    setMessages([]); // Clear messages when switching PDFs
  };

  const pdfs = contents?.filter(c => c.content_type === 'pdf') || [];
  const pdfCount = pdfs.length;
  const selectedPdf = selectedContentId ? pdfs.find(p => p.id === selectedContentId) : null;

  if (projectLoading || contentsLoading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/student-hub/${projectId}`} 
              className="inline-flex items-center text-sm text-gray-700 hover:text-indigo-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Chat with PDFs</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {project?.name} • {pdfCount} PDF{pdfCount !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {/* PDF Selector */}
          {pdfCount > 0 && (
            <Card className="mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleContentChange(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedContentId === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  All PDFs
                </button>
                {pdfs.map((pdf) => (
                  <button
                    key={pdf.id}
                    onClick={() => handleContentChange(pdf.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedContentId === pdf.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{pdf.name}</span>
                  </button>
                ))}
              </div>
              {selectedPdf && (
                <p className="text-xs text-gray-500 mt-2">
                  Chatting with: <span className="font-medium">{selectedPdf.name}</span>
                </p>
              )}
              {selectedContentId === null && pdfCount > 1 && (
                <p className="text-xs text-gray-500 mt-2">
                  Chatting with all {pdfCount} PDFs in this project
                </p>
              )}
            </Card>
          )}

          {/* Chat Messages */}
          <div className="mb-4" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
            <Card className="h-full">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                      <p className="text-gray-600 max-w-md">
                        Ask questions about your PDFs. I'll answer based on the content in your project.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.role === 'user' ? 'text-indigo-100' : 'text-gray-500'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </Card>
        </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedPdf
                  ? `Ask a question about ${selectedPdf.name}...`
                  : 'Ask a question about your PDFs...'
              }
              disabled={chatMutation.isPending || pdfCount === 0}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!message.trim() || chatMutation.isPending || pdfCount === 0}
              size="lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {pdfCount === 0 && (
            <Alert type="error" className="mt-4">
              No PDFs found in this project. Upload PDFs to start chatting.
            </Alert>
          )}
        </div>
      </div>
    </Layout>
  );
}


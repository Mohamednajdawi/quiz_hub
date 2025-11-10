'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { quizApi } from '@/lib/api/quiz';
import { QuizQuestion } from '@/lib/types';
import { Share2, Copy, Check, BarChart3, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function QuizDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const quizId = parseInt(params.id as string);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<QuizQuestion[]>([]);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(quizId),
    enabled: !isNaN(quizId),
  });

  // Initialize editing questions when quiz loads or edit mode is enabled
  useEffect(() => {
    if (quiz && isEditMode) {
      setEditingQuestions([...quiz.questions]);
    }
  }, [quiz, isEditMode]);

  // Check if user owns this quiz - quizzes with IDs can be edited
  const canEdit = quiz && user && quiz.questions.length > 0 && quiz.questions.some(q => q.id !== undefined);

  // Try to get existing share code if quiz has one
  const { data: existingCodeData } = useQuery({
    queryKey: ['quiz-share-code', quizId],
    queryFn: async () => {
      try {
        return await quizApi.getShareCode(quizId);
      } catch (e) {
        // Silently fail - user might not have permission or code doesn't exist
        return null;
      }
    },
    enabled: !isNaN(quizId) && !!quiz,
    retry: false,
  });

  useEffect(() => {
    if (existingCodeData?.share_code) {
      setShareCode(existingCodeData.share_code);
    }
  }, [existingCodeData]);

  const generateCodeMutation = useMutation({
    mutationFn: () => quizApi.generateShareCode(quizId),
    onSuccess: (data) => {
      setShareCode(data.share_code);
    },
    onError: (error: any) => {
      console.error('Error generating share code:', error);
      alert(error?.response?.data?.detail || error?.message || 'Failed to generate share code');
    },
  });

  const copyToClipboard = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Edit mode handlers
  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, question, options, rightOption }: {
      questionId: number;
      question: string;
      options: string[];
      rightOption: number | string;
    }) => quizApi.updateQuestion(quizId, questionId, question, options, rightOption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: ({ question, options, rightOption }: {
      question: string;
      options: string[];
      rightOption: number | string;
    }) => quizApi.addQuestion(quizId, question, options, rightOption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      // Add new question to editing state
      if (quiz) {
        queryClient.invalidateQueries({ queryKey: ['quiz', quizId] }).then(() => {
          // Reset edit mode to reload questions
          setIsEditMode(false);
          setTimeout(() => setIsEditMode(true), 100);
        });
      }
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => quizApi.deleteQuestion(quizId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      // Remove from editing state
      if (quiz) {
        queryClient.invalidateQueries({ queryKey: ['quiz', quizId] }).then(() => {
          setIsEditMode(false);
          setTimeout(() => setIsEditMode(true), 100);
        });
      }
    },
  });

  const handleEditQuestion = (index: number, field: 'question' | 'options' | 'right_option', value: any) => {
    const updated = [...editingQuestions];
    if (field === 'options') {
      updated[index].options = value;
    } else if (field === 'right_option') {
      updated[index].right_option = value;
    } else {
      updated[index].question = value;
    }
    setEditingQuestions(updated);
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...editingQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setEditingQuestions(updated);
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...editingQuestions];
    updated[questionIndex].options.push('');
    setEditingQuestions(updated);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...editingQuestions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      // Adjust right_option if needed
      const currentRight = parseInt(String(updated[questionIndex].right_option));
      if (currentRight >= optionIndex) {
        updated[questionIndex].right_option = Math.max(0, currentRight - 1);
      }
      setEditingQuestions(updated);
    }
  };

  const handleSaveQuestion = async (questionIndex: number) => {
    const question = editingQuestions[questionIndex];
    if (!question.id) {
      // New question - add it
      await addQuestionMutation.mutateAsync({
        question: question.question,
        options: question.options.filter(opt => opt.trim() !== ''),
        rightOption: question.right_option,
      });
    } else {
      // Existing question - update it
      await updateQuestionMutation.mutateAsync({
        questionId: question.id,
        question: question.question,
        options: question.options.filter(opt => opt.trim() !== ''),
        rightOption: question.right_option,
      });
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      options: ['', ''],
      right_option: 0,
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
  };

  const handleDeleteQuestion = async (questionIndex: number) => {
    const question = editingQuestions[questionIndex];
    if (question.id) {
      if (confirm('Are you sure you want to delete this question?')) {
        await deleteQuestionMutation.mutateAsync(question.id);
      }
    } else {
      // Remove from local state if it's a new question
      const updated = editingQuestions.filter((_, i) => i !== questionIndex);
      setEditingQuestions(updated);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingQuestions([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !quiz) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <Alert type="error">Quiz not found</Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{quiz.topic}</h1>
              {canEdit && (
                <div>
                  {!isEditMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Quiz
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-700">
              {quiz.category} • {quiz.subcategory}
            </div>
          </div>

          {!isEditMode ? (
            // View Mode
            <div className="space-y-6 mb-6">
              {quiz.questions.map((question, index) => (
                <div key={question.id || index} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Question {index + 1}: {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      // Handle right_option as both number and string
                      const rightOptionStr = String(question.right_option);
                      const rightOptionNum = parseInt(rightOptionStr);
                      const isCorrect = !isNaN(rightOptionNum) 
                        ? rightOptionNum === optIndex 
                        : rightOptionStr.toLowerCase() === String.fromCharCode(97 + optIndex);
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg ${
                            isCorrect
                              ? 'bg-green-50 border-2 border-green-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${
                                isCorrect
                                  ? 'text-green-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {isCorrect && '✓ '}
                              {option}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6 mb-6">
              {editingQuestions.map((question, index) => (
                <Card key={question.id || `new-${index}`} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {index + 1}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                      disabled={editingQuestions.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Question"
                      value={question.question}
                      onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={(() => {
                                const rightOptionStr = String(question.right_option);
                                const rightOptionNum = parseInt(rightOptionStr);
                                return !isNaN(rightOptionNum) ? rightOptionNum === optIndex : false;
                              })()}
                              onChange={() => handleEditQuestion(index, 'right_option', optIndex)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1"
                            />
                            {question.options.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveOption(index, optIndex)}
                                className="text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(index)}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveQuestion(index)}
                      isLoading={updateQuestionMutation.isPending || addQuestionMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Question
                    </Button>
                  </div>
                </Card>
              ))}

              <Card className="p-6 border-dashed border-2 border-gray-300">
                <Button
                  variant="outline"
                  onClick={handleAddQuestion}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Question
                </Button>
              </Card>
            </div>
          )}

          {/* Share Code Section */}
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share This Quiz
                </h3>
                {shareCode ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-indigo-900 font-mono">{shareCode}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-indigo-700">
                      Share this code with others to let them take your quiz
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-indigo-700 mb-3">
                      Generate a 6-digit code to share this quiz with others
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => generateCodeMutation.mutate()}
                      isLoading={generateCodeMutation.isPending}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Generate Share Code
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {shareCode && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/quizzes/${quizId}/results`)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Results
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/quizzes')}>
              Back to Quizzes
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                router.push(`/quizzes/take?data=${encodeURIComponent(JSON.stringify(quiz))}`)
              }
            >
              Take This Quiz
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default function QuizDetailPage() {
  return (
    <ProtectedRoute>
      <QuizDetailPageContent />
    </ProtectedRoute>
  );
}


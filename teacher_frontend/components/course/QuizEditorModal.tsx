'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Edit3, PlusCircle, Save, RotateCcw } from 'lucide-react';
import { quizApi, QuizDetail, QuizQuestion } from '@/lib/api/quiz';

interface QuizEditorModalProps {
  topicId: number;
  onClose: () => void;
}

interface EditFormState {
  question: string;
  options: string[];
  rightOptionIndex: number;
}

export function QuizEditorModal({ topicId, onClose }: QuizEditorModalProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<QuizDetail>({
    queryKey: ['quiz-detail', topicId],
    queryFn: () => quizApi.getQuiz(topicId),
    enabled: !!topicId,
  });

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const newQuestionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || editingId !== null) return;
    // No-op: we lazily populate editForm when user chooses a question
  }, [data, editingId]);

  const resetEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const getCorrectIndex = (question: QuizQuestion) => {
    if (typeof question.right_option === 'number') {
      return question.right_option;
    }
    const raw = String(question.right_option).trim().toLowerCase();
    if (/^\d+$/.test(raw)) {
      return parseInt(raw, 10);
    }
    if (raw.length === 1 && raw >= 'a' && raw <= 'z') {
      return raw.charCodeAt(0) - 'a'.charCodeAt(0);
    }
    return 0;
  };

  const startEdit = (question: QuizQuestion) => {
    const index = getCorrectIndex(question);
    setEditingId(question.id);
    setEditForm({
      question: question.question,
      options: [...question.options],
      rightOptionIndex: Math.min(Math.max(index, 0), Math.max(question.options.length - 1, 0)),
    });
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({
      question: '',
      options: ['', '', '', ''],
      rightOptionIndex: 0,
    });
  };

  // When creating a new question, scroll to its editor card
  useEffect(() => {
    if (editingId === 'new' && newQuestionRef.current) {
      newQuestionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingId]);

  const updateQuestionMutation = useMutation({
    mutationFn: async (params: { id: number; form: EditFormState }) => {
      const { id, form } = params;
      const trimmedOptions = form.options.map((o) => o.trim()).filter((o) => o.length > 0);
      const rightIndex = Math.min(
        Math.max(form.rightOptionIndex, 0),
        Math.max(trimmedOptions.length - 1, 0)
      );
      if (!form.question.trim() || trimmedOptions.length < 2) {
        throw new Error('Please provide a question and at least two answer options.');
      }
      return quizApi.updateQuestion(topicId, id, form.question.trim(), trimmedOptions, rightIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-detail', topicId] });
      resetEdit();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || err?.message || 'Failed to update question.');
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (form: EditFormState) => {
      const trimmedOptions = form.options.map((o) => o.trim()).filter((o) => o.length > 0);
      const rightIndex = Math.min(
        Math.max(form.rightOptionIndex, 0),
        Math.max(trimmedOptions.length - 1, 0)
      );
      if (!form.question.trim() || trimmedOptions.length < 2) {
        throw new Error('Please provide a question and at least two answer options.');
      }
      return quizApi.addQuestion(topicId, form.question.trim(), trimmedOptions, rightIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-detail', topicId] });
      resetEdit();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || err?.message || 'Failed to add question.');
    },
  });

  const isSaving = updateQuestionMutation.isPending || addQuestionMutation.isPending;

  const handleSave = () => {
    if (!editForm || editingId === null) return;
    if (editingId === 'new') {
      addQuestionMutation.mutate(editForm);
    } else {
      updateQuestionMutation.mutate({ id: editingId, form: editForm });
    }
  };

  const renderQuestionCard = (question: QuizQuestion, index: number) => {
    const isEditing = editingId === question.id;
    if (isEditing && editForm) {
      return (
        <div
          key={question.id}
          className="bg-[#161F32] rounded-lg border border-[#38BDF8]/40 p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-[#94A3B8]">
              Editing question {index + 1}
            </span>
            <button
              onClick={resetEdit}
              className="text-xs text-[#94A3B8] hover:text-white inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Cancel
            </button>
          </div>
          <textarea
            className="w-full px-3 py-2 bg-[#0B1221] border border-[#38BDF8]/30 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
            rows={3}
            value={editForm.question}
            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
            placeholder="Enter the question text"
          />
          <div className="space-y-2">
            {editForm.options.map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={editForm.rightOptionIndex === optIndex}
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      rightOptionIndex: optIndex,
                    })
                  }
                  className="text-[#38BDF8]"
                />
                <input
                  className="flex-1 px-3 py-1.5 bg-[#0B1221] border border-[#38BDF8]/30 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  value={opt}
                  onChange={(e) => {
                    const next = [...editForm.options];
                    next[optIndex] = e.target.value;
                    setEditForm({ ...editForm, options: next });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setEditForm({
                  ...editForm,
                  options: [...editForm.options, ''],
                })
              }
              className="text-xs text-[#38BDF8] hover:text-[#7dd3fc]"
            >
              + Add option
            </button>
          </div>
        </div>
      );
    }

    const correctIndex = getCorrectIndex(question);

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#161F32] rounded-lg border border-[#38BDF8]/20 p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0B1221] text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/40">
            {index + 1}
          </span>
          <button
            onClick={() => startEdit(question)}
            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#38BDF8]"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <p className="text-sm text-white">{question.question}</p>
        <div className="mt-2 space-y-1">
          {question.options.map((opt, optIndex) => {
            const isCorrect = optIndex === correctIndex;
            return (
              <div
                key={optIndex}
                className={`px-3 py-2 rounded text-xs border ${
                  isCorrect
                    ? 'border-green-400/60 bg-green-500/10 text-green-200'
                    : 'border-[#38BDF8]/20 bg-[#0B1221] text-[#94A3B8]'
                }`}
              >
                <span className="font-semibold mr-2 text-xs">
                  {String.fromCharCode(65 + optIndex)}.
                </span>
                {opt}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderNewQuestionCard = () => {
    if (editingId !== 'new' || !editForm) return null;
    return (
      <div
        ref={newQuestionRef}
        className="bg-[#020617] rounded-lg border border-dashed border-[#38BDF8]/40 p-4 space-y-3"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-[#94A3B8]">
            New multiple‑choice question
          </span>
          <button
            onClick={resetEdit}
            className="text-xs text-[#94A3B8] hover:text-white inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Cancel
          </button>
        </div>
        <textarea
          className="w-full px-3 py-2 bg-[#0B1221] border border-[#38BDF8]/30 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
          rows={3}
          value={editForm.question}
          onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
          placeholder="Enter the question text"
        />
        <div className="space-y-2">
          {editForm.options.map((opt, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2">
              <input
                type="radio"
                name="new-correct"
                checked={editForm.rightOptionIndex === optIndex}
                onChange={() =>
                  setEditForm({
                    ...editForm,
                    rightOptionIndex: optIndex,
                  })
                }
                className="text-[#38BDF8]"
              />
              <input
                className="flex-1 px-3 py-1.5 bg-[#0B1221] border border-[#38BDF8]/30 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                value={opt}
                onChange={(e) => {
                  const next = [...editForm.options];
                  next[optIndex] = e.target.value;
                  setEditForm({ ...editForm, options: next });
                }}
                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setEditForm({
                ...editForm,
                options: [...editForm.options, ''],
              })
            }
            className="text-xs text-[#38BDF8] hover:text-[#7dd3fc]"
          >
            + Add option
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassmorphism rounded-lg border border-[#38BDF8]/30 p-6 w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Quiz questions</h2>
            {data && (
              <p className="text-xs text-[#94A3B8] mt-1">
                {data.topic} • {data.category} • {data.subcategory}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#020617] text-[#94A3B8] hover:text-white hover:bg-[#111827] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-[#38BDF8]">
              <div className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
              Loading quiz…
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-red-400">
              Failed to load quiz questions. Please try again or check your permissions.
            </p>
          </div>
        )}

        {data && !isLoading && !error && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#94A3B8]">
                {data.questions.length} question{data.questions.length !== 1 ? 's' : ''} in this quiz.
              </p>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] text-xs font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                Add MCQ question
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {data.questions.map((q, idx) => renderQuestionCard(q, idx))}
              {renderNewQuestionCard()}
            </div>

            {editForm && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetEdit}
                  className="px-4 py-2 text-xs rounded bg-[#161F32] hover:bg-[#161F32]/80 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-4 py-2 text-xs rounded bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#0B1221] border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}



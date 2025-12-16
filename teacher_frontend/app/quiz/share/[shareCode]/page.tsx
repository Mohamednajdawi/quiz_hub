'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizApi } from '@/lib/api/quiz';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizQuestion {
  question: string;
  options: string[];
  right_option: number | string;
}

interface QuizData {
  quiz_id: number;
  topic: string;
  category: string;
  subcategory: string;
  difficulty: string;
  questions: QuizQuestion[];
}

export default function SharedQuizPage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;
  
  const [participantName, setParticipantName] = useState('');
  const [participantLastName, setParticipantLastName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Fetch quiz by share code
  const { data: quiz, isLoading, error } = useQuery<QuizData>({
    queryKey: ['shared-quiz', shareCode],
    queryFn: () => quizApi.getQuizByShareCode(shareCode),
    enabled: !!shareCode && shareCode.length === 6,
  });

  // Initialize answers array when quiz loads
  useEffect(() => {
    if (quiz && quiz.questions) {
      setUserAnswers(new Array(quiz.questions.length).fill(-1));
    }
  }, [quiz]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!startTime) throw new Error('Start time not set');
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      return quizApi.submitSharedQuiz(
        shareCode,
        participantName,
        participantLastName,
        participantEmail,
        userAnswers,
        timeTaken
      );
    },
    onSuccess: (data) => {
      setSubmissionResult(data);
      setSubmitted(true);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || error?.message || 'Failed to submit quiz. Please try again.');
    },
  });

  const handleStartQuiz = () => {
    if (!participantName.trim() || !participantLastName.trim() || !participantEmail.trim()) {
      alert('Please fill in all fields (Name, Last Name, and Email)');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (userAnswers.some((ans) => ans === -1)) {
      if (!confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#38BDF8] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Quiz not found</p>
          <p className="text-[#94A3B8] mb-4">The share code may be invalid or the quiz may have been deleted.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#38BDF8] text-[#0B1221] rounded hover:bg-[#38BDF8]/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Participant info form (before starting quiz)
  if (!startTime) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-8 max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-white mb-2">{quiz.topic}</h1>
          <p className="text-[#94A3B8] mb-6">
            {quiz.category} • {quiz.subcategory} • {quiz.difficulty}
          </p>
          <p className="text-white mb-6">Please provide your information to start the quiz:</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">First Name *</label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your first name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Last Name *</label>
              <input
                type="text"
                value={participantLastName}
                onChange={(e) => setParticipantLastName(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your last name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email *</label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your email"
              />
            </div>
            
            <button
              onClick={handleStartQuiz}
              className="w-full py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
            >
              Start Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Results screen (after submission)
  if (submitted && submissionResult) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-8 max-w-2xl w-full"
        >
          <div className="text-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-[#38BDF8] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Quiz Submitted!</h1>
            <p className="text-[#94A3B8]">Your results have been recorded</p>
          </div>

          <div className="bg-[#161F32] rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-[#94A3B8]">Score</p>
                <p className="text-2xl font-bold text-white">
                  {submissionResult.score} / {submissionResult.total_questions}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Percentage</p>
                <p className="text-2xl font-bold text-[#38BDF8]">
                  {submissionResult.percentage_score.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {submissionResult.ai_feedback && (
            <div className="bg-[#161F32] rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">AI Feedback</h2>
              <p className="text-[#94A3B8] whitespace-pre-wrap">{submissionResult.ai_feedback}</p>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  // Quiz taking screen
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allAnswered = userAnswers.every((ans) => ans !== -1);

  return (
    <div className="min-h-screen bg-[#0B1221] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{quiz.topic}</h1>
              <p className="text-sm text-[#94A3B8]">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#94A3B8]">Participant</p>
              <p className="text-white font-semibold">{participantName} {participantLastName}</p>
            </div>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6 mb-4"
        >
          <h2 className="text-lg font-semibold text-white mb-6">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                className={`w-full p-4 text-left rounded border transition-colors ${
                  selectedAnswer === index
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white'
                    : 'bg-[#161F32] border-[#38BDF8]/20 text-[#94A3B8] hover:border-[#38BDF8]/40'
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#161F32]/80"
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="px-6 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded disabled:opacity-50 flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


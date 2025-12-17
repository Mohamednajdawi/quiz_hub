'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { flashcardsApi, FlashcardTopicResponse } from '@/lib/api/flashcards';
import { Loader2, XCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SharedFlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = Number(params.topicId as string);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const {
    data,
    isLoading,
    error,
  } = useQuery<FlashcardTopicResponse>({
    queryKey: ['shared-flashcards', topicId],
    queryFn: () => flashcardsApi.getByTopic(topicId),
    enabled: !!topicId && !Number.isNaN(topicId),
  });

  const handleStart = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in all fields (First Name, Last Name, and Email).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    setHasStarted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#38BDF8] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Flashcards not found</p>
          <p className="text-[#94A3B8] mb-4">
            The link may be invalid or these flashcards may have been removed.
          </p>
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

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[#38BDF8]" />
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{data.topic}</h1>
              <p className="text-[#94A3B8] text-sm">
                {data.category} {data.subcategory ? `• ${data.subcategory}` : ''}
              </p>
            </div>
          </div>

          <p className="text-white mb-6">
            Please provide your information to view this flashcard set:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-white focus:outline-none focus:border-[#38BDF8]"
                placeholder="Enter your email"
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
            >
              View Flashcards
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1221] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{data.topic}</h1>
              <p className="text-sm text-[#94A3B8]">
                {data.category} {data.subcategory ? `• ${data.subcategory}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#94A3B8]">Participant</p>
              <p className="text-white font-semibold">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-[#94A3B8]">{email}</p>
            </div>
          </div>
        </div>

        {/* Flashcards viewer with flip animation, one card at a time */}
        <div className="glassmorphism rounded-lg border border-[#38BDF8]/20 p-6 space-y-4">
          {data.cards.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#94A3B8]">
                  Card {currentIndex + 1} of {data.cards.length} • Importance:{' '}
                  {data.cards[currentIndex].importance || 'medium'}
                </p>
                <p className="text-xs text-[#94A3B8]">Click card to flip</p>
              </div>

              {(() => {
                const card = data.cards[currentIndex];
                const isFlipped = !!flippedCards[currentIndex];
                return (
                  <div className="flex justify-center">
                    <div
                      className="relative w-full max-w-xl cursor-pointer"
                      onClick={() =>
                        setFlippedCards((prev) => ({
                          ...prev,
                          [currentIndex]: !prev[currentIndex],
                        }))
                      }
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={isFlipped ? 'back' : 'front'}
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="w-full min-h-[220px] rounded-xl border border-[#38BDF8]/40 bg-gradient-to-br from-[#020617] via-[#020617] to-[#1e293b] p-6 shadow-lg shadow-[#0f172a]/80 hover:border-[#38BDF8] transition-colors flex flex-col justify-center"
                        >
                          <p className="text-xs uppercase tracking-wide text-[#38BDF8] mb-3">
                            {isFlipped ? 'Back' : 'Front'}
                          </p>
                          <p className="text-base text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
                            {isFlipped ? card.back : card.front}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => Math.max(prev - 1, 0));
                  }}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-[#161F32] border border-[#38BDF8]/20 rounded text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161F32]/80 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentIndex((prev) =>
                      Math.min(prev + 1, data.cards.length - 1)
                    );
                  }}
                  disabled={currentIndex === data.cards.length - 1}
                  className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] text-xs font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B1221] font-semibold rounded transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}



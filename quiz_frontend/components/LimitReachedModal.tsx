'use client';

import { useRouter } from 'next/navigation';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Crown, Sparkles } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType?: 'quiz' | 'flashcard' | 'essay' | 'content';
}

export function LimitReachedModal({ isOpen, onClose, contentType = 'content' }: LimitReachedModalProps) {
  const router = useRouter();
  
  const contentTypeLabel = contentType === 'quiz' ? 'quiz' : contentType === 'flashcard' ? 'flashcard' : contentType === 'essay' ? 'essay' : 'content';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${contentTypeLabel.charAt(0).toUpperCase() + contentTypeLabel.slice(1)} Limit Reached`}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              router.push('/pricing');
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Unlock Unlimited Access
          </Button>
        </>
      }
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          You've reached your {contentTypeLabel} limit
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Unlock unlimited access to create as many quizzes, flashcards, and essays as you need.
        </p>
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-indigo-900 mb-2">Upgrade to Pro and get:</p>
          <ul className="text-left text-sm text-indigo-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Unlimited AI generations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Unlimited projects</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Export to PDF and Anki</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Advanced analytics</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}


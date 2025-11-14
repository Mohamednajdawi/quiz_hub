'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { 
  Sparkles, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  ArrowRight, 
  ArrowLeft,
  X,
  CheckCircle2
} from 'lucide-react';

interface WelcomeOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_STORAGE_KEY = 'quizhub_onboarding_completed';

export function WelcomeOnboarding({ isOpen, onClose }: WelcomeOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to Quiz Hub!',
      description: 'Transform your study materials into interactive learning tools with AI-powered quizzes, flashcards, and essay questions.',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Get started in 3 simple steps:
          </p>
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Upload a PDF or paste a URL</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Generate quizzes, flashcards, or essays</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Study smarter with AI-powered feedback</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: FileText,
      title: 'Generate Content Instantly',
      description: 'Create study materials from any PDF or web article in seconds.',
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-900 font-medium mb-2">How it works:</p>
            <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
              <li>Go to Quizzes, Flashcards, or Essays</li>
              <li>Upload a PDF or paste a URL</li>
              <li>Choose your preferences (difficulty, number of questions)</li>
              <li>Click Generate and wait a few seconds</li>
            </ol>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> You have 20 free AI generations to start. Each quiz, flashcard set, or essay uses 1 generation.
          </p>
        </div>
      ),
    },
    {
      icon: GraduationCap,
      title: 'Organize with Student Hub',
      description: 'Keep all your study materials organized in one place.',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-900 font-medium mb-2">Student Hub features:</p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Create projects for different subjects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Upload PDFs to projects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Generate content from project PDFs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Chat with your PDFs using AI</span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Free tier:</strong> Up to 3 projects. Upgrade to Pro for unlimited projects.
          </p>
        </div>
      ),
    },
    {
      icon: BarChart3,
      title: 'Track Your Progress',
      description: 'Monitor your learning and identify areas for improvement.',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-900 font-medium mb-2">Dashboard insights:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>View your quiz performance over time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>See average scores by category</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Get AI feedback on concepts you missed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Review your attempt history</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      title: "You're All Set!",
      description: 'Ready to start learning smarter?',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Let's create your first quiz!
            </p>
            <p className="text-sm text-gray-600">
              Head to the Quizzes page to get started, or explore Student Hub to organize your materials.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                handleComplete();
                router.push('/quizzes');
              }}
              className="w-full"
            >
              Create Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleComplete();
                router.push('/student-hub');
              }}
              className="w-full"
            >
              Student Hub
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    // Mark onboarding as completed
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!isOpen) return null;

  return (
    <div className={isOpen ? 'fixed inset-0 z-50 overflow-y-auto' : 'hidden'}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={!isFirstStep ? handleSkip : undefined}
        />

        {/* Modal - Larger for onboarding */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900"></h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {currentStepData.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                {currentStepData.description}
              </p>

              {/* Content */}
              <div className="text-left">
                {currentStepData.content}
              </div>

              {/* Step indicator text */}
              <p className="text-xs text-gray-500 mt-6">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between w-full pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-indigo-600'
                      : index < currentStep
                      ? 'w-2 bg-indigo-300'
                      : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-sm"
              >
                Skip
              </Button>
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                className="text-sm"
              >
                {isLastStep ? 'Get Started' : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function to check if onboarding should be shown
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
}

// Utility function to reset onboarding (for testing)
export function resetOnboarding(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
}


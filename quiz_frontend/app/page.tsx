import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { GraduationCap, BookOpen, FileText, ArrowRight } from 'lucide-react';

export default function Home() {
  // Home page is public - no authentication required
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            AI-Powered Learning Platform
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-800 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Generate quizzes, flashcards, and essay questions from URLs and PDFs
            with advanced AI technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
          <Card>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Quizzes</h3>
              </div>
            </div>
            <p className="text-gray-800 mb-4">
              Generate multiple-choice quizzes from any URL or PDF. Choose your
              difficulty level and number of questions.
            </p>
            <Link href="/quizzes">
              <Button variant="primary" className="w-full">
                Create Quiz <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Flashcards</h3>
              </div>
            </div>
            <p className="text-gray-800 mb-4">
              Create interactive flashcards to help you memorize key concepts
              and definitions from your study materials.
            </p>
            <Link href="/flashcards">
              <Button variant="primary" className="w-full">
                Create Flashcards <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Essay Q&A</h3>
              </div>
            </div>
            <p className="text-gray-800 mb-4">
              Generate detailed essay questions with full answers and key
              information to help you practice writing.
            </p>
            <Link href="/essays">
              <Button variant="primary" className="w-full">
                Create Essay Q&A <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-12">
          <CardHeader title="How It Works" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-xl">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Choose Content</h4>
              <p className="text-sm text-gray-800">
                Provide a URL or upload a PDF document
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-xl">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Configure</h4>
              <p className="text-sm text-gray-800">
                Set difficulty level and number of questions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-xl">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Generate & Learn</h4>
              <p className="text-sm text-gray-800">
                Get your content and start practicing
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

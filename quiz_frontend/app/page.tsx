import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle2,
  FolderOpen,
  BarChart3,
  Users,
  Star
} from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
                <Sparkles className="w-4 h-4" />
                Freshly Updated AI Learning Workspace
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Study Materials
                </span>
                Into Learning Tools
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-700 leading-relaxed">
                Generate interactive quizzes, flashcards, and essay questions from any PDF or URL. 
                Chat with your documents, get concept-level AI feedback after every quiz, and let adaptive flashcards reinforce your weak spots. 
                Powered by advanced AI to help you study smarter, not harder.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="text-lg px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/quizzes">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                    Try Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Instant generation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's New Section */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What’s New in QuizHub</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Recent upgrades that make studying even more personal, organized, and effective.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border border-gray-200 hover:border-indigo-200 transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                    Smart Insights
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Concept-Level AI Feedback</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Every quiz now returns a focused, one-paragraph summary that highlights the exact concepts you missed and how to master them.
                </p>
              </Card>

              <Card className="p-6 border border-gray-200 hover:border-purple-200 transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                    Adaptive Practice
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Feedback-Aware Flashcards</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Flashcards generated from project PDFs automatically prioritize weak topics from your latest quiz attempts.
                </p>
              </Card>

              <Card className="p-6 border border-gray-200 hover:border-amber-200 transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <FolderOpen className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                    Organized Projects
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Versioned Student Hub</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Upload multiple PDFs at once, keep every generated asset, and instantly see the latest quiz, flashcard, or essay version for each file.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Study Smarter
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Powerful tools designed to help you learn faster and retain more information
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Quiz Feature */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200">
                <div className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Quizzes</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Generate multiple-choice quizzes with customizable difficulty levels. 
                    Track your progress and identify areas for improvement.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Multiple difficulty levels (easy/medium/hard)
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Auto or custom question counts with one click
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Instant, concept-level AI feedback summaries
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Share quizzes with 6-digit codes
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Performance tracking & analytics
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/quizzes">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700">
                        Create Quiz
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Flashcard Feature */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200">
                <div className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Flashcards</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Create interactive flashcards from your study materials. 
                    Perfect for memorizing key concepts, definitions, and facts.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      Learns from your quiz feedback automatically
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      Flip animation & spaced repetition tips
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      Study anywhere
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/flashcards">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700">
                        Create Flashcards
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Essay Feature */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200">
                <div className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Essay Q&A</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Generate comprehensive essay questions with detailed answers. 
                    Practice writing and deepen your understanding of complex topics.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" />
                      Detailed answers
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" />
                      Key information highlights
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" />
                      Writing practice
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/essays">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700">
                        Create Essay Q&A
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Student Hub Feature */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
                  <FolderOpen className="w-4 h-4" />
                  New Feature
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Student Hub
                </h2>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Organize all your study materials in one place. Upload PDFs, create projects, 
                  and generate quizzes, flashcards, and essays from your documents.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Project Organization</h4>
                      <p className="text-gray-700">Group your PDFs by subject or topic and upload multiple files in one go.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Inline PDF Workspace</h4>
                      <p className="text-gray-700">Preview every PDF inside the hub and launch generators without leaving the page.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">AI Chat with PDFs</h4>
                      <p className="text-gray-700">Ask questions and get instant answers from your uploaded documents</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Version Timeline</h4>
                      <p className="text-gray-700">See the latest quiz, flashcard, or essay version and roll back through your history.</p>
                    </div>
                  </li>
                </ul>
                <Link href="/student-hub">
                  <Button variant="primary" size="lg">
                    Explore Student Hub
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <FolderOpen className="w-6 h-6 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Math 101 Notes</div>
                        <div className="text-sm text-gray-600">3 PDFs • 5 Quizzes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                      <div>
                        <div className="font-semibold text-gray-900">History Project</div>
                        <div className="text-sm text-gray-600">2 PDFs • 8 Flashcards</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg border border-pink-100">
                      <FileText className="w-6 h-6 text-pink-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Science Research</div>
                        <div className="text-sm text-gray-600">4 PDFs • 12 Essays</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Get started in minutes. No complex setup required.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute w-24 h-24 bg-indigo-100 rounded-full"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">1</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Upload or Link</h3>
                <p className="text-gray-700">
                  Provide a URL or upload a PDF document. Our AI will extract and analyze the content.
                </p>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute w-24 h-24 bg-purple-100 rounded-full"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">2</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customize</h3>
                <p className="text-gray-700">
                  Choose your difficulty level, number of questions, and content type. 
                  Tailor everything to your learning needs.
                </p>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute w-24 h-24 bg-pink-100 rounded-full"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">3</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Learn & Practice</h3>
                <p className="text-gray-700">
                  Get your generated content instantly. Start studying and track your progress 
                  with detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">More Powerful Features</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Everything you need for effective studying and collaboration
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="p-6 border-2 hover:border-indigo-200 transition-all">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quiz Sharing</h3>
                <p className="text-gray-700 text-sm">
                  Share quizzes with friends using 6-digit codes. Perfect for study groups and classroom activities.
                </p>
              </Card>
              <Card className="p-6 border-2 hover:border-purple-200 transition-all">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Referral Program</h3>
                <p className="text-gray-700 text-sm">
                  Invite friends and earn bonus generations. Get 5 free generations for each successful referral.
                </p>
              </Card>
              <Card className="p-6 border-2 hover:border-pink-200 transition-all">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-700 text-sm">
                  Track your performance with detailed statistics, category breakdowns, and progress visualization.
                </p>
              </Card>
              <Card className="p-6 border-2 hover:border-amber-200 transition-all">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Persistent Workspace</h3>
                <p className="text-gray-700 text-sm">
                  Your PDFs, versions, and quiz history live on Railway-backed storage—no more disappearing data after redeployments.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-700 text-sm">Generate content in seconds, not hours</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-700 text-sm">Your data is safe and never shared</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Track Progress</h3>
                <p className="text-gray-700 text-sm">Monitor your learning with detailed analytics</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Save Time</h3>
                <p className="text-gray-700 text-sm">Study more efficiently with AI assistance</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Start with free AI generations. Upgrade to Pro for unlimited access, advanced features, and priority support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-6 bg-white text-indigo-600 hover:bg-gray-50">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

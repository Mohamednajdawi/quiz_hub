 'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  ArrowRight, 
  CheckCircle2,
  FolderOpen,
  ChevronDown,
  Sparkles,
  BookOpenCheck,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  Brain,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LoggedInHome() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Go to Student Hub',
      description: 'Pick up where you left off with your PDFs and generators.',
      href: '/student-hub',
      icon: FolderOpen,
      cta: 'Open Hub',
    },
    {
      title: 'Create a New Project',
      description: 'Upload a PDF or paste text to spin up quizzes and flashcards.',
      href: '/student-hub',
      icon: PlusCircle,
      cta: 'New Project',
    },
    {
      title: 'Review Recent Quizzes',
      description: 'Jump straight into editing questions or checking feedback.',
      href: '/quizzes',
      icon: ClipboardList,
      cta: 'Review Quizzes',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/40 to-white">
        <section className="py-20 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-indigo-500 font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Welcome back
                </p>
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                  Ready to keep building, {user?.first_name || 'friend'}?
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Resume active generations, jump into Student Hub, or start something fresh—all from one place.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/student-hub">
                  <Button variant="primary" size="lg">
                    Continue in Student Hub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Card key={action.title} className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <action.icon className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    {action.description}
                  </p>
                  <Link href={action.href}>
                    <Button variant="primary" className="w-full">
                      {action.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 border border-gray-200 h-full flex">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 text-indigo-600 font-semibold text-sm uppercase tracking-wide">
                    <BookOpenCheck className="w-5 h-5" />
                    Quick reminders
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>• You can upload PDFs or text directly from Student Hub.</p>
                    <p>• All generation progress now notifies you from anywhere in the app.</p>
                    <p>• Revisit recent quizzes or essays to keep improving your sets.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border border-gray-200 h-full">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Need inspiration?
                  </h3>
                  <p className="text-gray-600">
                    Check the latest release notes or reach out if you want a custom workflow set up for your class.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/student-hub">
                      <Button variant="primary">Open Student Hub</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary">View Updates</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <LoggedInHome />;
  }
  const previewImages = [
    {
      src: '/gallery-quiz.svg',
      title: 'Quiz Workspace',
      description: 'Run lightning-fast practice sessions with AI feedback.',
    },
    {
      src: '/gallery-flashcards.svg',
      title: 'Flashcards View',
      description: 'Swipe through adaptive cards driven by your quiz data.',
    },
    {
      src: '/gallery-essay.svg',
      title: 'Essay Builder',
      description: 'Outline, draft, and refine long-form answers in one place.',
    },
  ];

  const feedbackLoopSteps = [
    {
      title: '1. Take a quiz or essay',
      description: 'Run a fast attempt and let QuizHub capture every mistake automatically.',
      icon: ClipboardList,
    },
    {
      title: '2. Get AI feedback',
      description: 'Personalized coaching highlights weak topics, timing issues, and study focus areas.',
      icon: Brain,
    },
    {
      title: '3. Regenerate smarter content',
      description: 'New quizzes, flashcards, and readings automatically target those weak spots.',
      icon: Target,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Trust Signal Banner */}
        <section className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                <span className="text-indigo-600 font-semibold">Trusted by students</span> Join the team!
              </p>
            </div>
          </div>
        </section>

        {/* Hero Section with Video and CTA */}
        <section className="relative bg-white text-gray-900 py-24 sm:py-32 lg:py-40 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
              {/* Video Section - Left Side */}
              <div className="order-2 lg:order-1 lg:col-span-3">
                <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <div className="aspect-video bg-gray-900">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      poster="/gallery-quiz.svg"
                      src="https://cdn.coverr.co/videos/coverr-learning-in-progress-1022/1080p.mp4"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Section - Right Side */}
              <div className="order-1 lg:order-2 lg:col-span-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-900 mb-5 leading-tight tracking-tight">
                  Study tools in one calm workspace
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-7 leading-relaxed">
                  Upload once, get quizzes, flashcards, and essays in seconds—no extra tabs or jargon.
                </p>
                <div className="mb-7">
                  <Link href="/register">
                    <Button variant="primary" size="lg" className="text-base px-8 py-3 font-medium transition-all duration-200 hover:opacity-90">
                      Get Started Free
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-col gap-2.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Launch your first quiz in 60 seconds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section id="gallery" className="py-20 sm:py-24 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900">Screens you will live in</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                A quick peek at the updated workspace so you can skip the tour and start creating.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {previewImages.map((image) => (
                <div key={image.title} className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-gray-50">
                    <Image
                      src={image.src}
                      alt={image.title}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{image.title}</h4>
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback Loop Visual */}
        <section className="py-24 sm:py-28 bg-gradient-to-b from-indigo-50/40 via-white to-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em] mb-3">
                Feedback Loop
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Every generation learns from the last
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                QuizHub feeds your latest AI feedback directly into new quizzes, flashcards, and essays so practice always targets the exact topics you missed.
              </p>
            </div>
            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent -translate-y-1/2" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {feedbackLoopSteps.map((step) => (
                  <Card key={step.title} className="p-6 border-2 border-white shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur rounded-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-5">
                      <step.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      {step.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-28 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Study Smarter
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Core generators without the clutter.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Quiz Feature */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200">
                <div className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 text-white">
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Quizzes</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Generate multiple-choice quizzes in a click and see what needs work.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Pick difficulty or let QuizHub choose for you
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                      Instant concept-level feedback
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/quizzes">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700 transition-transform duration-200 hover:scale-105 active:scale-95">
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
                  <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4 text-white">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Flashcards</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Create flashcards that mirror your weak spots and keep sessions short.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      Learns from your quiz feedback automatically
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      Mobile friendly and distraction free
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/flashcards">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700 transition-transform duration-200 hover:scale-105 active:scale-95">
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
                  <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-4 text-white">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Essay Q&A</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Spin up essay questions and model answers for deeper practice.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" />
                      Highlighted key points for outlines
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" />
                      With AI feedback
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Link href="/essays">
                      <Button variant="primary" className="w-full group-hover:bg-indigo-700 transition-transform duration-200 hover:scale-105 active:scale-95">
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
        <section className="py-20 sm:py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Student Hub
                </h2>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Organize PDFs, launch generators, and review outputs in a single dashboard.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-gray-700">Project organization and inline PDF workspace</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-gray-700">AI chat with PDFs and version timeline</span>
                  </li>
                </ul>
                <Link href="/student-hub">
                  <Button variant="primary" size="lg" className="transition-transform duration-200 hover:scale-105 active:scale-95">
                    Explore Student Hub
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <FolderOpen className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Math 101 Notes</div>
                        <div className="text-sm text-gray-600">3 PDFs • 5 Quizzes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold text-gray-900">History Project</div>
                        <div className="text-sm text-gray-600">2 PDFs • 8 Flashcards</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <FileText className="w-5 h-5 text-pink-600" />
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

        {/* CTA Section */}
        <section className="py-24 sm:py-28 bg-indigo-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Start with free AI generations and upgrade later if you need more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-6 bg-white text-indigo-600 hover:bg-gray-50 transition-transform duration-200 hover:scale-105 active:scale-95">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10 transition-transform duration-200 hover:scale-105 active:scale-95">
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

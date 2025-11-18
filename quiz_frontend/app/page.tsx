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
  ChevronDown
} from 'lucide-react';

export default function Home() {
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Video Section - Left Side */}
              <div className="order-2 lg:order-1">
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
              <div className="order-1 lg:order-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-gray-900 mb-6 leading-tight tracking-tight">
                  Study tools in one calm workspace
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                  Upload once, get quizzes, flashcards, and essays in seconds—no extra tabs or jargon.
                </p>
                <div className="mb-8">
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

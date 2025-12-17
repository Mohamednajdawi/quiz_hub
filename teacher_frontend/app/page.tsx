'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      router.push('/courses');
    } else {
      router.push('/register');
    }
  };

  const handleSecondaryCta = () => {
    if (isAuthenticated) {
      router.push('/results');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white flex flex-col">
      {/* Sticky Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all ${
          isScrolled ? 'glassmorphism border-b border-[#38BDF8]/20' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-lg font-bold tracking-tight text-white"
          >
            PROGREZZ
          </button>
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={handleSecondaryCta}
              className="px-4 py-2 rounded-full border border-[#38BDF8]/40 text-[#E2E8F0] hover:bg-[#0B1221] transition-colors"
            >
              {isAuthenticated ? 'View results' : 'Sign in'}
            </button>
            <button
              onClick={handlePrimaryCta}
              className="px-4 py-2 rounded-full bg-[#38BDF8] text-[#020617] font-semibold hover:bg-[#38BDF8]/90 transition-colors"
            >
              Start for free
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient + subtle pattern */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-40 h-96 bg-gradient-to-b from-[#1E293B]/60 via-transparent to-transparent blur-3xl opacity-80" />
            <svg
              className="absolute -right-32 top-10 w-96 h-96 opacity-30"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="nodeGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <g stroke="url(#nodeGradient)" strokeWidth="0.6">
                <circle cx="40" cy="40" r="3" fill="#38BDF8" />
                <circle cx="120" cy="30" r="2" fill="#38BDF8" />
                <circle cx="80" cy="90" r="2.5" fill="#38BDF8" />
                <circle cx="160" cy="80" r="3" fill="#38BDF8" />
                <circle cx="140" cy="150" r="2" fill="#38BDF8" />
                <circle cx="60" cy="150" r="2" fill="#38BDF8" />
                <line x1="40" y1="40" x2="80" y2="90" />
                <line x1="80" y1="90" x2="120" y2="30" />
                <line x1="80" y1="90" x2="160" y2="80" />
                <line x1="80" y1="90" x2="60" y2="150" />
                <line x1="160" y1="80" x2="140" y2="150" />
                <line x1="60" y1="150" x2="140" y2="150" />
              </g>
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24">
            <div className="max-w-3xl mx-auto text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#020617]/50 px-3 py-1 text-xs font-medium text-[#E2E8F0] mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                Built for teachers who want impact, not admin work
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
                Turn your teaching material into quizzes in seconds.
              </h1>
              <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto mb-8">
                PROGREZZ helps you generate quizzes, flashcards, and insights from your PDFs —
                so you spend more time teaching and less time preparing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <button
                  onClick={handlePrimaryCta}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#38BDF8] text-[#020617] font-semibold text-sm sm:text-base hover:bg-[#38BDF8]/90 transition-colors shadow-lg shadow-[#0EA5E9]/30"
                >
                  Start for free
                </button>
                <button
                  onClick={handleSecondaryCta}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#38BDF8]/40 text-[#E2E8F0] text-sm sm:text-base hover:bg-[#0B1221] transition-colors"
                >
                  {isAuthenticated ? 'Go to dashboard' : 'Sign in to existing account'}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#64748B]">
                No credit card required. Designed for GDPR-conscious schools and universities.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-t border-[#1E293B] bg-[#020617]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-xs sm:text-sm text-[#94A3B8] mb-6">
              Trusted by teachers around the world
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70">
              {['Northbridge Academy', 'Nova Education Group', 'Summit High', 'Global Learning Lab'].map(
                (name) => (
                  <div
                    key={name}
                    className="h-10 flex items-center justify-center px-4 border border-[#1E293B] rounded-lg text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#94A3B8] bg-[#020617]"
                  >
                    {name}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Value Proposition Grid (Bento) */}
        <section className="bg-[#050814] border-t border-[#1E293B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Built for modern classrooms.
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8]">
                A focused toolkit that turns your static PDFs into dynamic assessments and
                spaced-repetition learning — in minutes, not hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-[#1E293B] border border-[#38BDF8]/10 p-6 sm:p-7 hover:border-[#38BDF8]/40 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <Shield className="w-8 h-8 text-[#38BDF8] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Privacy by design</h3>
                <p className="text-sm text-[#CBD5F5]">
                  Keep student data safe with infrastructure built around European privacy
                  standards and minimal data retention.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-[#1E293B] border border-[#38BDF8]/10 p-6 sm:p-7 hover:border-[#38BDF8]/40 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <Zap className="w-8 h-8 text-[#38BDF8] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Quizzes in seconds</h3>
                <p className="text-sm text-[#CBD5F5]">
                  Upload a PDF, select difficulty, and instantly generate quizzes, flashcards,
                  and essay questions tailored to your syllabus.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-[#1E293B] border border-[#38BDF8]/10 p-6 sm:p-7 hover:border-[#38BDF8]/40 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <Database className="w-8 h-8 text-[#38BDF8] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">One content hub</h3>
                <p className="text-sm text-[#CBD5F5]">
                  Keep all your course materials, generated quizzes, and results in one secure
                  place, accessible from any device.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal footer for landing page */}
        <section className="border-t border-[#1E293B] bg-[#020617]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#64748B]">
            <p>© {new Date().getFullYear()} PROGREZZ. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-[#E2E8F0]">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-[#E2E8F0]">
                Privacy
              </Link>
              <Link href="/imprint" className="hover:text-[#E2E8F0]">
                Imprint
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

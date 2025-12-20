'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#050814] border-t border-[#38BDF8]/20 mt-auto text-[#94A3B8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/courses" className="hover:text-[#38BDF8]">
                  Teacher Dashboard
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-[#38BDF8]">
                  Quiz Results
                </Link>
              </li>
            </ul>
          </div>

          {/* Teaching tools */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Teaching tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="cursor-default">PDF-based quizzes</span>
              </li>
              <li>
                <span className="cursor-default">Flashcards</span>
              </li>
              <li>
                <span className="cursor-default">Essay Q&amp;A</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-[#38BDF8]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#38BDF8]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-[#38BDF8]">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="hover:text-[#38BDF8]">
                  Imprint (Impressum)
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@quiz-hub.app" className="hover:text-[#38BDF8]">
                  support@quiz-hub.app
                </a>
              </li>
              <li>
                <span className="cursor-default">Mon–Fri, 9:00–17:00 CET</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#1E293B] text-xs text-center text-[#64748B]">
          © {new Date().getFullYear()} Quiz Hub Teacher Dashboard. All rights reserved.
        </div>
      </div>
    </footer>
  );
}



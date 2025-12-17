'use client';

import Link from 'next/link';
import { siteConfig, formatPhoneNumber, getFullAddress } from '@/lib/config/site';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#e6e6e6] mt-auto text-brand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-brand mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-[#596078] hover:text-brand">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-[#596078] hover:text-brand">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-[#596078] hover:text-brand">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-sm text-[#596078] hover:text-brand">
                  Imprint (Impressum)
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <h3 className="text-sm font-semibold text-brand mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-sm text-[#596078] hover:text-brand">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-[#596078] hover:text-brand">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-[#596078] hover:text-brand">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-brand mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/quizzes" className="text-sm text-[#596078] hover:text-brand">
                  Quizzes
                </Link>
              </li>
              <li>
                <Link href="/flashcards" className="text-sm text-[#596078] hover:text-brand">
                  Flashcards
                </Link>
              </li>
              <li>
                <Link href="/essays" className="text-sm text-[#596078] hover:text-brand">
                  Essay Q&amp;A
                </Link>
              </li>
            </ul>
          </div>

          {/* Impressum (Austrian Law Requirement) */}
          <div>
            <h3 className="text-sm font-semibold text-brand mb-4">Impressum</h3>
            <div className="text-sm text-[#596078] space-y-2">
              <p>
                <strong>{siteConfig.legal.companyName}</strong>
              </p>
              <p>
                {getFullAddress()}
              </p>
              <p className="mt-2">
                <strong>Contact:</strong><br />
                <a 
                  href={`mailto:${siteConfig.contact.email}`} 
                  className="hover:text-brand underline"
                >
                  {siteConfig.contact.email}
                </a>
                <br />
                <a 
                  href={`tel:${siteConfig.contact.phone}`} 
                  className="hover:text-brand"
                >
                  {formatPhoneNumber(siteConfig.contact.phone)}
                </a>
              </p>
              {siteConfig.legal.vatNumber && (
                <p className="mt-2">
                  <strong>UID:</strong> {siteConfig.legal.vatNumber}
                </p>
              )}
              {siteConfig.legal.companyRegister && (
              <p className="mt-2">
                  <strong>Company Register:</strong> {siteConfig.legal.companyRegister}
              </p>
              )}
              <p className="mt-2">
                <strong>Responsible for Content:</strong><br />
                {siteConfig.legal.responsiblePerson}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#e6e6e6]">
          <p className="text-xs text-[#596078] text-center">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-gray-600 hover:text-gray-900">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Impressum (Austrian Law Requirement) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Impressum</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Quiz Hub</strong>
              </p>
              <p>
                {/* TODO: Replace with actual company information */}
                [Company Name]<br />
                [Street Address]<br />
                [Postal Code] [City]<br />
                Austria
              </p>
              <p className="mt-2">
                <strong>Contact:</strong><br />
                Email: <a href="mailto:contact@quizhub.com" className="hover:text-gray-900">contact@quizhub.com</a>
              </p>
              <p className="mt-2">
                <strong>UID:</strong> [VAT/UID Number]<br />
                <strong>Company Register:</strong> [Register Number]
              </p>
              <p className="mt-2">
                <strong>Responsible for Content:</strong><br />
                [Name of Responsible Person]
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} Quiz Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


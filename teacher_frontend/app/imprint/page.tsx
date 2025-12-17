'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="glassmorphism rounded-lg p-8 border border-[#38BDF8]/20">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-[#38BDF8]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Imprint / Legal Notice (Impressum)</h1>
              <p className="text-xs text-[#94A3B8] mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-[#E2E8F0]">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Service Provider</h2>
              <p>
                <strong>Company Name:</strong> [Company Name GmbH]
                <br />
                <strong>Registered Address:</strong> [Street and Number], [Postal Code] [City], [Country]
                <br />
                <strong>Managing Director(s):</strong> [Managing Director Name(s)]
                <br />
                <strong>Commercial Register Number:</strong> [Company Register Number]
                <br />
                <strong>VAT ID (UID):</strong> [EU VAT Identification Number]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Contact</h2>
              <p>
                <strong>Email:</strong> [contact@example.com]
                <br />
                <strong>Phone:</strong> [+43 123 456 789]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                3. Responsible for Content
              </h2>
              <p>
                [Full Name of responsible person]
                <br />
                [Street and Number], [Postal Code] [City], [Country]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                4. Liability for Content and Links
              </h2>
              <p className="text-[#CBD5F5]">
                We are responsible for our own content on these pages in accordance with general laws. We are not
                obliged to monitor transmitted or stored third‑party information or to investigate circumstances
                pointing to illegal activity.
              </p>
              <p className="text-[#CBD5F5] mt-2">
                Our pages may contain links to external websites. We have no influence on the content of such
                external sites and therefore cannot accept liability for them. The respective provider or operator
                is always responsible for the content of linked pages.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Copyright</h2>
              <p className="text-[#CBD5F5]">
                The content and works created by us on these pages are subject to copyright law. Reproduction,
                editing, distribution and any kind of exploitation outside the limits of copyright require our
                written consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Important Notice</h2>
              <p className="text-xs text-[#A5B4FC]">
                This Imprint is a template and must be adapted to your actual company details and reviewed by
                qualified legal counsel. Replace all bracketed placeholders with your real information.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



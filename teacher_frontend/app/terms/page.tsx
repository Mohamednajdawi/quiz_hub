'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="glassmorphism rounded-lg p-8 border border-[#38BDF8]/20">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-[#38BDF8]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-xs text-[#94A3B8] mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-5 text-sm text-[#E2E8F0] max-h-[80vh] overflow-y-auto pr-1">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                1. Scope and Governing Law
              </h2>
              <p>
                These Terms apply to your use of the teacher dashboard. They are governed by the laws of [EU Member
                State], without prejudice to mandatory consumer protection rules in your country of residence.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Teacher Accounts</h2>
              <p>
                You must keep your login credentials confidential and ensure that access to your account is
                restricted to authorised individuals (e.g. you or your school staff). You remain responsible for all
                activity under your account unless you inform us of suspected misuse.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. Acceptable Use</h2>
              <p>You agree not to use the teacher dashboard to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-[#CBD5F5]">
                <li>Upload unlawful, harmful or discriminatory content;</li>
                <li>Infringe third‑party intellectual property rights;</li>
                <li>Introduce malware or attempt to disrupt our systems;</li>
                <li>Share login details with unauthorised third parties.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. Intellectual Property</h2>
              <p>
                All software and design elements of the teacher dashboard remain our property or that of our
                licensors. Teaching content you upload or generate remains yours; you grant us a licence to host and
                process it to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Termination</h2>
              <p>
                We may suspend or terminate access if you materially or repeatedly breach these Terms. You may close
                your account at any time. Termination does not affect any statutory rights or obligations that have
                already arisen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Liability</h2>
              <p className="text-xs text-[#A5B4FC]">
                Insert a liability clause that is compatible with your national law (e.g. limitation to intent and
                gross negligence, no exclusion for injury to life, body or health). Have this section reviewed by
                legal counsel.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



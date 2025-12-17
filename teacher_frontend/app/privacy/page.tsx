'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="glassmorphism rounded-lg p-8 border border-[#38BDF8]/20">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#38BDF8]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy (GDPR)</h1>
              <p className="text-xs text-[#94A3B8] mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-5 text-sm text-[#E2E8F0] max-h-[80vh] overflow-y-auto pr-1">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Data Controller</h2>
              <p>
                [Company Name GmbH], [Street and Number], [Postal Code] [City], [Country]
                <br />
                Email: [privacy@example.com] • Phone: [+43 123 456 789]
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Teacher Data</h2>
              <p>
                As a teacher, we process your account data (name, email, password hash), course and content
                metadata, usage logs, and technical data (IP address, browser, timestamps) to provide the teacher
                dashboard and keep it secure (Art. 6(1)(b) and (f) GDPR).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. Cookies &amp; Server Logs</h2>
              <p>
                We use essential cookies for authentication and security. Our servers log access data (IP address,
                time, URL, status code, user agent) to detect abuse and maintain stability. Logs are retained only
                as long as necessary for these purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. Third‑Party Processors</h2>
              <p>
                We may rely on hosting, email and payment providers that act as processors under Art. 28 GDPR. Data
                transfers outside the EU/EEA are protected with appropriate safeguards (e.g. Standard Contractual
                Clauses) where required.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Teacher Rights</h2>
              <p>
                You have the right to access, rectify, erase, restrict and port your personal data, and to object to
                processing based on legitimate interests (Art. 15–21 GDPR). To exercise these rights, please contact
                us using the details in the Imprint.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Supervisory Authority</h2>
              <p className="text-xs text-[#A5B4FC]">
                Insert the contact details of your competent data protection authority here. Have this page reviewed
                and completed by legal counsel before production use.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



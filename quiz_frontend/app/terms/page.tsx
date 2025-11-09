'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <Card>
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            
            <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Quiz Hub ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Use License</h2>
                <p>
                  Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained in the Service</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. User Accounts</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Content and Intellectual Property</h2>
                <p>
                  All content generated through the Service, including quizzes, flashcards, and essays, is for educational purposes. You retain ownership of content you create, but grant us a license to use, store, and process such content to provide the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Prohibited Uses</h2>
                <p>You may not use the Service:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>In any way that violates any applicable law or regulation</li>
                  <li>To transmit any malicious code or viruses</li>
                  <li>To spam or harass other users</li>
                  <li>To attempt to gain unauthorized access to the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Subscription and Billing</h2>
                <p>
                  Subscription fees are billed in advance on a monthly or annual basis. You may cancel your subscription at any time, and cancellation will take effect at the end of the current billing period.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Limitation of Liability</h2>
                <p>
                  The Service is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us through the contact information provided in the Impressum.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


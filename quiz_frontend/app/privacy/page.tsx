'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <Card>
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Account information (name, email address, password)</li>
                  <li>Content you create (quizzes, flashcards, essays)</li>
                  <li>Usage data and analytics</li>
                  <li>Payment information (processed securely through third-party payment processors)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze usage patterns</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Data Storage and Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Data Sharing</h2>
                <p>We do not sell your personal information. We may share your information only:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>With service providers who assist us in operating our Service</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a business transfer (merger, acquisition, etc.)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Cookies and Tracking</h2>
                <p>
                  We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Your Rights (GDPR)</h2>
                <p>If you are located in the European Economic Area, you have certain data protection rights:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>The right to access your personal data</li>
                  <li>The right to rectification of inaccurate data</li>
                  <li>The right to erasure ("right to be forgotten")</li>
                  <li>The right to restrict processing</li>
                  <li>The right to data portability</li>
                  <li>The right to object to processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Children's Privacy</h2>
                <p>
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Changes to This Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us through the contact information provided in the Impressum.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


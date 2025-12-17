'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <Card>
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy (GDPR)</h1>

            <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  1. Data Controller
                </h2>
                <p>
                  The controller within the meaning of Art. 4(7) GDPR is:
                </p>
                <p>
                  [Company Name GmbH]<br />
                  [Street and Number]<br />
                  [Postal Code] [City], [Country]<br />
                  Email: [privacy@example.com]<br />
                  Phone: [+43 123 456 789]
                </p>
                <p className="text-xs text-gray-500">
                  Please replace the placeholders with your actual company and contact details.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  2. Scope of this Privacy Policy
                </h2>
                <p>
                  This Privacy Policy explains how we process personal data when you use our website and services,
                  including our quiz, flashcard, essay and mind-map features (the &quot;Service&quot;).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  3. Categories of Personal Data Processed
                </h2>
                <p>We may process the following categories of personal data:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Account data:</strong> name, email address, password hash, role, subscription data.
                  </li>
                  <li>
                    <strong>Usage data:</strong> quiz attempts, generated content, timestamps, feature usage.
                  </li>
                  <li>
                    <strong>Communication data:</strong> messages you send to us (e.g. support requests).
                  </li>
                  <li>
                    <strong>Payment data:</strong> billing identifiers, subscription status, limited payment
                    metadata (processed via third-party payment providers).
                  </li>
                  <li>
                    <strong>Technical data:</strong> IP address, browser type, device information, server log files,
                    cookies and similar identifiers.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  4. Purposes of Processing and Legal Bases (Art. 6 GDPR)
                </h2>
                <p>
                  We process your personal data on the following legal bases and for the following purposes:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Performance of a contract (Art. 6(1)(b) GDPR):</strong> to provide and operate the
                    Service, create and manage user accounts, generate and store study content, and provide customer
                    support.
                  </li>
                  <li>
                    <strong>Compliance with legal obligations (Art. 6(1)(c) GDPR):</strong> to comply with tax,
                    accounting and retention obligations, as well as requests from competent authorities.
                  </li>
                  <li>
                    <strong>Legitimate interests (Art. 6(1)(f) GDPR):</strong> to ensure IT security, prevent abuse,
                    improve and optimise our Service, and to compile aggregated usage statistics (in a privacy‑
                    preserving way).
                  </li>
                  <li>
                    <strong>Consent (Art. 6(1)(a) GDPR):</strong> for non-essential cookies/analytics and optional
                    email communication, where required. You can withdraw consent at any time with effect for the
                    future.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  5. Cookies &amp; Tracking Technologies
                </h2>
                <p>
                  Our Service uses cookies and similar technologies. Cookies are small text files stored on your
                  device by your browser.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Essential cookies:</strong> required for core functionality (e.g. authentication,
                    security, remembering cookie choices). These are processed on the basis of our legitimate
                    interest (Art. 6(1)(f) GDPR) and your contract (Art. 6(1)(b) GDPR).
                  </li>
                  <li>
                    <strong>Analytics / performance cookies (optional):</strong> used to understand how the Service
                    is used and to improve it. These cookies are only set with your consent (Art. 6(1)(a) GDPR).
                  </li>
                </ul>
                <p>
                  You can control cookies through your browser settings and (where implemented) our cookie banner.
                  If you disable cookies, some features of the Service may not work properly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  6. Server Log Files
                </h2>
                <p>
                  When you access our Service, we automatically collect and store information in server log files
                  that your browser automatically transmits to us. This may include:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>IP address (shortened or pseudonymised where possible)</li>
                  <li>Date and time of the request</li>
                  <li>Requested URL and HTTP status code</li>
                  <li>Browser type and version, operating system</li>
                  <li>Referrer URL</li>
                </ul>
                <p>
                  This data is processed to ensure the stability and security of the Service and is based on our
                  legitimate interests (Art. 6(1)(f) GDPR). Log files are usually retained for a short period of
                  time and then deleted or anonymised, unless longer retention is required for security or evidence
                  purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  7. Recipients and Third-Party Services
                </h2>
                <p>
                  We may share personal data with carefully selected processors and service providers, for example:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Hosting and infrastructure providers (e.g. cloud platforms, database hosting)</li>
                  <li>Payment processors (for subscription billing)</li>
                  <li>Email and communication providers</li>
                  <li>Analytics and monitoring tools (where enabled)</li>
                </ul>
                <p>
                  These providers process data on our behalf based on data processing agreements in accordance with
                  Art. 28 GDPR. Where data is transferred outside the EU/EEA, we implement appropriate safeguards
                  such as Standard Contractual Clauses (Art. 46 GDPR), where required.
                </p>
                <p className="text-xs text-gray-500">
                  Please adapt this section to list your actual providers (e.g. hosting, analytics, payment).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  8. Data Retention
                </h2>
                <p>
                  We only store personal data for as long as necessary to fulfil the purposes described above or as
                  required by law. In particular:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    Account and profile data are stored for the duration of the contractual relationship and
                    thereafter as long as legal retention obligations apply.
                  </li>
                  <li>
                    Usage and analytics data are stored for a limited period and are then anonymised or deleted.
                  </li>
                  <li>
                    Billing and accounting records are stored in accordance with statutory retention periods
                    (usually 7–10 years, depending on jurisdiction).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  9. Your Rights Under the GDPR
                </h2>
                <p>
                  As a data subject within the meaning of the GDPR, you have the following rights (subject to the
                  statutory requirements):
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Right of access (Art. 15 GDPR):</strong> to obtain confirmation as to whether we process
                    personal data and to receive a copy of such data.
                  </li>
                  <li>
                    <strong>Right to rectification (Art. 16 GDPR):</strong> to request the correction of inaccurate
                    or incomplete data.
                  </li>
                  <li>
                    <strong>Right to erasure (Art. 17 GDPR):</strong> to request the deletion of personal data, in
                    particular if it is no longer necessary or processed unlawfully.
                  </li>
                  <li>
                    <strong>Right to restriction of processing (Art. 18 GDPR):</strong> to request that processing
                    be limited in certain cases.
                  </li>
                  <li>
                    <strong>Right to data portability (Art. 20 GDPR):</strong> to receive personal data in a
                    structured, commonly used and machine-readable format and to have it transmitted to another
                    controller.
                  </li>
                  <li>
                    <strong>Right to object (Art. 21 GDPR):</strong> to object to processing based on legitimate
                    interests, on grounds relating to your particular situation, and to object to direct marketing
                    at any time.
                  </li>
                  <li>
                    <strong>Right to withdraw consent (Art. 7(3) GDPR):</strong> where processing is based on your
                    consent, you may withdraw it at any time with effect for the future.
                  </li>
                </ul>
                <p>
                  To exercise your rights, please contact us using the details provided in section 1. We may need
                  to verify your identity before responding to your request.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  10. Right to Lodge a Complaint
                </h2>
                <p>
                  You also have the right to lodge a complaint with a supervisory authority, in particular in the
                  Member State of your habitual residence, place of work or the place of the alleged infringement
                  (Art. 77 GDPR).
                </p>
                <p className="text-xs text-gray-500">
                  Insert the contact details of your competent supervisory authority here (e.g. Austrian Data
                  Protection Authority, German State Data Protection Authority).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  11. Children&apos;s Privacy
                </h2>
                <p>
                  Our Service is not directed to children under 13 years of age (or a higher age where required by
                  local law), and we do not knowingly collect personal data from children. If we become aware that
                  we have collected personal data from a child without appropriate consent, we will delete such
                  data without undue delay.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  12. Changes to this Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will inform you of significant changes,
                  for example via the website or by email, and adjust the &quot;Last updated&quot; date at the top
                  of this page.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  13. Disclaimer
                </h2>
                <p className="text-sm text-gray-600">
                  This Privacy Policy template is provided for informational purposes and must be adapted to your
                  actual processing activities and reviewed by qualified legal counsel to ensure full compliance
                  with applicable law.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


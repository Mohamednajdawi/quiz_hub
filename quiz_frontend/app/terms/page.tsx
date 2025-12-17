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
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  1. Scope and Contracting Parties
                </h2>
                <p>
                  These Terms of Service (the &quot;Terms&quot;) govern the use of the Quiz Hub platform and
                  related services (the &quot;Service&quot;). The Service is provided by [Company Name GmbH],
                  [Street and Number], [Postal Code] [City], [Country] (&quot;we&quot;, &quot;us&quot;,
                  &quot;our&quot;). By registering for an account or using the Service, you agree to be bound by
                  these Terms.
                </p>
                <p className="text-xs text-gray-500">
                  Replace the placeholders with your actual legal entity details and have these Terms reviewed by
                  legal counsel in your jurisdiction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  2. Governing Law and Jurisdiction
                </h2>
                <p>
                  These Terms and any disputes arising out of or in connection with them are governed by the laws
                  of [Member State of the European Union], excluding its conflict of law rules. If you are a
                  consumer resident in the EU/EEA, mandatory statutory consumer protection provisions of your
                  country of residence remain unaffected.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  3. Account Registration and Responsibilities
                </h2>
                <p>
                  To use certain features of the Service, you must create an account and provide accurate, complete
                  information. You are responsible for:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Maintaining the confidentiality of your login credentials;</li>
                  <li>
                    Ensuring that your account is used only by you or authorized persons under your responsibility;
                  </li>
                  <li>Immediately notifying us of any unauthorized use of your account.</li>
                </ul>
                <p>
                  You remain responsible for all activities that occur under your account unless you have
                  immediately informed us of a suspected misuse and we have had a reasonable time to act.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  4. Acceptable Use
                </h2>
                <p>You agree not to use the Service:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>In violation of any applicable law or regulation;</li>
                  <li>
                    To upload or generate content that is unlawful, defamatory, discriminatory, hateful, or
                    otherwise objectionable;
                  </li>
                  <li>To upload malicious code, viruses, or to attack the Service&apos;s infrastructure;</li>
                  <li>To attempt to gain unauthorized access to other accounts or systems;</li>
                  <li>To reverse engineer, decompile, or otherwise attempt to derive the source code.</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that materially or repeatedly violate these
                  Acceptable Use rules.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  5. Intellectual Property and User Content
                </h2>
                <p>
                  All software, design elements, logos, and underlying technology of the Service are protected by
                  intellectual property rights and remain our exclusive property or that of our licensors.
                </p>
                <p>
                  Content you upload or generate (e.g. quizzes, flashcards, essays, notes) remains your property.
                  You grant us a non‑exclusive, worldwide, royalty‑free licence to host, process, and display such
                  content solely for the purpose of providing and improving the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  6. Subscriptions, Billing and Free Trial
                </h2>
                <p>
                  Access to premium features of the Service may require a paid subscription. By starting a
                  subscription, you authorize us or our payment processor to charge the applicable fees on a
                  recurring basis (monthly or annually, as selected).
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Prices and billing intervals are displayed at the time of purchase.</li>
                  <li>
                    Subscriptions renew automatically until cancelled. You can cancel at any time with effect from
                    the end of the current billing period.
                  </li>
                  <li>
                    Where required by law, you will receive clear information about your right of withdrawal (see
                    Refund Policy / Right of Withdrawal).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  7. Availability and Changes to the Service
                </h2>
                <p>
                  We aim to provide the Service with reasonable care and skill, but we do not guarantee
                  uninterrupted availability. Maintenance, security updates or events beyond our control may
                  temporarily affect access.
                </p>
                <p>
                  We may modify, discontinue, or replace parts of the Service to improve functionality or for
                  technical or legal reasons. Where changes significantly affect core functionality of a paid plan,
                  we will inform affected users in advance where reasonably possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  8. Term and Termination
                </h2>
                <p>
                  The contract for the use of the Service runs for an indefinite period and may be terminated by
                  either party:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>By you at any time via your account settings or by contacting support;</li>
                  <li>
                    By us with reasonable notice, or without notice in the event of serious or repeated breaches of
                    these Terms.
                  </li>
                </ul>
                <p>
                  Upon termination, we may delete or anonymise your data in accordance with our Privacy Policy and
                  statutory retention requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  9. Limitation of Liability
                </h2>
                <p>
                  We shall be liable without limitation for intent and gross negligence, as well as for damages
                  resulting from injury to life, body or health. For simple negligence, we are only liable for
                  breaches of an essential contractual obligation (an obligation whose fulfilment enables the proper
                  performance of the contract and on whose observance you regularly rely).
                </p>
                <p>
                  In such cases, our liability is limited to the foreseeable damage typical for this type of
                  contract. Mandatory statutory liability regimes (e.g. under product liability law) remain
                  unaffected. Any further liability is excluded.
                </p>
                <p className="text-xs text-gray-500">
                  Adapt this section to the liability concept applicable in your jurisdiction and consult legal
                  counsel.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  10. Changes to these Terms
                </h2>
                <p>
                  We may amend these Terms if there is a valid reason to do so (e.g. changes in the law, expansion
                  of functionalities). We will inform you of changes in a suitable form (e.g. by email or in-app
                  notice). If you do not agree with the amended Terms, you may terminate your account before the
                  changes take effect.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  11. Contact and Complaints
                </h2>
                <p>
                  If you have any questions about these Terms or wish to submit a complaint, please contact us
                  using the details provided in the Imprint (Impressum). We will make reasonable efforts to resolve
                  disputes amicably before resorting to formal legal remedies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  12. Important Notice
                </h2>
                <p className="text-sm text-gray-600">
                  This Terms of Service template is a starting point and does not constitute legal advice. Please
                  adapt the content to your specific business model and have it reviewed by qualified legal counsel
                  in your jurisdiction.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


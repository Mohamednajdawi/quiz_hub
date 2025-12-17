'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';

export default function ImprintPage() {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <Card>
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Imprint / Legal Notice (Impressum)</h1>

            <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Service Provider</h2>
                <p>
                  <strong>Company Name:</strong> [Company Name GmbH]<br />
                  <strong>Registered Address:</strong> [Street and Number], [Postal Code] [City], [Country]<br />
                  <strong>Managing Director(s):</strong> [Managing Director Name(s)]<br />
                  <strong>Commercial Register Number:</strong> [Company Register Number]<br />
                  <strong>VAT ID (UID):</strong> [EU VAT Identification Number]<br />
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Contact</h2>
                <p>
                  <strong>Email:</strong> [contact@example.com]<br />
                  <strong>Phone:</strong> [+43 123 456 789]<br />
                  (Please replace the placeholders with your actual contact details.)
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  3. Responsible for Content According to § 18 Abs. 2 MStV / § 55 RStV
                </h2>
                <p>
                  [Full Name of the person responsible for editorial content]<br />
                  [Street and Number], [Postal Code] [City], [Country]
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  4. Dispute Resolution / Online Dispute Resolution (ODR)
                </h2>
                <p>
                  The European Commission provides a platform for Online Dispute Resolution (ODR) which can be
                  accessed at&nbsp;
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                  .
                </p>
                <p>
                  We are neither obligated nor willing to participate in dispute resolution proceedings before a
                  consumer arbitration board. If you have concerns, please contact us directly via the contact
                  details above.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  5. Liability for Content
                </h2>
                <p>
                  As a service provider, we are responsible for our own content on these pages in accordance with
                  general laws. However, we are not obligated to monitor transmitted or stored third-party
                  information or to investigate circumstances that indicate illegal activity.
                </p>
                <p>
                  Obligations to remove or block the use of information under general laws remain unaffected. Any
                  liability in this respect is, however, only possible from the time of knowledge of a specific
                  infringement. Upon becoming aware of such legal violations, we will remove the content in
                  question without undue delay.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Liability for External Links</h2>
                <p>
                  Our website may contain links to external third-party websites over whose content we have no
                  control. Therefore, we cannot assume any liability for these external contents. The respective
                  provider or operator of the pages is always responsible for the content of the linked pages.
                </p>
                <p>
                  The linked pages were checked for possible legal violations at the time of linking. Illegal
                  content was not recognizable at the time of linking. However, permanent monitoring of the
                  content of the linked pages is not reasonable without concrete indications of a violation of
                  the law. If we become aware of any legal infringements, we will remove such links immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Copyright</h2>
                <p>
                  The content and works created by us on these pages are subject to copyright law. Duplication,
                  processing, distribution, or any form of commercialization of such material beyond the scope of
                  copyright law requires the prior written consent of the respective author or creator.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Important Notice</h2>
                <p className="text-sm text-gray-600">
                  This Imprint template is provided for guidance only and does not constitute legal advice.
                  Please adapt all placeholders to your specific company details and have the text reviewed by
                  qualified legal counsel in your jurisdiction.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}



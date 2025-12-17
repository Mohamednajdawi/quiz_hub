'use client';

import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';

export default function RefundPage() {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8">
        <Card>
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h1>

            <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  1. Scope and Legal Background
                </h2>
                <p>
                  This Refund Policy informs you about your rights in connection with paid subscriptions and
                  purchases on our platform. If you are a consumer within the meaning of EU law, the provisions of
                  the EU Consumer Rights Directive (2011/83/EU) and its implementation in national law apply,
                  including the statutory 14‑day right of withdrawal for distance contracts.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  2. Right of Withdrawal (Cooling‑off Period)
                </h2>
                <p>
                  As an EU consumer, you generally have the right to withdraw from a distance contract without
                  giving any reason within 14 days from the day of conclusion of the contract (i.e. the date you
                  first subscribed or purchased a paid plan).
                </p>
                <p>
                  To exercise your right of withdrawal, you must inform us (see Imprint for contact details) of
                  your decision to withdraw from the contract by means of a clear statement (e.g. a letter sent by
                  post or email). You may use the model withdrawal form set out below, but this is not mandatory.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  3. Withdrawal and Digital Content / SaaS
                </h2>
                <p>
                  Our Service provides digital content and Software‑as‑a‑Service (SaaS). Under EU law, the
                  statutory right of withdrawal may expire early if:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    you have expressly requested that we begin supplying the digital content or service before the
                    expiry of the withdrawal period; and
                  </li>
                  <li>
                    you have acknowledged that you thereby lose your right of withdrawal once full performance has
                    begun.
                  </li>
                </ul>
                <p>
                  Where required, we will ask you to provide this express consent and acknowledgement during the
                  checkout flow. If you provide such consent and we fully perform the service (e.g. immediate full
                  access to the paid features), your statutory right of withdrawal may cease to apply to that
                  transaction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  4. Goodwill Refunds and Limitations
                </h2>
                <p>
                  Independently of statutory withdrawal rights, we may offer goodwill refunds in certain cases. As
                  a general guideline:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Refund requests should be made within 14 days of the initial purchase;</li>
                  <li>Refunds typically apply only to the first subscription payment;</li>
                  <li>
                    Subsequent renewal payments are normally non‑refundable unless required by applicable consumer
                    protection law;
                  </li>
                  <li>
                    Refunds, when granted, are processed to the original payment method used for the transaction.
                  </li>
                </ul>
                <p>
                  Nothing in this section limits your mandatory statutory rights as a consumer under EU law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  5. How to Request a Withdrawal or Refund
                </h2>
                <p>
                  To exercise your statutory right of withdrawal or to request a goodwill refund, please contact us
                  using the details provided in the Imprint (Impressum). Include at least:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Your full name and email address associated with the account;</li>
                  <li>The date of purchase and, if available, the transaction ID or invoice number;</li>
                  <li>
                    A clear statement that you wish to withdraw from the contract and/or request a refund, and the
                    reason if you wish to provide one.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  6. Effects of Withdrawal
                </h2>
                <p>
                  If you withdraw from the contract within the statutory cooling‑off period, we will reimburse all
                  payments received from you in connection with the contract, including standard delivery costs
                  where applicable, without undue delay and at the latest within 14 days from the day on which we
                  received your withdrawal notice.
                </p>
                <p>
                  Unless otherwise agreed, we will carry out such reimbursement using the same means of payment as
                  you used for the initial transaction; in any event, you will not incur any fees as a result of
                  such reimbursement.
                </p>
                <p>
                  If you have requested that performance of the service begins during the withdrawal period, you
                  may be required to pay an amount which is in proportion to what has been provided until the time
                  you communicated your withdrawal, compared with the full coverage of the contract.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  7. Model Withdrawal Form (EU Consumer Rights Directive)
                </h2>
                <p>
                  (If you wish to withdraw from the contract, you may fill out this form and send it back to us.)
                </p>
                <pre className="whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-md p-3">
{`To [Company Name GmbH], [Street and Number], [Postal Code] [City], [Country], Email: [contact@example.com]:

I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service:

— Ordered on (*) / received on (*): ______________________
— Name of consumer(s): _________________________________
— Address of consumer(s): ______________________________
— Email address associated with the account: ____________

Signature of consumer(s) (only if this form is notified on paper):

________________________________

Date: ___________________________

(*) Delete as appropriate.`}
                </pre>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  8. Cancellation of Subscription (Outside Withdrawal Period)
                </h2>
                <p>
                  You may cancel your subscription at any time via your account settings. Cancellation takes effect
                  at the end of the current billing period. You will continue to have access to paid features until
                  the end of that period. As a rule, payments already made are non‑refundable outside the
                  statutory withdrawal period, unless required by law or agreed otherwise.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Chargebacks</h2>
                <p>
                  If you initiate a chargeback through your payment provider, we may suspend or restrict your
                  account while we investigate. We encourage you to contact us directly first, as this often allows
                  for a faster and more straightforward resolution.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  10. Important Notice
                </h2>
                <p className="text-sm text-gray-600">
                  This Refund / Right of Withdrawal policy is a template and must be adapted to your actual product
                  offering, pricing model and national implementation of the EU Consumer Rights Directive. Please
                  have it reviewed by qualified legal counsel.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


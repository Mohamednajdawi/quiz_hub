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
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Refund Eligibility</h2>
                <p>
                  We offer refunds for subscription payments under the following conditions:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Refund requests must be made within 14 days of the initial purchase</li>
                  <li>Refunds apply only to the first subscription payment</li>
                  <li>Subsequent subscription renewals are not eligible for refund</li>
                  <li>Refunds are processed to the original payment method</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. How to Request a Refund</h2>
                <p>
                  To request a refund, please contact us through the contact information provided in the Impressum. Include your account email and the transaction ID from your payment confirmation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Processing Time</h2>
                <p>
                  Refund requests are typically processed within 5-10 business days. The refund will appear in your account within 1-2 billing cycles, depending on your payment provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Cancellation</h2>
                <p>
                  You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will continue to have access to premium features until the end of the paid period.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Non-Refundable Items</h2>
                <p>The following are not eligible for refund:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Free tier usage</li>
                  <li>Subscription renewals (after the initial purchase)</li>
                  <li>Payments made more than 14 days ago</li>
                  <li>Accounts that have violated our Terms of Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Chargebacks</h2>
                <p>
                  If you initiate a chargeback through your payment provider, your account may be suspended pending investigation. We encourage you to contact us directly to resolve any billing issues.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Contact for Refunds</h2>
                <p>
                  For refund requests or questions about this policy, please contact us through the contact information provided in the Impressum.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


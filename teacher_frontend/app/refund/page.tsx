'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="glassmorphism rounded-lg p-8 border border-[#38BDF8]/20">
          <div className="flex items-center gap-3 mb-6">
            <RotateCcw className="w-8 h-8 text-[#38BDF8]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Refund &amp; Withdrawal Policy</h1>
              <p className="text-xs text-[#94A3B8] mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-5 text-sm text-[#E2E8F0] max-h-[80vh] overflow-y-auto pr-1">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                1. EU 14‑Day Right of Withdrawal
              </h2>
              <p>
                If you are an EU consumer, you generally have a 14‑day right to withdraw from distance contracts
                without giving any reason. The withdrawal period starts on the day the subscription contract is
                concluded.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                2. Digital Content / SaaS and Waiver
              </h2>
              <p>
                Our teacher dashboard is a digital service. If you request that we begin providing the service
                immediately and acknowledge that you thereby lose your statutory right of withdrawal once full
                performance has begun, your right of withdrawal may expire early in accordance with EU law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                3. Goodwill Refunds
              </h2>
              <p>
                Beyond statutory rights, we may offer goodwill refunds (e.g. within 14 days of first purchase) on a
                case‑by‑case basis. Renewals and long‑past payments are typically non‑refundable unless required by
                law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                4. Model Withdrawal Form
              </h2>
              <p className="text-xs text-[#A5B4FC] mb-2">
                This is the standard EU model form; adapt contact details before production use.
              </p>
              <pre className="whitespace-pre-wrap text-xs bg-[#020617] border border-[#1E293B] rounded-md p-3">
{`To [Company Name GmbH], [Street and Number], [Postal Code] [City], [Country], Email: [contact@example.com]:

I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service:

— Ordered on (*): ______________________
— Name of consumer(s): _________________________________
— Address of consumer(s): ______________________________
— Email address associated with the account: ____________

Signature of consumer(s) (only if this form is notified on paper):

________________________________

Date: ___________________________

(*) Delete as appropriate.`}
              </pre>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



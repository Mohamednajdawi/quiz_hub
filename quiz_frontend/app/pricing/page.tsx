'use client';

import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { configApi, PricingConfig, PricingTier } from '@/lib/api/config';

const FALLBACK_HERO = {
  title: 'Simple, transparent pricing',
  subtitle: 'Start for free with our starter quota. Upgrade when you need more capacity or collaboration.',
};

function TierCard({ tier }: { tier: PricingTier }) {
  const ctaVariant = tier.cta?.variant ?? (tier.highlighted ? 'primary' : 'outline');

  return (
    <Card
      className={`flex flex-col h-full border-2 transition-all ${
        tier.highlighted ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div className="mb-4">
        <CardHeader title={tier.name} description={tier.tagline} />
      </div>

      <div className="px-6">
        <div className="flex items-baseline gap-2 text-gray-900 mb-3">
          <span className="text-3xl font-bold">{tier.price}</span>
          {tier.price_suffix && <span className="text-sm text-gray-600">{tier.price_suffix}</span>}
        </div>
        {tier.description && <p className="text-sm text-gray-600 mb-6">{tier.description}</p>}

        {tier.features?.length ? (
          <ul className="space-y-3 text-sm text-gray-700">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {tier.cta && (
        <div className="mt-auto px-6 pb-6 pt-8">
          <Link href={tier.cta.href} className="block">
            <Button variant={ctaVariant} className="w-full">
              {tier.cta.label}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function PricingPage() {
  const { data, isLoading, error } = useQuery<PricingConfig>({
    queryKey: ['pricing-config'],
    queryFn: configApi.getPricing,
  });

  const hero = data?.hero ?? FALLBACK_HERO;
  const tiers = data?.tiers ?? [];

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{hero.title}</h1>
            {hero.subtitle && (
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">{hero.subtitle}</p>
            )}
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              Failed to load pricing. Please try again later.
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {tiers.map((tier) => (
                <TierCard key={tier.id ?? tier.name} tier={tier} />
              ))}
            </div>
          )}

          <Card className="mt-12">
            <CardHeader
              title="Have questions?"
              description="We love hearing from students, educators, and teams. Drop us a note and we’ll tailor a plan for you."
            />
            <div className="px-6 pb-6">
              <div className="text-sm text-gray-700">
                <p>
                  Email <a className="text-indigo-600 hover:underline" href="mailto:support@quizhub.com">support@quizhub.com</a> for billing questions, or reach out to
                  <a className="text-indigo-600 hover:underline" href="mailto:sales@quizhub.com"> sales@quizhub.com</a> if you are planning a rollout for your institution.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


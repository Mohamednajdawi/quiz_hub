'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { paymentApi } from '@/lib/api/payment';
import { configApi, PricingConfig, PricingTier } from '@/lib/api/config';

const FALLBACK_HERO = {
  title: 'Simple, transparent pricing',
  subtitle: 'Start for free with our starter quota. Upgrade when you need more capacity or collaboration.',
};

type BillingPeriod = 'monthly' | 'yearly';

function TierCard({ tier, billingPeriod, onUpgrade, isLoading }: { tier: PricingTier; billingPeriod: BillingPeriod; onUpgrade: (planId: string) => void; isLoading?: boolean }) {
  const ctaVariant = tier.cta?.variant ?? (tier.highlighted ? 'primary' : 'outline');
  
  // Determine which price to show
  const showAnnual = billingPeriod === 'yearly' && tier.price_annual;
  const displayPrice = showAnnual ? tier.price_annual : tier.price;
  const displaySuffix = showAnnual ? tier.price_suffix_annual : tier.price_suffix;
  
  // Check if this is the free tier (usually has "Free" or "0" price)
  const isFreeTier = tier.price === 'Free' || tier.price === '€0' || tier.price?.toLowerCase().includes('free') || displayPrice === 'Free' || displayPrice === '€0';
  
  // Check if CTA is for registration (starter tier) or external link
  const isRegistrationLink = tier.cta?.href === '/register';
  const isExternalLink = tier.cta?.href?.startsWith('http') || tier.cta?.href?.startsWith('mailto:');

  const handleClick = () => {
    if (isRegistrationLink || isExternalLink) {
      // Let the Link handle it
      return;
    }
    // For paid tiers, trigger checkout
    if (tier.id && !isFreeTier) {
      onUpgrade(tier.id);
    }
  };

  return (
    <Card
      className={`flex flex-col h-full border-2 transition-all ${
        tier.highlighted ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div className="mb-4">
        <CardHeader title={tier.name} description={tier.tagline} />
        {/* No credit card badge for free tier */}
        {isFreeTier && (
          <div className="px-6 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ No credit card required
            </span>
          </div>
        )}
      </div>

      <div className="px-6">
        <div className="flex items-baseline gap-2 text-gray-900 mb-2">
          <span className="text-3xl font-bold">{displayPrice}</span>
          {displaySuffix && <span className="text-sm text-gray-600">{displaySuffix}</span>}
        </div>
        {showAnnual && tier.annual_savings && (
          <p className="text-sm text-green-600 font-medium mb-3">{tier.annual_savings}</p>
        )}
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
          {isRegistrationLink || isExternalLink ? (
            <Link href={tier.cta.href} className="block">
              <Button variant={ctaVariant} className="w-full">
                {tier.cta.label}
              </Button>
            </Link>
          ) : (
            <Button 
              variant={ctaVariant} 
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                handleClick();
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : tier.cta.label}
            </Button>
          )}
          {/* Cancel anytime message for paid tiers */}
          {!isFreeTier && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Cancel anytime
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { data, isLoading, error } = useQuery<PricingConfig>({
    queryKey: ['pricing-config'],
    queryFn: configApi.getPricing,
  });

  const hero = data?.hero ?? FALLBACK_HERO;
  const tiers = data?.tiers ?? [];
  const isManageMode = searchParams?.get('manage') === 'true';

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return paymentApi.createCheckoutSession({
        plan_id: planId,
        success_url: `${baseUrl}/pricing?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Failed to create checkout session:', error);
    },
  });

  const handleUpgrade = (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login, then back to pricing
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    
    checkoutMutation.mutate(planId);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Success/Cancel Messages */}
          {searchParams?.get('success') === 'true' && (
            <Alert type="success" className="mb-6">
              Payment successful! Your subscription is now active. Refresh the page to see your Pro status.
            </Alert>
          )}
          {searchParams?.get('canceled') === 'true' && (
            <Alert type="error" className="mb-6">
              Payment was canceled. You can try again anytime.
            </Alert>
          )}
          {checkoutMutation.isError && (
            <Alert type="error" className="mb-6">
              {checkoutMutation.error instanceof Error 
                ? checkoutMutation.error.message 
                : 'Failed to start checkout. Please try again.'}
            </Alert>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {isManageMode ? 'Manage Subscription' : hero.title}
            </h1>
            {!isManageMode && hero.subtitle && (
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">{hero.subtitle}</p>
            )}
            {isManageMode && (
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
                Update your subscription plan or manage your billing information.
              </p>
            )}
            
            {/* Billing Period Tabs - Only show if not in manage mode */}
            {!isManageMode && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingPeriod === 'monthly'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingPeriod === 'yearly'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
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
                <TierCard 
                  key={tier.id ?? tier.name} 
                  tier={tier} 
                  billingPeriod={billingPeriod}
                  onUpgrade={handleUpgrade}
                  isLoading={checkoutMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Trust Section */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No credit card required for free plan</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure payment</span>
              </div>
            </div>
          </div>

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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </Layout>
    }>
      <PricingPageContent />
    </Suspense>
  );
}


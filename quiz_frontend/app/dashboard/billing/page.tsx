'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { subscriptionApi } from '@/lib/api/subscription';
import { Crown, RefreshCw, ShieldCheck, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/events';

function useSubscriptionDetails() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: subscriptionApi.getCurrentUserSubscription,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}

export function BillingContent() {
  const queryClient = useQueryClient();
  const subscriptionQuery = useSubscriptionDetails();
  const { data: subscription, isLoading, error, isFetching } = subscriptionQuery;
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const manageMutation = useMutation({
    mutationFn: (cancelAtPeriodEnd: boolean) => {
      if (!subscription?.stripe_subscription_id) {
        throw new Error('Unable to find your subscription. Please contact support.');
      }
      return subscriptionApi.cancelSubscription(
        subscription.stripe_subscription_id,
        cancelAtPeriodEnd
      );
    },
    onSuccess: (_data: unknown, cancelAtPeriodEnd: boolean) => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
      trackEvent({
        name: cancelAtPeriodEnd ? 'billing_cancel_scheduled' : 'billing_resumed',
      });
      setBanner({
        type: 'success',
        message: cancelAtPeriodEnd
          ? 'Cancellation scheduled. Your plan stays active until the end of this cycle.'
          : 'Subscription resumed. We’ll keep your plan active next billing cycle.',
      });
    },
    onError: (mutationError: unknown) => {
      setBanner({
        type: 'error',
        message:
          mutationError instanceof Error
            ? mutationError.message
            : 'We could not update your subscription. Please try again.',
      });
    },
  });

  const renewalText = useMemo(() => {
    if (!subscription?.current_period_end) return '—';
    try {
      return format(new Date(subscription.current_period_end), 'MMM d, yyyy');
    } catch {
      return subscription.current_period_end;
    }
  }, [subscription?.current_period_end]);

  const usage = useMemo(() => {
    const used = subscription?.monthly_generations;
    const remaining = subscription?.remaining_generations;
    const total = subscription?.monthly_limit ?? (
      typeof used === 'number' && typeof remaining === 'number'
        ? used + remaining
        : undefined
    );

    if (
      typeof used === 'number' &&
      typeof remaining === 'number' &&
      typeof total === 'number' &&
      total > 0
    ) {
      const clampedUsed = Math.min(total, Math.max(0, used));
      const clampedRemaining = Math.min(total, Math.max(0, remaining));
      const percent = Math.min(
        100,
        Math.max(0, Math.round((clampedUsed / total) * 100))
      );
      return {
        used: clampedUsed,
        remaining: clampedRemaining,
        total,
        percent,
      };
    }
    return null;
  }, [
    subscription?.monthly_generations,
    subscription?.remaining_generations,
    subscription?.monthly_limit,
  ]);

  const hasSubscription = !!subscription?.has_subscription;
  const isCanceled = Boolean(subscription?.cancel_at_period_end);

  const handleCancel = () => {
    const confirmed = window.confirm(
      'Your plan will remain active until the end of the billing cycle. Continue?'
    );
    if (confirmed) {
      manageMutation.mutate(true);
    }
  };
  const handleResume = () => manageMutation.mutate(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-10 w-1/3" />
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !subscription) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Alert type="error">
            Unable to load subscription details. Please refresh or contact support.
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {banner && (
          <Alert
            type={banner.type}
            className="flex items-start justify-between gap-4"
          >
            <span>{banner.message}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-sm underline text-current"
            >
              Dismiss
            </button>
          </Alert>
        )}
        {error && subscription && (
          <Alert type="error">
            We couldn’t refresh billing data right now. Showing the last known values.
          </Alert>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              Billing Center
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mt-2">
              Manage Subscription
            </h1>
            <p className="text-gray-600 mt-2">
              Review your current plan, usage, and renewal status. Upgrade or
              cancel any time—no surprises.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/pricing">
              <Button variant="primary">
                View Plans
                <Crown className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="mailto:support@progrezz.com">
              <Button variant="secondary">
                Need Help?
                <Info className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {!hasSubscription ? (
          <Card className="border border-dashed border-indigo-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  You’re on the free plan
                </h2>
                <p className="text-gray-600">
                  Unlock unlimited generations and premium features by
                  upgrading—no contracts required.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
                    Active Plan
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900 capitalize">
                    {subscription?.plan_type ?? 'Pro'}
                  </h2>
                </div>
              </div>

              <dl className="space-y-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {subscription?.status ?? 'active'}
                    {isCanceled && (
                      <span className="ml-2 text-xs text-amber-600 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Cancels soon
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Renews on</dt>
                  <dd className="font-medium text-gray-900">{renewalText}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Monthly limit</dt>
                  <dd className="font-medium text-gray-900">
                    {subscription?.monthly_limit ?? '—'} generations
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Used this month</dt>
                  <dd className="font-medium text-gray-900">
                    {subscription?.monthly_generations ?? '—'} generations
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-3">
                {isCanceled ? (
                  <Button
                    variant="primary"
                    onClick={handleResume}
                    disabled={manageMutation.isPending}
                  >
                    {manageMutation.isPending ? (
                      'Resuming…'
                    ) : (
                      <>
                        Resume Subscription <RefreshCw className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={manageMutation.isPending}
                    className="border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {manageMutation.isPending ? (
                      'Processing…'
                    ) : (
                      <>
                        Cancel at period end
                        <AlertTriangle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                <p className="text-xs text-gray-500">
                  Cancelling keeps access until the end of your current billing
                  period. You can resume anytime.
                </p>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
                      Usage this cycle
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {usage ? `${usage.used}/${usage.total}` : '—'}
                    </h2>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await subscriptionQuery.refetch();
                      trackEvent({ name: 'billing_refresh' });
                    } catch {
                      setBanner({
                        type: 'error',
                        message: 'We could not refresh usage right now. Please try again.',
                      });
                    }
                  }}
                  disabled={isFetching}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
              {usage ? (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${usage.percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {usage.used} used • {usage.remaining} remaining
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Usage data isn’t available for this plan yet.
                </p>
              )}

              <div className="mt-6 space-y-3 text-sm text-gray-600">
                {subscriptionQuery.dataUpdatedAt ? (
                  <p className="text-xs text-gray-500">
                    Updated{' '}
                    {formatDistanceToNow(subscriptionQuery.dataUpdatedAt, {
                      addSuffix: true,
                    })}
                  </p>
                ) : null}
                <p>
                  Need a higher limit or team plan?{' '}
                  <Link
                    href="/pricing"
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Compare plans
                  </Link>
                  .
                </p>
                <p>
                  Have billing questions? Email us at{' '}
                  <a
                    href="mailto:support@progrezz.com"
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    support@progrezz.com
                  </a>
                  .
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}


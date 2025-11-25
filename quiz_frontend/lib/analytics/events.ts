type AnalyticsEvent = {
  name: string;
  params?: Record<string, string | number | boolean>;
};

export function trackEvent({ name, params }: AnalyticsEvent) {
  if (typeof window === 'undefined') return;

  const gtag = (window as typeof window & { gtag?: Function }).gtag;
  if (!gtag) return;

  gtag('event', name, params);
}


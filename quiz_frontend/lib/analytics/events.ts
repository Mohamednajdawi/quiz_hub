type AnalyticsEvent = {
  name: string;
  params?: Record<string, string | number | boolean>;
};

/**
 * Analytics tracking function (disabled for BMB compliance).
 * Google Analytics is forbidden per BMB data protection agreement Clause 16.
 * This function is kept for API compatibility but does nothing.
 */
export function trackEvent({ name, params }: AnalyticsEvent) {
  // Google Analytics removed for BMB compliance
  // All tracking disabled to comply with Austrian data protection requirements
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event tracking disabled for BMB compliance:', name, params);
  }
}


'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function AnalyticsProvider() {
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (!GA_ID) {
      console.warn('Google Analytics measurement ID is not set');
    }
  }, []);

  if (!GA_ID || !consent?.analytics) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-tracking" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}


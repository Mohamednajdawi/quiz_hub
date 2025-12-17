'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { GenerationJobsProvider } from '@/contexts/GenerationJobsContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { CookieConsentManagerButton } from '@/components/CookieConsentManagerButton';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <CookieConsentProvider>
            <GenerationJobsProvider>
              {children}
              <CookieConsentBanner />
              <CookieConsentManagerButton />
            </GenerationJobsProvider>
          </CookieConsentProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}


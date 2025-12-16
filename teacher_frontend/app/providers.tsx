'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (renamed from cacheTime in v5)
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Refetch on mount to ensure fresh data after auth loads
            retry: (failureCount, error: any) => {
              // Retry network errors up to 2 times (reduced from 3 to fail faster)
              if (error?.message?.includes('Network error')) {
                return failureCount < 2;
              }
              // For other errors, only retry once
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Reduced max delay to 5s
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}


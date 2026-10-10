'use client';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { makeQueryClient } from '@/lib/query/query-client';
import { ThemeRegistry } from '@/theme/ThemeRegistry';

let browserClient: QueryClient | undefined;

/** One QueryClient per browser tab, a fresh one per server render (never share across users). */
function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return (
    <ThemeRegistry>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeRegistry>
  );
}

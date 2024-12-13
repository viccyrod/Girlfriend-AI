'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TokensProvider } from '@/providers/TokensProvider';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <TokensProvider>
          {children}
          <Toaster />
        </TokensProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 
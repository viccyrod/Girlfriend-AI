'use client'; // Marks this file as a Client Component

import React from 'react';
import { ThemeProvider } from "@/providers/ThemeProvider";
import TanStackProvider from "@/providers/TanStackProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import Footer from "@/components/footer"; // If Footer is a client component
// import { Providers } from './providers'; // If you have other providers

const queryClient = new QueryClient();

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <KindeProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <div className="h-screen flex flex-col">
            <div className="flex-1">
              <TanStackProvider>
                {/* Include other providers if necessary */}
                {/* <Providers> */}
                  {children}
                {/* </Providers> */}
              </TanStackProvider>
            </div>
            <Footer />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </KindeProvider>
  );
}

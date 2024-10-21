import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Footer from "@/components/footer";
import TanStackProvider from "@/providers/TanStackProvider";
import { KindeProviderClient } from "@/components/KindeProviderClient";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "💜 GIRLFRIEND 💜",
  description: "The most realistic AI Companions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geistSans.className}>
        <KindeProviderClient>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className='h-screen flex flex-col'>
              <div className='flex-1'>
                <TanStackProvider>
                  {children}
                </TanStackProvider>
              </div>
              <Footer />
            </div>
          </ThemeProvider>
        </KindeProviderClient>
      </body>
    </html>
  );
}

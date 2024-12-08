import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Footer from "@/components/footer";
import { getDbUser } from "@/lib/actions/server/auth";
import { Analytics } from "@vercel/analytics/react"
import React from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next"
import ClientProviders from "@/components/providers/ClientProviders";
import { ScrollArea } from "@/components/ui/scroll-area";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'Girlfriend - Your AI Companion',
    template: '%s | Girlfriend - Your AI Companion'
  },
  description: 'Connect with AI companions for meaningful conversations and relationships.',
  keywords: ['AI girlfriend', 'virtual companion', 'AI chat', 'relationship'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name/Company',
  metadataBase: new URL('https://girlfriend.cx'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://girlfriend.cx',
    title: 'Girlfriend - Your AI Companion',
    description: 'Connect with AI companions for meaningful conversations and relationships.',
    siteName: 'Girlfriend - Your AI Companion',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Girlfriend.cx Preview'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Girlfriend - Your AI Companion',
    description: 'Connect with AI companions for meaningful conversations and relationships.',
    images: ['/twitter-image.jpg'],
    creator: '@yourtwitter'
  },
  icons: {
    icon: '/gf-favicon.svg',
    shortcut: '/gf-favicon.svg',
    apple: '/gf-favicon.svg',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/gf-favicon.svg'
    }
  },
  manifest: '/site.webmanifest'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getDbUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className}`}>
        <ClientProviders>
          <ScrollArea className="h-screen">
            <main className="min-h-screen">
              {children}
              {!user && <Footer />}
            </main>
          </ScrollArea>
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
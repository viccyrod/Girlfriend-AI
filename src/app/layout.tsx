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
import { Toaster } from 'sonner';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'Girlfriend.cx - Your AI Companion for Meaningful Connections',
    template: '%s | Girlfriend.cx'
  },
  description: 'Create and connect with AI companions for deep, meaningful conversations and relationships. Experience personalized interactions in a safe, judgment-free space.',
  keywords: [
    'AI companion',
    'virtual girlfriend',
    'AI chat',
    'digital relationship',
    'AI conversation',
    'personal AI',
    'emotional connection',
    'AI interaction',
    'virtual companion',
    'AI friendship'
  ],
  authors: [{ name: 'Girlfriend.cx Team' }],
  creator: 'Girlfriend.cx',
  publisher: 'Girlfriend.cx',
  metadataBase: new URL('https://girlfriend.cx'),
  alternates: {
    canonical: 'https://girlfriend.cx'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://girlfriend.cx',
    siteName: 'Girlfriend.cx',
    title: 'Girlfriend.cx - Your AI Companion for Meaningful Connections',
    description: 'Create and connect with AI companions for deep, meaningful conversations and relationships. Experience personalized interactions in a safe, judgment-free space.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Girlfriend.cx - AI Companions for Meaningful Connections'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@girlfriend_cx',
    creator: '@girlfriend_cx',
    title: 'Girlfriend.cx - Your AI Companion',
    description: 'Create and connect with AI companions for deep, meaningful conversations and relationships.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/gf-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-site-verification',
  },
  category: 'technology',
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
        <Toaster />
      </body>
    </html>
  );
}
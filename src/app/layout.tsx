import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider"
import Footer from "@/components/footer";
import TanStackProvider from "@/providers/TanStackProvider";
import { getCurrentUser } from "@/lib/session";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

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
      url: '/og-image.jpg', // Your OpenGraph image
      width: 1200,
      height: 630,
      alt: 'Girlfriend.cx Preview'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Girlfriend - Your AI Companion',
    description: 'Connect with AI companions for meaningful conversations and relationships.',
    images: ['/twitter-image.jpg'], // Your Twitter card image
    creator: '@yourtwitter'
  },
  icons: {
    icon: '/gf-favicon.svg',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png'
    }
  },
  manifest: '/site.webmanifest'
}
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser(); // Add this line

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geistSans.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            <div className='h-screen flex flex-col'>
              <div className='flex-1'>
                <TanStackProvider>
                  {children}
                </TanStackProvider>
              </div>
              {!user && <Footer />} {/* Conditional rendering of Footer */}
              </div>
          </ThemeProvider>
      </body>
    </html>
  );
}
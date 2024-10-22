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
  title: "💜 GIRLFRIEND 💜",
  description: "The most realistic AI Companions",
};

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

import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MediCard';

export const metadata: Metadata = {
  title: `${appName} - Student Health ID`,
  description: 'Student ID Card Generation System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;700&family=Laila:wght@400;700&family=Mukta:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Tiro+Devanagari+Marathi:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}> */}
      <body className="antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
          <footer className="print:hidden bg-muted text-muted-foreground text-center py-4 text-sm">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

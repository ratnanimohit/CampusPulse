import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppContent } from '@/components/AppContent';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Campus Collab',
  description: 'A resource-sharing community for college students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <AppContent>{children}</AppContent>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

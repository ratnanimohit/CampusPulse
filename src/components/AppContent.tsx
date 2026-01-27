'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Redirect only if loading is complete and there's no verified user.
    if (!isUserLoading && (!user || !user.emailVerified) && pathname !== '/') {
      router.replace('/');
    }
  }, [isUserLoading, user, pathname, router]);

  const isLoading = isUserLoading || (!user && pathname !== '/');
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }
  
  // Don't render sidebar and header on the login page
  if (pathname === '/') {
    return <>{children}</>;
  }

  // If we reach here, user is loaded, verified, and not on the login page.
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

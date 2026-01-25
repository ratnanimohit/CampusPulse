'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/') {
      router.replace('/');
    }
  }, [isUserLoading, user, pathname, router]);

  if (isUserLoading || (!user && pathname !== '/')) {
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


  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

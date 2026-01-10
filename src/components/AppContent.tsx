'use client';

import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export function AppContent({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, router, pathname]);

  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  if (user === undefined) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  if (user === null) {
      return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

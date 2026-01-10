'use client';

import { useUser } from '@/firebase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  if (isUserLoading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    )
  }

  // If there's no user and we're not on the login page, redirect
  if (!user && pathname !== '/') {
    router.replace('/');
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
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useUser } from '@/firebase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export function AppContent({ children }: { children: React.ReactNode }) {
  const user = useUser();

  if (user === undefined) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    )
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

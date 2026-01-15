import Link from 'next/link';
import { SidebarNav } from '@/components/sidebar-nav';
import { Logo } from '@/components/Logo';

export function Sidebar() {
  return (
    <div className="hidden border-r bg-card md:fixed md:inset-y-0 md:left-0 md:z-10 md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center border-b px-4 lg:px-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline">
          <Logo className="h-6 w-6 text-primary" />
          <span className="">CampusPulse</span>
        </Link>
      </div>
      <SidebarNav className="overflow-y-auto" />
    </div>
  );
}

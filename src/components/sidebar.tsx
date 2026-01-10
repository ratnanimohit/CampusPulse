import Link from 'next/link';
import { Package2 } from 'lucide-react';
import { SidebarNav } from '@/components/sidebar-nav';

export function Sidebar() {
  return (
    <div className="hidden border-r bg-card md:flex md:flex-col w-64">
      <div className="flex h-16 items-center border-b px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="">Campus Collab</span>
        </Link>
      </div>
      <SidebarNav />
    </div>
  );
}

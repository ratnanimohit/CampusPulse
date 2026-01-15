import Link from 'next/link';
import { Menu, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { SidebarNav } from '@/components/sidebar-nav';

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline"
        >
          <Package2 className="h-6 w-6 text-primary" />
          <span className="sr-only">Campus Pulse</span>
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold font-headline"
              >
                <Package2 className="h-6 w-6 text-primary" />
                <span>Campus Pulse</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <SidebarNav isMobile={true} />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <UserNav />
      </div>
    </header>
  );
}

    
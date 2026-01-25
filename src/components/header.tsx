import Link from 'next/link';
import { Menu } from 'lucide-react';
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
import { Logo } from '@/components/Logo';
import React from 'react';
import { useAtom } from 'jotai';
import { navigationLockedAtom } from '@/lib/state/app-state';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Header() {
  const [navigationLocked] = useAtom(navigationLockedAtom);
  const { toast } = useToast();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (navigationLocked) {
      e.preventDefault();
      toast({
        variant: 'destructive',
        title: 'Action Required',
        description: 'Please submit your feedback before navigating away.',
      });
    }
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          aria-disabled={navigationLocked}
          className={cn(
            'flex items-center gap-2 text-lg font-semibold md:text-base font-headline',
            navigationLocked && 'cursor-not-allowed opacity-50'
          )}
        >
          <Logo className="h-6 w-6 text-primary" />
          <span className="sr-only">CampusPulse</span>
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden" disabled={navigationLocked}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                aria-disabled={navigationLocked}
                className={cn(
                  'flex items-center gap-2 font-semibold font-headline',
                  navigationLocked && 'cursor-not-allowed opacity-50'
                )}
              >
                <Logo className="h-6 w-6 text-primary" />
                <span>CampusPulse</span>
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

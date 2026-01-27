"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation'
import {
  Home,
  Package,
  PlusCircle,
  Users,
  Settings,
  History,
  FileQuestion,
  LogOut,
  Repeat,
  Radar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { useAuth, useUser } from '@/firebase';
import { useAtom } from 'jotai';
import { navigationLockedAtom } from '@/lib/state/app-state';
import { useToast } from '@/hooks/use-toast';


interface SidebarNavProps extends ComponentProps<'nav'> {
  isMobile?: boolean;
}

export function SidebarNav({ className, isMobile = false, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
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

  const handleSignOutClick = () => {
    if (navigationLocked) {
      toast({
        variant: 'destructive',
        title: 'Action Required',
        description: 'Please submit your feedback before navigating away.',
      });
      return;
    }
    auth.signOut();
  };
  
  const navLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/nearby-lockers', icon: Radar, label: 'Nearby Lockers' },
    { href: '/locker', icon: Package, label: 'My Locker' },
    { href: '/requests', icon: PlusCircle, label: 'New Request' },
    { href: '/my-requests', icon: FileQuestion, label: 'My Requests' },
    { href: '/transactions', icon: Repeat, label: 'Active Transactions' },
    { href: '/history', icon: History, label: 'History' },
    { href: user ? `/profile/${user.uid}` : '/profile', icon: Users, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (href: string) => {
    // For dynamic profile route, check if the path starts with /profile/
    if (href.includes('/profile/')) {
        return pathname.startsWith('/profile/');
    }
    return pathname === href;
  }

  const NavLink = ({ href, icon: Icon, label, badge, onClick }: typeof navLinks[0] & { badge?: string, onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void }) => (
    <Link
      href={href}
      onClick={(e) => {
        handleLinkClick(e);
        onClick?.(e);
      }}
      aria-disabled={navigationLocked}
      className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
        "text-primary bg-accent": isActive(href),
      }, navigationLocked && "cursor-not-allowed opacity-50")}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {badge}
        </Badge>
      )}
    </Link>
  );

  return (
    <div className={cn("flex h-full flex-col", isMobile ? "" : "max-h-screen")}>
      <nav
        className={cn(
          'grid items-start gap-1 p-2 text-sm font-medium lg:px-4 flex-grow',
          isMobile && 'grid-rows-auto grid-flow-row gap-4 pt-4',
          className
        )}
        {...props}
      >
        {navLinks.map(link => (user || (!link.href.includes('/profile') && !link.href.includes('/settings'))) && <NavLink key={link.href} {...link} />)}
        <button
          onClick={handleSignOutClick}
          disabled={navigationLocked}
          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary")}
          >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>
    </div>
  );
}

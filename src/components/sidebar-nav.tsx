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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { useAuth } from '@/firebase';

interface SidebarNavProps extends ComponentProps<'nav'> {
  isMobile?: boolean;
}

export function SidebarNav({ className, isMobile = false, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const auth = useAuth();
  
  const navLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/locker', icon: Package, label: 'My Locker' },
    { href: '/requests', icon: PlusCircle, label: 'New Request' },
    { href: '/my-requests', icon: FileQuestion, label: 'My Requests' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/profile', icon: Users, label: 'Profile' },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  }

  const NavLink = ({ href, icon: Icon, label, badge, onClick }: typeof navLinks[0] & { badge?: string, onClick?: () => void }) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
        "text-primary bg-accent": isActive(href),
      })}
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
          'grid items-start gap-1 p-2 text-sm font-medium lg:px-4',
          isMobile && 'grid-rows-auto grid-flow-row gap-4 pt-4',
          className
        )}
        {...props}
      >
        {navLinks.map(link => <NavLink key={link.href} {...link} />)}
      </nav>
      <div className={cn('mt-auto p-2 lg:px-4 space-y-1')}>
        <Link
            href="/settings"
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                "text-primary bg-accent": isActive("/settings"),
            })}
            >
            <Settings className="h-4 w-4" />
            Settings
        </Link>
        <button
            onClick={() => auth.signOut()}
            className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary")}
            >
            <LogOut className="h-4 w-4" />
            Sign Out
        </button>
       </div>
    </div>
  );
}

    
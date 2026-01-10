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
  Package2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface SidebarNavProps extends ComponentProps<'nav'> {
  isMobile?: boolean;
}

export function SidebarNav({ className, isMobile = false, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const navLinks = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/locker', icon: Package, label: 'My Locker' },
    { href: '/requests', icon: PlusCircle, label: 'New Request' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/profile', icon: Users, label: 'Profile' },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  }

  const NavLink = ({ href, icon: Icon, label, badge }: typeof navLinks[0]) => (
    <Link
      href={href}
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
          isMobile && 'grid-rows-auto grid-flow-row gap-4',
          className
        )}
        {...props}
      >
        {isMobile && (
           <Link href="/" className="flex items-center gap-2 font-semibold font-headline p-3">
              <Package2 className="h-6 w-6 text-primary" />
              <span className="">Campus Collab</span>
            </Link>
        )}
        {navLinks.map(link => <NavLink key={link.href} {...link} />)}
      </nav>
      <div className={cn('mt-auto p-2 lg:px-4')}>
        <Link
            href="/settings"
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                "text-primary bg-accent": isActive("/settings"),
            })}
            >
            <Settings className="h-4 w-4" />
            Settings
        </Link>
       </div>
    </div>
  );
}

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { navigationLockedAtom } from '@/lib/state/app-state';

type UserProfile = {
  firstName: string;
  lastName: string;
};

export function UserNav() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [navigationLocked] = useAtom(navigationLockedAtom);
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  if (!user) {
    return null;
  }
  
  const handleSignOut = async () => {
    // Disabled prop on DropdownMenuItem will prevent this from being called when locked.
    await auth.signOut();
    router.push('/');
  }

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
        return `${userProfile.firstName[0]}${userProfile.lastName[0]}`;
    }
    if (userProfile?.firstName) {
        return userProfile.firstName[0];
    }
    const name = user.displayName;
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.charAt(0).toUpperCase();
  };
  
  const displayName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (user.displayName || user.email?.split('@')[0] || 'New User');


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled={navigationLocked}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ''} alt={displayName} data-ai-hint="person avatar" />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild disabled={navigationLocked}>
            <Link href={`/profile/${user.uid}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={navigationLocked}>
             <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={navigationLocked}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

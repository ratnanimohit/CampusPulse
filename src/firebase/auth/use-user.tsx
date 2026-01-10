'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * A hook that provides the current signed-in user.
 *
 * @returns The current user object, or null if the user is not signed in. Returns undefined while loading.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
      },
      (error) => {
        console.error('Error in onAuthStateChanged: ', error);
        setUser(null);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return user;
}

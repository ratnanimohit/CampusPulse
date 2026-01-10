'use client';

import { useFirebase } from '@/firebase/provider';
import type { User } from 'firebase/auth';

export interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * A hook that provides the currently signed-in user.
 *
 * @returns The user object, `null` if not signed in, or `undefined` while loading.
 */
export function useUser(): UseUserResult {
  const { user, isUserLoading, userError } = useFirebase();

  // For this hook, we can just return the user state from the provider.
  // We can add more logic here if we need to derive state or add functionality.
  
  if (userError) {
      console.error("Error from useUser hook:", userError);
  }

  return { user, isUserLoading, userError };
}

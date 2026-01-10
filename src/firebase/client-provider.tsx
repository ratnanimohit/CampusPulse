'use client';

import { FirebaseProvider } from './provider';

/**
 * The FirebaseClientProvider component wraps the FirebaseProvider to ensure that Firebase is initialized only once on the client.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}

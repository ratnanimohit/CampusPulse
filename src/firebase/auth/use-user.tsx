'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

const mockUser = {
    uid: 'mock-user-id',
    email: 'student@gla.ac.in',
    displayName: 'GLA Student',
    photoURL: 'https://picsum.photos/seed/1/200/200',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
        creationTime: new Date().toUTCString(),
        lastSignInTime: new Date().toUTCString(),
    },
    providerData: [],
    // Add other methods and properties as needed, with mock implementations
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, authTime: '', expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({}),
    providerId: 'password',
    tenantId: null,
    phoneNumber: null
};


/**
 * A hook that provides a mock signed-in user.
 *
 * @returns The mock user object. Returns undefined while loading.
 */
export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Simulate async user loading
    const timer = setTimeout(() => {
        setUser(mockUser as unknown as User);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return user;
}

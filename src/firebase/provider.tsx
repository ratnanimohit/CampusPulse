'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { createContext, useContext, useMemo } from 'react';
import { initializeFirebase } from '.';

// Define the shape of the Firebase context.
type FirebaseContextValue = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

// Create the Firebase context.
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// Define the props for the FirebaseProvider component.
type FirebaseProviderProps = {
  children: React.ReactNode;
};

/**
 * The FirebaseProvider component initializes Firebase and provides the Firebase app, auth, and firestore instances to its children.
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  const contextValue = useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
    }),
    [firebaseApp, auth, firestore]
  );

  return <FirebaseContext.Provider value={contextValue}>{children}</FirebaseContext.Provider>;
}

// Define hooks for accessing the Firebase app, auth, and firestore instances.
export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext)?.firebaseApp;
export const useAuth = () => useContext(FirebaseContext)?.auth;
export const useFirestore = () => useContext(FirebaseContext)?.firestore;

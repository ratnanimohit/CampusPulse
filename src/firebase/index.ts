import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// The singleton Firebase app instance.
let firebaseApp: FirebaseApp;

/**
 * Initializes and returns the Firebase app instance.
 *
 * This function ensures that Firebase is initialized only once.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (!firebaseApp) {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';

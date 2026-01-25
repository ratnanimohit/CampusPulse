'use client';

import { atom } from 'jotai';

/**
 * A global state atom to control whether navigation throughout the app is locked.
 * This is used to prevent the user from navigating away when they must complete a critical action,
 * such as providing feedback after a transaction.
 */
export const navigationLockedAtom = atom(false);

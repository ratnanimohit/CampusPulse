import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A simple, non-cryptographic hash function for demonstration purposes.
 * Do NOT use for actual password hashing.
 * @param str The string to hash.
 * @returns A hash of the string.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      error => {
        console.warn(`Geolocation error: ${error.message}`);
        resolve(null); // On error, resolve with null
      }
    );
  });
};

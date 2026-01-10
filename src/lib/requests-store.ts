import { atom } from 'jotai';

export type Request = {
  id: string;
  itemName: string;
  reason: string;
  urgency: string;
  requiredBy: string;
};

const REQUESTS_STORAGE_KEY = 'communityRequests';

const getInitialRequests = (): Request[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const storedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY);
  return storedRequests ? JSON.parse(storedRequests) : [];
};

const baseRequestsAtom = atom<Request[]>(getInitialRequests());

export const requestsAtom = atom(
  (get) => get(baseRequestsAtom),
  (get, set, newRequests: Request[] | ((prev: Request[]) => Request[])) => {
    const updatedRequests = typeof newRequests === 'function' 
      ? newRequests(get(baseRequestsAtom)) 
      : newRequests;
    set(baseRequestsAtom, updatedRequests);
    if (typeof window !== 'undefined') {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
    }
  }
);

import { atom } from 'jotai';

export type Request = {
  id: string;
  itemName: string;
  reason: string;
  urgency: string;
  requiredBy: string;
};

export const requestsAtom = atom<Request[]>([]);

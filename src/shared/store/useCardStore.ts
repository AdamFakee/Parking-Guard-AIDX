import { create } from 'zustand';
import { ICard, CardStatus, CardType } from '@/shared/types/card';

interface CardState {
  cards: ICard[];
  searchQuery: string;
  statusFilter: CardStatus | CardType | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: CardStatus | CardType | 'all') => void;
  renewCard: (id: string, months: number) => void;
  lockCard: (id: string, reason: string) => void;
  unlockCard: (id: string) => void;
}


export const useCardStore = create<CardState>((set) => ({
  cards: [],
  searchQuery: '',
  statusFilter: 'all',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  renewCard: () => {},
  lockCard: () => {},
  unlockCard: () => {},
}));

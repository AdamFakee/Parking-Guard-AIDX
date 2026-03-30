export type CardStatus = 'active' | 'expired' | 'locked' | 'expiring_soon';
export type CardType = 'monthly' | 'visitor' | 'staff';

export interface ICard {
  id: string;
  serialId: string;
  licensePlate: string;
  holderName: string;
  phoneNumber: string;
  type: CardType;
  status: CardStatus;
  expiredAt: string; // ISO date string
  ownerId?: string;
  vehicleType?: string;
  usageStatus: 'in' | 'out';
  activePlate?: string;
  activeEntryId?: string;
}

export interface CardState {
  cards: ICard[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: CardStatus | CardType | 'all';

}

export interface CardActions {
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: CardStatus | CardType | 'all') => void;

  renewCard: (id: string, months: number) => void;
  lockCard: (id: string, reason: string) => void;
  unlockCard: (id: string) => void;
  getFilteredCards: () => ICard[];
}

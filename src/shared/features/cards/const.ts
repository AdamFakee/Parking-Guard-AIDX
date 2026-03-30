import { CardStatus, CardType } from '@/shared/types/card';

export const CARD_FILTERS: { label: string; value: CardStatus | CardType | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Thẻ tháng', value: 'monthly' },
  { label: 'Thẻ thường', value: 'visitor' },
];

import { useQuery } from '@tanstack/react-query';
import { getMonthlySubscriptions } from '../apis/monthly-card.api';

export function useMonthlySubscriptions() {
  return useQuery({
    queryKey: ['monthly-subscriptions'],
    queryFn: getMonthlySubscriptions,
    networkMode: 'always',
  });
}

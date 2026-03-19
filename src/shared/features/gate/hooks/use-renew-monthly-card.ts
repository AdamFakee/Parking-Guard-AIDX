import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renewMonthlyCard } from '../apis/gate.api';

export function useRenewMonthlyCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renewMonthlyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
    },
  });
}

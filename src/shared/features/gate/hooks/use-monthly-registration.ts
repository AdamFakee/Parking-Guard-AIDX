import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerMonthlyCard } from '../apis/monthly-card.api';

export function useMonthlyRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerMonthlyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
    },
  });
}

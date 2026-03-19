import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkIn, CheckInParams, checkOut, CheckOutParams, convertToRegularTicket } from '../apis/gate.api';

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CheckInParams) => checkIn(params),
    onSuccess: () => {
      // Invalidate stats to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CheckOutParams) => checkOut(params),
    onSuccess: () => {
      // Invalidate stats to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useConvertCardToRegular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardUid: string) => convertToRegularTicket(cardUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}



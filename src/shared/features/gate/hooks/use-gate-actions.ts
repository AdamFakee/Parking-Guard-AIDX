import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkIn, CheckInParams } from '../apis/gate.api';

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

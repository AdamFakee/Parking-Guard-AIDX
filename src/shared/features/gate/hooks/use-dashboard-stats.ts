import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../apis/gate.api';

export function useDashboardStats(shiftId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', shiftId],
    queryFn: () => getDashboardStats(shiftId!),
    enabled: !!shiftId,
    refetchInterval: 5000, // Refresh every 5 seconds for dashboard
  });
}

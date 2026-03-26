import { reportApis } from '@/shared/features/reports';
import { useQuery } from '@tanstack/react-query';

export const useShifts = (limit = 20) => {
  return useQuery({
    queryKey: ['reports', 'shifts', limit],
    queryFn: () => reportApis.getShifts(limit),
  });
};

import { reportApis } from '@/shared/features/reports';
import { useQuery } from '@tanstack/react-query';

export const useShiftDetails = (shiftId: string) => {
  return useQuery({
    queryKey: ['reports', 'shift-details', shiftId],
    queryFn: () => reportApis.getShiftDetails(shiftId),
    enabled: !!shiftId,
  });
};

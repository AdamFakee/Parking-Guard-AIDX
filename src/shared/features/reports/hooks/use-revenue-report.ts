import { reportApis } from '@/shared/features/reports';
import { useQuery } from '@tanstack/react-query';

export const useRevenueReport = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: () => reportApis.getRevenueReport(startDate, endDate),
  });
};

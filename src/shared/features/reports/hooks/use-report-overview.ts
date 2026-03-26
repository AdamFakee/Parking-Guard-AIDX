import { useQuery } from '@tanstack/react-query';
import { reportApis } from '../apis';

export const useReportOverview = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['reports', 'overview', startDate, endDate],
    queryFn: () => reportApis.getOverview(startDate, endDate),
  });
};

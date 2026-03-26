import { useQuery } from '@tanstack/react-query';
import { reportApis } from '../apis';

export const useReportOverview = () => {
  return useQuery({
    queryKey: ['reports', 'daily-overview'],
    queryFn: () => reportApis.getDailyOverview(),
  });
};

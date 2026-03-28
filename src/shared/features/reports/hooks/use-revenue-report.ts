import { reportApis } from '../apis/reports.api';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useRevenueReport = (startDate?: Date, endDate?: Date) => {
  const limit = 20;
  return useInfiniteQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: ({ pageParam = 0 }) => 
      reportApis.getRevenueReport(limit, pageParam as number, startDate, endDate),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length * limit : undefined;
    },
    initialPageParam: 0,
  });
};

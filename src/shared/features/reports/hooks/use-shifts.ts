import { reportApis } from '../apis/reports.api';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useShifts = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['reports', 'shifts', limit],
    queryFn: ({ pageParam = 0 }) => reportApis.getShifts(limit, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length * limit : undefined;
    },
  });
};

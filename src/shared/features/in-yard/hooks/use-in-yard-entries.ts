import { useInfiniteQuery } from '@tanstack/react-query';
import { getInYardEntries, GetInYardParams } from '../apis/in-yard.api';

export function useInYardEntries(params: Omit<GetInYardParams, 'page'>) {
  const limit = params.limit || 20;

  return useInfiniteQuery({
    queryKey: ['in-yard-entries', params],
    queryFn: ({ pageParam = 1 }) => getInYardEntries({ ...params, page: pageParam, limit }),
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      return lastPage.length < limit ? undefined : allPages.length + 1;
    },
    initialPageParam: 1,
    networkMode: 'always',
    refetchOnMount: 'always',
    staleTime: 30000, // 30s cache
    gcTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
    maxPages: 3, // Limit memory for infinite scroll
  });
}

import { useInfiniteQuery } from '@tanstack/react-query';
import { getEntriesByCard } from '../../gate/apis/gate.api';

const LIMIT = 10;

export function useGetCardEntries({ cardUid }: { cardUid: string }) {
  return useInfiniteQuery({
    queryKey: ['card-entries', cardUid],
    queryFn: ({ pageParam = 1 }) => getEntriesByCard({ cardUid, page: pageParam as number, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === LIMIT ? allPages.length + 1 : undefined;
    },
    staleTime: 10 * 1000, 
    networkMode: 'always',
  });
}

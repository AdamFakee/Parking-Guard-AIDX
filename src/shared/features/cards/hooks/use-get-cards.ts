import { useInfiniteQuery } from '@tanstack/react-query';
import { getCards } from '../apis/cards.api';
import { CardStatus, CardType } from '@/shared/types/card';

const LIMIT = 10;

export function useGetCards({ searchQuery, statusFilter }: { searchQuery?: string; statusFilter?: CardStatus | CardType | 'all' }) {

  return useInfiniteQuery({
    queryKey: ['cards', searchQuery, statusFilter],
    queryFn: ({ pageParam = 1 }) => getCards({ page: pageParam as number, limit: LIMIT, searchQuery, statusFilter }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has 10 items, we might have another page
      return lastPage.length === LIMIT ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    networkMode: 'always',
  });
}

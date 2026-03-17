import { useQuery } from '@tanstack/react-query';
import { getShiftHistory } from '../apis/shift.api';

export function useShiftHistory() {
  return useQuery({
    queryKey: ['shift-history'],
    queryFn: getShiftHistory,
    networkMode: 'always',
  });
}

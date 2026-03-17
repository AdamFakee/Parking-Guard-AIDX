import { useQuery } from '@tanstack/react-query';
import { getSystemConfig } from '../apis';

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: getSystemConfig,
    networkMode: 'always',
  });
}

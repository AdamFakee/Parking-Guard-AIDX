import { useQuery } from '@tanstack/react-query';
import { getAllStaff } from '../apis';


type Props = 'admin' | 'staff' | undefined;

export function useGetAllStaff(role?: Props, includeDeleted = false) {
  return useQuery({
    queryKey: ['all staffs', role, includeDeleted],
    queryFn: () => getAllStaff(role, includeDeleted),
    networkMode: 'always',
  });
}

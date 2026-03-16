import { useQuery } from '@tanstack/react-query';
import { getAllStaff } from '../apis';


type props = Parameters<typeof getAllStaff>[0];

export function useGetAllStaff(role: props) {
  return useQuery({
    queryKey: ['all staffs', role],
    queryFn: () => getAllStaff(role),
    networkMode: 'always',
  });
}

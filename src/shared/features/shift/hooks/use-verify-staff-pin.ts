import { useMutation } from '@tanstack/react-query';
import { verifyStaffPin } from '../apis';




export function useVerifyStaffPin() {
  return useMutation({
    mutationFn: verifyStaffPin,
    networkMode: 'always',
  });
}

import { useMutation } from '@tanstack/react-query';
import { closeShift } from '../apis/shift.api';

export function useCloseShift() {
  return useMutation({
    mutationFn: closeShift,
    networkMode: 'always',
  });
}

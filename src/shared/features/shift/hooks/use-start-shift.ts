import { useMutation } from '@tanstack/react-query';
import { startShift } from '../apis';

export function useStartShift() {
  return useMutation({
    mutationFn: startShift,
    networkMode: 'always',
  });
}

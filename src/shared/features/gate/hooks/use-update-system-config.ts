import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSystemConfig } from '../apis';

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) => updateSystemConfig(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
    networkMode: 'always',
  });
}

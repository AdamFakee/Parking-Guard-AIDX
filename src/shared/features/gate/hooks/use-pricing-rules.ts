import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule } from '../apis/gate.api';

export function usePricingRules() {
  return useQuery({
    queryKey: ['pricing-rules'],
    queryFn: getPricingRules,
    networkMode: 'always',
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    networkMode: 'always',
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) => updatePricingRule(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    networkMode: 'always',
  });
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    networkMode: 'always',
  });
}

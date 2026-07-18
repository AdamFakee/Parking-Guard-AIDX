import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPricingRule,
  deletePricingRule,
  getPricingRules,
  replacePricingRules,
  type PricingRuleInput,
  updatePricingRule,
} from '../apis/gate.api'

export function usePricingRules() {
  return useQuery({
    queryKey: ['pricing-rules'],
    queryFn: getPricingRules,
    networkMode: 'always',
  })
}

export function useReplacePricingRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: PricingRuleInput[]) => replacePricingRules(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
    },
    networkMode: 'always',
  })
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
    },
    networkMode: 'always',
  })
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      updatePricingRule(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
    },
    networkMode: 'always',
  })
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
    },
    networkMode: 'always',
  })
}

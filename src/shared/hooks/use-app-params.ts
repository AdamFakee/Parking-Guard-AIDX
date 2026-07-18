import type { RouteParamsMap } from '@/shared/constants/routes.const'
import { useLocalSearchParams } from 'expo-router'

export function useAppParams<K extends keyof RouteParamsMap>(_route?: K) {
  return useLocalSearchParams<RouteParamsMap[K]>()
}

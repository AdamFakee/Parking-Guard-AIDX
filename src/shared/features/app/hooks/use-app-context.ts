import { useSelector } from '@xstate/react'
import { useAppStore } from '../store/use-app-store'
import { DEFAULT_APP_CONTEXT } from '../types'

export function useAppContext() {
  const appService = useAppStore((s) => s.appService)
  return (
    useSelector(appService ?? undefined, (s) => s?.context) ?? DEFAULT_APP_CONTEXT
  )
}

export function useAppStateValue() {
  const appService = useAppStore((s) => s.appService)
  return useSelector(appService ?? undefined, (s) => s?.value)
}

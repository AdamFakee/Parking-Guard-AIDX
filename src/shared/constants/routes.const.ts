import type { Href } from 'expo-router'

export const ROUTES = {
  INDEX: { path: () => '/' as Href, params: {} as never },
  DEVICE_ACTIVATION: {
    path: () => '/(auth)/device-activation' as Href,
    params: {} as never,
  },
  DEVICE_LOCKED: {
    path: () => '/(auth)/device-locked' as Href,
    params: {} as never,
  },
  STAFF_LOGIN: {
    path: () => '/(auth)/staff-login' as Href,
    params: {} as never,
  },
  OPEN_SHIFT: {
    path: (p?: { staffId?: string; name?: string; role?: string }) =>
      (p?.staffId
        ? { pathname: '/(auth)/open-shift', params: p }
        : '/(auth)/open-shift') as Href,
    params: {} as { staffId?: string; name?: string; role?: string },
  },
  HOME: { path: () => '/(tab)' as Href, params: {} as never },
  GATE: {
    path: () => '/gate/scan-plate' as Href,
    params: {} as never,
  },
  ENTRY_DETAIL: {
    path: (id: string) =>
      ({ pathname: '/gate/entry-detail', params: { id } }) as Href,
    params: {} as { id: string },
  },
} as const

export type RouteName = keyof typeof ROUTES
export type RouteParamsMap = {
  [K in RouteName]: (typeof ROUTES)[K] extends { params: infer P } ? P : never
}

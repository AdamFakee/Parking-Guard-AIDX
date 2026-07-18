import { AxiosService } from '@/shared/lib/axios/axios.service'
import { getActiveShift, startShift as startShiftLocal } from './shift.api'

export interface CashSession {
  id: string
  code?: string
  posDeviceId: string
  cashierUserId?: string
  state: 'OPEN' | 'CLOSED' | string
  openedAt: string
  openingCash: number
  version?: number
}

const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== '0' &&
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false'

/** Remote cash-sessions — mock = local SQLite. */
export const ShiftRemoteAPI = {
  getOpenSessions: async (posDeviceId: string): Promise<CashSession[]> => {
    if (USE_MOCK) return []
    const axios = AxiosService.getInstance()
    const states = ['OPEN', 'CLOSING', 'RECONCILING'] as const
    for (const state of states) {
      try {
        const res = await axios.get<CashSession[] | { data: CashSession[] }>(
          `/v1/cash-sessions?state=${state}&posDeviceId=${posDeviceId}`,
        )
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        if (list.length) return list
      } catch {
        /* next state */
      }
    }
    return []
  },

  openShift: async (params: {
    posDeviceId: string
    openingCash: number
    staffId: string
    notes?: string
  }): Promise<CashSession> => {
    if (USE_MOCK) {
      const row = await startShiftLocal({
        staffId: params.staffId,
        openingCash: params.openingCash,
      })
      return {
        id: row.id,
        posDeviceId: params.posDeviceId,
        cashierUserId: params.staffId,
        state: 'OPEN',
        openedAt: row.startTime.toISOString(),
        openingCash: row.openingCash,
      }
    }
    const axios = AxiosService.getInstance()
    const res = await axios.post<CashSession>('/v1/cash-sessions', {
      posDeviceId: params.posDeviceId,
      openingCash: params.openingCash,
      notes: params.notes,
    })
    return res.data
  },

  getActiveLocal: getActiveShift,
}

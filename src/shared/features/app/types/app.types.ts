import type { DeviceInfo } from './device.types'
import type { Employee } from './employee.types'

export type { DeviceInfo, LicenseStatus, LicenseType } from './device.types'
export type { Employee, StaffRole } from './employee.types'

export interface AppContext {
  device: DeviceInfo | null
  accessToken: string | null
  employee: Employee | null
  cashSessionId: string | null
  error: string | null
}

export type AppEvent =
  | { type: 'DEVICE_ACTIVATED'; device: DeviceInfo }
  | {
      type: 'LOGIN_SUCCESS'
      accessToken: string
      employee: Employee
      device: DeviceInfo
    }
  | { type: 'SHIFT_OPENED'; cashSessionId: string }
  | { type: 'SHIFT_CLOSED' }
  | { type: 'LOGGED_OUT' }
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'DEVICE_RESET' }
  | { type: 'DEVICE_UNLOCKED' }
  | { type: 'ACCESS_TOKEN_REFRESHED'; accessToken: string }
  | { type: 'NETWORK_RESTORED' }

export const DEFAULT_APP_CONTEXT: AppContext = {
  device: null,
  accessToken: null,
  employee: null,
  cashSessionId: null,
  error: null,
}

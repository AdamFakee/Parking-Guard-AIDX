import type { DeviceInfo, Employee, LicenseStatus } from '@/shared/features/app/types'
import type { PricingRule, Staff, SystemConfig } from '@/shared/db'

/** Body kích hoạt — chỉ 1 mã. */
export interface DeviceActivationRequest {
  code: string
}

export interface LoginRequest {
  deviceId: string
  employeeCode: string
  pin: string
}

export interface LocalBootstrap {
  systemConfig?: Omit<SystemConfig, 'id'>
  pricingRules?: PricingRule[]
  staffList?: Staff[]
}

export interface LoginResponseData {
  accessToken: string
  refreshToken: string
  employee: Employee
  device: DeviceInfo
  bootstrap?: LocalBootstrap
}

export interface RefreshResponseData {
  accessToken: string
  refreshToken: string
}

export interface DeviceContextResponse {
  deviceId: string
  deviceCode: string
  deviceName: string
  isActive: boolean
  licenseStatus: LicenseStatus
  expiredAt: string
}

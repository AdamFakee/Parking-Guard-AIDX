export type LicenseType = 'offline' | 'online'
export type LicenseStatus = 'active' | 'expired' | 'revoked'

/** Device + license sau kích hoạt (1 mã). Persist MMKV. */
export interface DeviceInfo {
  id: string
  deviceCode: string
  name: string
  lotName: string
  tenantId: string
  licenseType: LicenseType
  licenseStatus: LicenseStatus
  expiredAt: string
  activatedAt: string
  graceMinutes?: number
  isActive?: boolean
}

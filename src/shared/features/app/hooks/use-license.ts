import type { DeviceInfo } from '../types'
import { useAppContext } from './use-app-context'

export function isOfflineLicense(device?: Pick<DeviceInfo, 'licenseType'> | null) {
  return device?.licenseType === 'offline'
}

export function isOnlineLicense(device?: Pick<DeviceInfo, 'licenseType'> | null) {
  return device?.licenseType === 'online'
}

/** Current device license flags — reuse instead of inline `licenseType ===`. */
export function useLicense() {
  const device = useAppContext().device
  const isOffline = isOfflineLicense(device)
  return {
    device,
    isOffline,
    isOnline: isOnlineLicense(device),
  }
}

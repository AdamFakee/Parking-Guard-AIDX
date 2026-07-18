import type { DeviceInfo, Employee } from '@/shared/features/app/types'
import type { PricingRule, Staff, SystemConfig } from '@/shared/db'
import { AxiosService } from '@/shared/lib/axios/axios.service'
import type {
  DeviceActivationRequest,
  DeviceContextResponse,
  LocalBootstrap,
  LoginRequest,
  LoginResponseData,
  RefreshResponseData,
} from '../types'

export type {
  DeviceActivationRequest,
  DeviceContextResponse,
  LocalBootstrap,
  LoginRequest,
  LoginResponseData,
  RefreshResponseData,
} from '../types'

const BODY_DELIVERY_HEADER = { 'X-Token-Delivery': 'body' } as const

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== '0' &&
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false'

const MOCK_DEVICE_BASE = {
  lotName: 'Bãi xe Trung tâm',
  tenantId: 'tenant_demo',
  name: 'Cổng chính',
}

function mockDeviceFromCode(code: string): DeviceInfo {
  const normalized = code.trim().toUpperCase()
  const isOffline = normalized.startsWith('OFF') || normalized.startsWith('PG-OFF')
  const now = new Date()
  const expiredAt = new Date(now)
  expiredAt.setDate(expiredAt.getDate() + 365)

  return {
    id: `dev_${normalized.replace(/[^A-Z0-9]/g, '_').slice(0, 24) || 'x'}`,
    deviceCode: normalized || 'UNKNOWN',
    name: MOCK_DEVICE_BASE.name,
    lotName: MOCK_DEVICE_BASE.lotName,
    tenantId: MOCK_DEVICE_BASE.tenantId,
    licenseType: isOffline ? 'offline' : 'online',
    licenseStatus: 'active',
    expiredAt: expiredAt.toISOString(),
    activatedAt: now.toISOString(),
    graceMinutes: isOffline ? undefined : 45,
    isActive: true,
  }
}

const MOCK_BOOTSTRAP: LocalBootstrap = {
  systemConfig: {
    lotName: 'Bãi xe Trung tâm',
    freeMinutes: 15,
    lostCardFee: 50000,
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountName: 'Nguyen Van A',
    qrImageUrl: null,
    monthlyPriceMotorbike: 150000,
    monthlyPriceCar: 1000000,
    monthlyPriceEbike: 120000,
    updatedAt: new Date(),
  } as Omit<SystemConfig, 'id'>,
  pricingRules: [
    {
      id: 'rule_1',
      vehicleType: 'motorbike',
      timeType: 'daytime',
      firstHours: 4,
      firstPrice: 5000,
      extraPerHour: 2000,
      maxPerDay: 20000,
      overnightPrice: null,
      overnightStartTime: null,
      overnightEndTime: null,
    },
    {
      id: 'rule_2',
      vehicleType: 'car',
      timeType: 'daytime',
      firstHours: 2,
      firstPrice: 20000,
      extraPerHour: 10000,
      maxPerDay: 100000,
      overnightPrice: null,
      overnightStartTime: null,
      overnightEndTime: null,
    },
  ] as PricingRule[],
  staffList: [
    { id: 'staff_1', pinHash: '1234', role: 'admin', name: 'Admin', isDeleted: false },
    { id: 'staff_2', pinHash: '1234', role: 'staff', name: 'NV 1', isDeleted: false },
  ] as Staff[],
}

export const AuthAPI = {
  /**
   * Kích hoạt thiết bị — 1 mã.
   * Mock: OFF* / PG-OFF* → offline; còn lại → online.
   */
  activateDevice: async (data: DeviceActivationRequest): Promise<DeviceInfo> => {
    const code = data.code?.trim()
    if (!code || code.length < 4) {
      throw new Error('Mã kích hoạt không hợp lệ')
    }

    if (USE_MOCK) {
      await delay()
      if (code.toUpperCase() === 'BAD') throw new Error('Mã kích hoạt không đúng')
      return mockDeviceFromCode(code)
    }

    const axios = AxiosService.getInstance()
    const response = await axios.post<DeviceInfo>('/v1/pos-devices/activate', {
      activationCode: code,
    })
    return response.data
  },

  getOfflineBootstrap: async (): Promise<LocalBootstrap> => {
    if (USE_MOCK) await delay(200)
    return MOCK_BOOTSTRAP
  },

  login: async (data: LoginRequest): Promise<LoginResponseData> => {
    if (USE_MOCK) {
      await delay()
      if (data.pin !== '1234') {
        throw new Error('Mã PIN không đúng. Gợi ý: 1234')
      }
      const device = mockDeviceFromCode(
        data.deviceId.startsWith('dev_')
          ? data.deviceId.replace(/^dev_/, '')
          : 'ON-DEMO',
      )
      device.licenseType = 'online'
      const employee: Employee = {
        id: 'staff_1',
        employeeCode: data.employeeCode || 'admin',
        displayName: 'Admin',
        role: 'admin',
        status: 'active',
      }
      return {
        accessToken: 'mock_jwt_access_token_12345',
        refreshToken: 'mock_jwt_refresh_token_67890',
        employee,
        device,
        bootstrap: MOCK_BOOTSTRAP,
      }
    }

    const axios = AxiosService.getInstance()
    const response = await axios.post<LoginResponseData>('/v1/device/auth/login', data, {
      headers: BODY_DELIVERY_HEADER,
    })
    return response.data
  },

  refresh: async (refreshToken: string): Promise<RefreshResponseData> => {
    if (USE_MOCK) {
      await delay(200)
      if (!refreshToken) {
        throw Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
      }
      return {
        accessToken: 'mock_jwt_access_token_refreshed',
        refreshToken: `${refreshToken}_r`,
      }
    }
    const axios = AxiosService.getInstance()
    const response = await axios.post<RefreshResponseData>(
      '/v1/device/auth/refresh',
      { refreshToken },
      { headers: BODY_DELIVERY_HEADER },
    )
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      if (USE_MOCK) {
        await delay(100)
        return
      }
      const axios = AxiosService.getInstance()
      await axios.post(
        '/v1/device/auth/logout',
        { refreshToken },
        { headers: BODY_DELIVERY_HEADER },
      )
    } catch {
      // client always succeeds
    }
  },

  getMe: async (): Promise<Employee> => {
    if (USE_MOCK) {
      await delay(150)
      return {
        id: 'staff_1',
        employeeCode: 'admin',
        displayName: 'Admin',
        role: 'admin',
        status: 'active',
      }
    }
    const axios = AxiosService.getInstance()
    const response = await axios.get<Employee>('/v1/device/auth/me')
    return response.data
  },

  getDeviceContext: async (): Promise<DeviceContextResponse> => {
    if (USE_MOCK) {
      await delay(150)
      const expiredAt = new Date()
      expiredAt.setDate(expiredAt.getDate() + 365)
      return {
        deviceId: 'dev_online',
        deviceCode: 'ON-DEMO',
        deviceName: MOCK_DEVICE_BASE.name,
        isActive: true,
        licenseStatus: 'active',
        expiredAt: expiredAt.toISOString(),
      }
    }
    const axios = AxiosService.getInstance()
    const response = await axios.get<DeviceContextResponse>('/v1/pos/device-context')
    return response.data
  },
}

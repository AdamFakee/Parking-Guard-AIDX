import type { useAppStore as UseAppStoreType } from '@/shared/features/app'
import type { AuthAPI as AuthAPIType } from '@/shared/features/auth'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { storage } from '@/shared/lib/mmkv'
import { toastQueue } from '@/shared/utils/toast.util'
import {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const getAppStore = (): typeof UseAppStoreType =>
  require('@/shared/features/app').useAppStore

const getAuthAPI = (): typeof AuthAPIType => require('@/shared/features/auth').AuthAPI

let isRefreshing = false
type QueuedRequest = { resolve: (token: string) => void; reject: (err: unknown) => void }
let failedQueue: QueuedRequest[] = []
let _axiosInstance: AxiosInstance | null = null

const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const accessToken = getAppStore().getState().appService?.getSnapshot().context.accessToken
  config.headers = new AxiosHeaders({
    ...config.headers,
    Authorization: accessToken ? `Bearer ${accessToken}` : '',
    'Content-Type': 'application/json',
  })
  return config
}

const onRequestError = (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
const onResponse = (response: AxiosResponse): AxiosResponse => response

const onResponseError = async (error: AxiosError): Promise<unknown> => {
  const originalRequest = error.config as CustomAxiosRequestConfig
  const status = error.response?.status
  const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh')

  if (status !== 401 || !originalRequest || isAuthEndpoint) {
    return Promise.reject(error)
  }

  if (originalRequest._retry) {
    getAppStore().getState().appService?.send({ type: 'TOKEN_EXPIRED' })
    toastQueue.show({
      type: 'error',
      text1: 'Phiên hết hạn',
      text2: 'Vui lòng đăng nhập lại.',
    })
    return Promise.reject(error)
  }

  const refreshToken = storage.getString(REFRESH_TOKEN_KEY) ?? null
  if (!refreshToken) {
    getAppStore().getState().appService?.send({ type: 'TOKEN_EXPIRED' })
    toastQueue.show({
      type: 'error',
      text1: 'Phiên hết hạn',
      text2: 'Vui lòng đăng nhập lại.',
    })
    return Promise.reject(error)
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then((newToken) => {
      originalRequest.headers = new AxiosHeaders({
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      })
      if (!_axiosInstance) return Promise.reject(new Error('Axios not ready'))
      return _axiosInstance(originalRequest)
    })
  }

  originalRequest._retry = true
  isRefreshing = true

  try {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await getAuthAPI().refresh(refreshToken)

    storage.set(REFRESH_TOKEN_KEY, newRefreshToken)
    getAppStore()
      .getState()
      .appService?.send({ type: 'ACCESS_TOKEN_REFRESHED', accessToken: newAccessToken })

    processQueue(null, newAccessToken)
    originalRequest.headers = new AxiosHeaders({
      ...originalRequest.headers,
      Authorization: `Bearer ${newAccessToken}`,
    })
    if (!_axiosInstance) return Promise.reject(new Error('Axios not ready'))
    return _axiosInstance(originalRequest)
  } catch (refreshError: unknown) {
    processQueue(refreshError, null)
    const isNetErr = !(refreshError as AxiosError)?.response
    if (isNetErr) {
      toastQueue.show({
        type: 'error',
        text1: 'Mất mạng',
        text2: 'Không thể làm mới phiên đăng nhập.',
      })
      return Promise.reject(refreshError)
    }
    getAppStore().getState().appService?.send({ type: 'TOKEN_EXPIRED' })
    toastQueue.show({
      type: 'error',
      text1: 'Phiên hết hạn',
      text2: 'Vui lòng đăng nhập lại.',
    })
    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
}

export function setupInterceptorsTo(axiosInstance: AxiosInstance): AxiosInstance {
  _axiosInstance = axiosInstance
  axiosInstance.interceptors.request.use(onRequest, onRequestError)
  axiosInstance.interceptors.response.use(onResponse, onResponseError)
  return axiosInstance
}
